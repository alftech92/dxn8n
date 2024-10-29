import { Service } from 'typedi';
import type WebSocket from 'ws';

import { Logger } from '@/logging/logger.service';

import type {
	RunnerMessage,
	N8nMessage,
	TaskRunnerServerInitRequest,
	TaskRunnerServerInitResponse,
} from './runner-types';
import { TaskBroker, type MessageCallback, type TaskRunner } from './task-broker.service';
import { TaskRunnerDisconnectAnalyzer } from './task-runner-disconnect-analyzer';

function heartbeat(this: WebSocket) {
	this.isAlive = true;
}

@Service()
export class TaskRunnerService {
	runnerConnections: Map<TaskRunner['id'], WebSocket> = new Map();

	constructor(
		private readonly logger: Logger,
		private readonly taskBroker: TaskBroker,
		private readonly disconnectAnalyzer: TaskRunnerDisconnectAnalyzer,
	) {}

	sendMessage(id: TaskRunner['id'], message: N8nMessage.ToRunner.All) {
		this.runnerConnections.get(id)?.send(JSON.stringify(message));
	}

	add(id: TaskRunner['id'], connection: WebSocket) {
		connection.isAlive = true;
		connection.on('pong', heartbeat);

		let isConnected = false;

		const onMessage = async (data: WebSocket.RawData) => {
			try {
				const buffer = Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data);

				const message: RunnerMessage.ToN8n.All = JSON.parse(
					buffer.toString('utf8'),
				) as RunnerMessage.ToN8n.All;

				if (!isConnected && message.type !== 'runner:info') {
					return;
				} else if (!isConnected && message.type === 'runner:info') {
					await this.removeConnection(id);
					isConnected = true;

					this.runnerConnections.set(id, connection);

					this.taskBroker.registerRunner(
						{
							id,
							taskTypes: message.types,
							lastSeen: new Date(),
							name: message.name,
						},
						this.sendMessage.bind(this, id) as MessageCallback,
					);

					this.logger.info(`Runner "${message.name}"(${id}) has been registered`);
					return;
				}

				void this.taskBroker.onRunnerMessage(id, message);
			} catch (error) {
				this.logger.error(`Couldn't parse message from runner "${id}"`, {
					error: error as unknown,
					id,
					data,
				});
			}
		};

		// Makes sure to remove the session if the connection is closed
		connection.once('close', async () => {
			connection.off('pong', heartbeat);
			connection.off('message', onMessage);
			await this.removeConnection(id);
		});

		connection.on('message', onMessage);
		connection.send(
			JSON.stringify({ type: 'broker:inforequest' } as N8nMessage.ToRunner.InfoRequest),
		);
	}

	async removeConnection(id: TaskRunner['id']) {
		const connection = this.runnerConnections.get(id);
		if (connection) {
			const disconnectReason = await this.disconnectAnalyzer.determineDisconnectReason(id);
			this.taskBroker.deregisterRunner(id, disconnectReason);
			connection.close();
			this.runnerConnections.delete(id);
		}
	}

	handleRequest(req: TaskRunnerServerInitRequest, _res: TaskRunnerServerInitResponse) {
		this.add(req.query.id, req.ws);
	}
}
