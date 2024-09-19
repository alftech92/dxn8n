import type {
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	INodeTypeBaseDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import { subscriberFields, subscriberOperations } from './SubscriberDescription';
import { mailerliteApiRequest, mailerliteApiRequestAllItems } from '../GenericFunctions';

export class MailerLiteV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			displayName: 'MailerLite',
			name: 'mailerLite',
			// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
			icon: 'file:MailerLite.svg',
			group: ['input'],
			version: 1,
			subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
			description: 'Consume Mailer Lite API',
			defaults: {
				name: 'MailerLite',
			},
			inputs: [NodeConnectionType.Main],
			outputs: [NodeConnectionType.Main],
			credentials: [
				{
					name: 'mailerLiteApi',
					required: true,
				},
			],
			properties: [
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
						{
							name: 'Subscriber',
							value: 'subscriber',
						},
					],
					default: 'subscriber',
				},
				...subscriberOperations,
				...subscriberFields,
			],
		};
	}

	methods = {
		loadOptions: {
			// Get all the available custom fields to display them to user so that they can
			// select them easily
			async getCustomFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const fields = await mailerliteApiRequest.call(this, 'GET', '/fields');
				for (const field of fields) {
					returnData.push({
						name: field.key,
						value: field.key,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const qs: IDataObject = {};
		let responseData;
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);
		for (let i = 0; i < length; i++) {
			try {
				if (resource === 'subscriber') {
					//https://developers.mailerlite.com/reference#create-a-subscriber
					if (operation === 'create') {
						const email = this.getNodeParameter('email', i) as string;

						const additionalFields = this.getNodeParameter('additionalFields', i);

						const body: IDataObject = {
							email,
							fields: [],
						};

						Object.assign(body, additionalFields);

						if (additionalFields.customFieldsUi) {
							const customFieldsValues = (additionalFields.customFieldsUi as IDataObject)
								.customFieldsValues as IDataObject[];

							if (customFieldsValues) {
								const fields = {};

								for (const customFieldValue of customFieldsValues) {
									//@ts-ignore
									fields[customFieldValue.fieldId] = customFieldValue.value;
								}

								body.fields = fields;
								delete body.customFieldsUi;
							}
						}

						responseData = await mailerliteApiRequest.call(this, 'POST', '/subscribers', body);
					}
					//https://developers.mailerlite.com/reference#single-subscriber
					if (operation === 'get') {
						const subscriberId = this.getNodeParameter('subscriberId', i) as string;

						responseData = await mailerliteApiRequest.call(
							this,
							'GET',
							`/subscribers/${subscriberId}`,
						);
					}
					//https://developers.mailerlite.com/reference#subscribers
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i);

						const filters = this.getNodeParameter('filters', i);

						Object.assign(qs, filters);

						if (returnAll) {
							responseData = await mailerliteApiRequestAllItems.call(
								this,
								'GET',
								'/subscribers',
								{},
								qs,
							);
						} else {
							qs.limit = this.getNodeParameter('limit', i);

							responseData = await mailerliteApiRequest.call(this, 'GET', '/subscribers', {}, qs);
						}
					}
					//https://developers.mailerlite.com/reference#update-subscriber
					if (operation === 'update') {
						const subscriberId = this.getNodeParameter('subscriberId', i) as string;

						const updateFields = this.getNodeParameter('updateFields', i);

						const body: IDataObject = {};

						Object.assign(body, updateFields);

						if (updateFields.customFieldsUi) {
							const customFieldsValues = (updateFields.customFieldsUi as IDataObject)
								.customFieldsValues as IDataObject[];

							if (customFieldsValues) {
								const fields = {};

								for (const customFieldValue of customFieldsValues) {
									//@ts-ignore
									fields[customFieldValue.fieldId] = customFieldValue.value;
								}

								body.fields = fields;
								delete body.customFieldsUi;
							}
						}

						responseData = await mailerliteApiRequest.call(
							this,
							'PUT',
							`/subscribers/${subscriberId}`,
							body,
						);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject[]),
				{ itemData: { item: i } },
			);

			returnData.push(...executionData);
		}

		return [returnData];
	}
}
