import {
	OptionsWithUri,
} from 'request';

import {
	IAnalyzer,
	IJob,
	IResponder,
} from './AnalyzerInterface';

import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IExecuteSingleFunctions,
} from 'n8n-core';

import {
	IDataObject,
} from 'n8n-workflow';

export async function cortexApiRequest(this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions, method: string, resource: string, body: any = {}, query: IDataObject = {}, uri?: string, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	const credentials = this.getCredentials('cortexApi');

	if (credentials === undefined) {
		throw new Error('No credentials got returned!');
	}

	const headerWithAuthentication = Object.assign({}, { Authorization: ` Bearer ${credentials.cortexApiKey}`});

	let options: OptionsWithUri = {
		headers: headerWithAuthentication,
		method,
		qs: query,
		uri: uri || `${credentials.host}/api${resource}`,
		body,
		json: true,

	};
	if (Object.keys(option).length !== 0) {
		options = Object.assign({},options, option);
	}
	if (Object.keys(body).length ===  0) {
		delete options.body;
	}
	if (Object.keys(query).length ===  0) {
		delete options.qs;
	}

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		if (error.error ) {
			const errorMessage = `Cortex error response [${error.statusCode}]: ${error.error.message}`;
			throw new Error(errorMessage);
		} else throw error;
	}
}

export function getEntityLabel(entity: IDataObject): string{
	let label = '';
	switch (entity._type) {
		case  'case':
			label = `#${entity.caseId} ${entity.title}`;
			break;
		case  'case_artifact':
			//@ts-ignore
			label = `[${entity.dataType}] ${entity.data?entity.data:(entity.attachment.name)}`;
			break;
		case  'alert':
			label = `[${entity.source}:${entity.sourceRef}] ${entity.title}`;
			break;
		case  'case_task_log':
			label = `${entity.message} from ${entity.createdBy}`;
			break;
		case  'case_task':
			label = `${entity.title} (${entity.status})`;
			break;
		case  'job':
			label = `${entity.analyzerName} (${entity.status})`;
			break;
		default:
			break;
	}
	return label;
}
