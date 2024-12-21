import type { PushMessage } from '@n8n/api-types';
import type { Application } from 'express';
import { ServerResponse } from 'http';
import type { Server } from 'http';
import { InstanceSettings } from 'n8n-core';
import type { Socket } from 'net';
import { Container, Service } from 'typedi';
import { parse as parseUrl } from 'url';
import { Server as WSServer } from 'ws';

import { AuthService } from '@/auth/auth.service';
import config from '@/config';
import type { User } from '@/databases/entities/user';
import { OnShutdown } from '@/decorators/on-shutdown';
import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { Publisher } from '@/scaling/pubsub/publisher.service';
import { TypedEmitter } from '@/typed-emitter';

import { SSEPush } from './sse.push';
import type { OnPushMessage, PushResponse, SSEPushRequest, WebSocketPushRequest } from './types';
import { WebSocketPush } from './websocket.push';

type PushEvents = {
	editorUiConnected: string;
	message: OnPushMessage;
};

const useWebSockets = config.getEnv('push.backend') === 'websocket';

/**
 * Push service for uni- or bi-directional communication with frontend clients.
 * Uses either server-sent events (SSE, unidirectional from backend --> frontend)
 * or WebSocket (bidirectional backend <--> frontend) depending on the configuration.
 *
 * @emits message when a message is received from a client
 */
@Service()
export class Push extends TypedEmitter<PushEvents> {
	isBidirectional = useWebSockets;

	private backend = useWebSockets ? Container.get(WebSocketPush) : Container.get(SSEPush);

	constructor(
		private readonly instanceSettings: InstanceSettings,
		private readonly publisher: Publisher,
	) {
		super();

		if (useWebSockets) this.backend.on('message', (msg) => this.emit('message', msg));
	}

	getBackend() {
		return this.backend;
	}

	handleRequest(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse) {
		const {
			ws,
			query: { pushRef },
			user,
		} = req;

		if (!pushRef) {
			if (ws) {
				ws.send('The query parameter "pushRef" is missing!');
				ws.close(1008);
				return;
			}
			throw new BadRequestError('The query parameter "pushRef" is missing!');
		}

		if (req.ws) {
			(this.backend as WebSocketPush).add(pushRef, user.id, req.ws);
		} else if (!useWebSockets) {
			(this.backend as SSEPush).add(pushRef, user.id, { req, res });
		} else {
			res.status(401).send('Unauthorized');
			return;
		}

		this.emit('editorUiConnected', pushRef);
	}

	broadcast(pushMsg: PushMessage) {
		this.backend.sendToAll(pushMsg);
	}

	/** Returns whether a given push ref is registered. */
	hasPushRef(pushRef: string) {
		return this.backend.hasPushRef(pushRef);
	}

	send(pushMsg: PushMessage, pushRef: string) {
		const { isWorker, isMultiMain } = this.instanceSettings;

		/**
		 * In scaling mode, in single- or multi-main setup, in a manual execution,
		 * a worker relays execution lifecycle events to all mains. Only the main
		 * who holds the session for the execution will push to the frontend who
		 * commissioned the execution.
		 *
		 * In scaling mode, in multi-main setup, in a manual webhook execution, if
		 * the main who handles a webhook is not the main who created the webhook,
		 * the handler main relays execution lifecycle events to all mains. Only
		 * the main who holds the session for the execution will push events to
		 * the frontend who commissioned the execution.
		 */
		if (isWorker || (isMultiMain && !this.hasPushRef(pushRef))) {
			void this.publisher.publishCommand({
				command: 'relay-execution-lifecycle-event',
				payload: { ...pushMsg, pushRef },
			});
			return;
		}

		this.backend.sendToOne(pushMsg, pushRef);
	}

	sendToUsers(pushMsg: PushMessage, userIds: Array<User['id']>) {
		this.backend.sendToUsers(pushMsg, userIds);
	}

	@OnShutdown()
	onShutdown() {
		this.backend.closeAllConnections();
	}
}

export const setupPushServer = (restEndpoint: string, server: Server, app: Application) => {
	if (useWebSockets) {
		const wsServer = new WSServer({ noServer: true });
		server.on('upgrade', (request: WebSocketPushRequest, socket: Socket, head) => {
			if (parseUrl(request.url).pathname === `/${restEndpoint}/push`) {
				wsServer.handleUpgrade(request, socket, head, (ws) => {
					request.ws = ws;

					const response = new ServerResponse(request);
					response.writeHead = (statusCode) => {
						if (statusCode > 200) ws.close();
						return response;
					};

					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					app.handle(request, response);
				});
			}
		});
	}
};

export const setupPushHandler = (restEndpoint: string, app: Application) => {
	const endpoint = `/${restEndpoint}/push`;
	const push = Container.get(Push);
	const authService = Container.get(AuthService);
	app.use(
		endpoint,
		// eslint-disable-next-line @typescript-eslint/unbound-method
		authService.authMiddleware,
		(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse) => push.handleRequest(req, res),
	);
};
