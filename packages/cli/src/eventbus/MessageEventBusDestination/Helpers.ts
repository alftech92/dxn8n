/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MessageEventBusDestinationTypeNames } from 'n8n-workflow';
import { EventDestinations } from '../../databases/entities/MessageEventBusDestinationEntity';
import { MessageEventBusDestination } from './MessageEventBusDestination';
// import { MessageEventBusDestinationRedis } from './MessageEventBusDestinationRedis';
import { MessageEventBusDestinationSentry } from './MessageEventBusDestinationSentry';
import { MessageEventBusDestinationSyslog } from './MessageEventBusDestinationSyslog';
import { MessageEventBusDestinationWebhook } from './MessageEventBusDestinationWebhook';

export function messageEventBusDestinationFromDb(
	dbData: EventDestinations,
): MessageEventBusDestination | null {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
	const destinationData = dbData.destination;
	if ('__type' in destinationData) {
		switch (destinationData.__type) {
			case MessageEventBusDestinationTypeNames.sentry:
				return MessageEventBusDestinationSentry.deserialize(destinationData);
			case MessageEventBusDestinationTypeNames.syslog:
				return MessageEventBusDestinationSyslog.deserialize(destinationData);
			// case MessageEventBusDestinationTypeNames.redis:
			// 	return MessageEventBusDestinationRedis.deserialize(destinationData);
			case MessageEventBusDestinationTypeNames.webhook:
				return MessageEventBusDestinationWebhook.deserialize(destinationData);
			default:
				console.log('MessageEventBusDestination __type unknown');
		}
	}
	return null;
}
