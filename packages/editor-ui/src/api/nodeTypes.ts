import { makeRestApiRequest } from './helpers';
import type {
	INodeTranslationHeaders,
	IResourceLocatorReqParams,
	IResourceLocatorResponse,
	IRestApiContext,
} from '@/Interface';
import type {
	IDataObject,
	ILoadOptions,
	INodeCredentials,
	INodeParameters,
	INodePropertyOptions,
	INodeTypeDescription,
	INodeTypeNameVersion,
	IResourceLocatorResult,
} from 'n8n-workflow';

export async function getNodeTypes(
	context: IRestApiContext,
	{ onlyLatest } = { onlyLatest: false },
) {
	return makeRestApiRequest(context, 'GET', '/node-types', { onlyLatest });
}

export async function getNodeTranslationHeaders(
	context: IRestApiContext,
): Promise<INodeTranslationHeaders | undefined> {
	return makeRestApiRequest(context, 'GET', '/node-translation-headers');
}

export async function getNodesInformation(
	context: IRestApiContext,
	nodeInfos: INodeTypeNameVersion[],
): Promise<INodeTypeDescription[]> {
	return makeRestApiRequest(context, 'POST', '/node-types', { nodeInfos });
}

export async function getNodeParameterOptions(
	context: IRestApiContext,
	sendData: {
		nodeTypeAndVersion: INodeTypeNameVersion,
		path: string,
		methodName?: string,
		loadOptions?: ILoadOptions,
		currentNodeParameters: INodeParameters,
		credentials?: INodeCredentials,
	},
): Promise<INodePropertyOptions[]> {
	return makeRestApiRequest(context, 'GET', '/node-parameter-options', sendData);
}

export async function getResourceLocatorResults(
	context: IRestApiContext,
	sendData: IResourceLocatorReqParams,
): Promise<IResourceLocatorResponse> {
	return makeRestApiRequest(context, 'GET', '/nodes-list-search', sendData as unknown as IDataObject);
}

