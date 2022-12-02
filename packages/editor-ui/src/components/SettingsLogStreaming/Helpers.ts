import { INodeCredentials, INodeParameters, MessageEventBusDestinationOptions } from "n8n-workflow";
import { INodeUi, IRestApi } from "../../Interface";
import { useLogStreamingStore } from '../../stores/logStreamingStore';

export function destinationToFakeINodeUi(destination: MessageEventBusDestinationOptions, fakeType = 'n8n-nodes-base.stickyNote'): INodeUi {
	return {
		id: destination.id,
		name: destination.id,
		typeVersion: 1,
		type: fakeType,
		position: [0, 0],
		credentials: {
			...destination.credentials as INodeCredentials,
		},
		parameters: {
			...destination as unknown as INodeParameters,
		},
	} as INodeUi;
}

export async function saveDestinationToDb(restApi: IRestApi, destination: MessageEventBusDestinationOptions) {
	const logStreamingStore = useLogStreamingStore();
	if (destination.id) {
		const data: MessageEventBusDestinationOptions = {
			...destination,
			subscribedEvents: logStreamingStore.getSelectedEvents(destination.id),
		};
		await restApi.makeRestApiRequest('POST', '/eventbus/destination', data);
		logStreamingStore.updateDestination(destination);
	}
}
