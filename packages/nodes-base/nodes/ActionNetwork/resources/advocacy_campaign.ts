import { createPersonSignupHelperFields, createPersonSignupHelperObject } from './person';
import { INodeProperties } from 'n8n-workflow';
import { createListOperations, createFilterFields, createPaginationProperties, createFilterProperties } from '../helpers/fields';
import { IExecuteFunctions } from 'n8n-core/dist/src/Interfaces';
import { actionNetworkApiRequest } from '../helpers/request';
import { IDataObject } from '../../../../workflow/dist/src/Interfaces';

// https://actionnetwork.org/docs/v2/advocacy_campaigns
// Scenario: Retrieving a collection of event campaign resources (GET)
// Scenario: Retrieving an individual event campaign resource (GET)
// Scenario: Creating a new event campaign (POST)
// Scenario: Modifying an event campaign (PUT)

export const fields = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'GET',
		description: 'Operation to perform',
		options: [
			{
				name: 'Get',
				value: 'GET',
			},
			{
				name: 'Create (POST)',
				value: 'POST',
			},
			{
				name: 'Update (PUT)',
				value: 'PUT',
			},
		],
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
			},
		},
	},
	{
		displayName: 'Event Campaign ID',
		name: 'advocacy_campaign_id',
		type: 'string',
		default: '',
		required: false,
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'PUT', 'GET' ]
			},
		},
	},
	/**
	 * Adding or updating a resource
	 */
	{
		displayName: "Origin System",
		description: "A human readable string identifying where this advocacy_campaign originated. May be used in the user interface for this purpose.",
		name: "origin_system",
		type: "string",
		required: false,
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'POST', 'PUT' ]
			}
		},
	},
	{
		displayName: "Title",
		description: "The advocacy_campaign's public title. ",
		name: "title",
		type: "string",
		required: true,
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'POST', 'PUT' ]
			}
		},
	},
	{
		name: "description",
		type: "string",
		description: "The advocacy_campaign's description. May contain HTML.",
		required: false,
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'POST', 'PUT' ]
			}
		},
	},
	{
		name: "targets",
		type: "string",
		description: "The target universe for this advocacy campaign. (ex: 'U.S. Congress')",
		required: false,
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'POST', 'PUT' ]
			}
		},
	},
	{
		displayName: 'Additional properties',
		name: 'additional_properties',
		type: 'fixedCollection',
		default: '',
		placeholder: 'Add data',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'POST', 'PUT' ]
			}
		},
		options: [
			{
				name: 'identifiers',
				displayName: 'Custom ID',
				type: 'string',
				default: '',
			},
		]
	},
	/**
	 * Listing and getting resources
	 */
	...createListOperations({
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'GET' ],
				advocacy_campaign_id: [null, '', undefined]
			}
		}
	}),
	// Valid filter properties documented at https://actionnetwork.org/docs/v2#odata
	...createFilterFields({
		properties: [ 'identifier', 'created_date', 'modified_date', 'origin_system', 'title' ],
		displayOptions: {
			show: {
				resource: [ 'advocacy_campaign' ],
				operation: [ 'GET' ],
				advocacy_campaign_id: [null, '', undefined]
			}
		}
	}),
] as INodeProperties[];

export const resolve = async (node: IExecuteFunctions, i: number) => {
	const advocacy_campaign_id = node.getNodeParameter('advocacy_campaign_id', i) as string;
	const operation = node.getNodeParameter('operation', i) as 'GET' | 'PUT' | 'POST';
	let url = `/api/v2/advocacy_campaigns`

	if (advocacy_campaign_id && operation === 'GET') {
		return actionNetworkApiRequest.call(node, operation, `${url}/${advocacy_campaign_id}`) as Promise<IDataObject>
	}

	if (advocacy_campaign_id && operation === 'PUT') {
		let body: any = {
			'identifiers': (node.getNodeParameter('additional_properties', i, { identifiers: [] }) as any)?.identifiers,
			// @ts-ignore
			title: node.getNodeParameter('title', i) || undefined,
			description: node.getNodeParameter('description', i) || undefined,
			targets: node.getNodeParameter('targets', i, undefined),
			origin_system: node.getNodeParameter('origin_system', i) || undefined,
		}

		return actionNetworkApiRequest.call(node, operation, `${url}/${advocacy_campaign_id}`, body) as Promise<IDataObject>
	}

	if (operation === 'POST') {
		let body: any = {
			'identifiers': (node.getNodeParameter('additional_properties', i, { identifiers: [] }) as any)?.identifiers,
			// @ts-ignore
			title: node.getNodeParameter('title', i) || undefined,
			description: node.getNodeParameter('description', i) || undefined,
			targets: node.getNodeParameter('targets', i, undefined),
			origin_system: node.getNodeParameter('origin_system', i) || undefined,
		}

		return actionNetworkApiRequest.call(node, operation, url, body) as Promise<IDataObject>
	}

	// Otherwise list all
	const qs = {
		...createPaginationProperties(node),
		...createFilterProperties(node)
	}
	return actionNetworkApiRequest.call(node, 'GET', url, undefined, undefined, qs) as Promise<IDataObject[]>
}
