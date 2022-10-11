import { IExecuteFunctions } from 'n8n-core';
import { ISheetUpdateData, SheetProperties } from '../../helpers/GoogleSheets.types';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { GoogleSheet } from '../../helpers/GoogleSheet';
import { ValueInputOption, ValueRenderOption } from '../../helpers/GoogleSheets.types';
import { untilSheetSelected } from '../../helpers/GoogleSheets.utils';
import { cellFormat, locationDefine } from './commonDescription';

export const description: SheetProperties = [
	{
		displayName: 'Data Mode',
		name: 'dataMode',
		type: 'options',
		options: [
			{
				name: 'Auto-Map Input Data to Columns',
				value: 'autoMapInputData',
				description: 'Use when node input properties match destination column names',
			},
			{
				name: 'Map Each Column Below',
				value: 'defineBelow',
				description: 'Set the value for each destination column',
			},
			{
				name: 'Nothing',
				value: 'nothing',
				description: 'Do not send anything',
			},
		],
		displayOptions: {
			show: {
				operation: ['appendOrUpdate'],
			},
			hide: {
				...untilSheetSelected,
			},
		},
		default: 'defineBelow',
		description: 'Whether to insert the input data this node receives in the new row',
	},
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
		displayName: 'Column to match on',
		name: 'columnToMatchOn',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		typeOptions: {
			loadOptionsDependsOn: ['sheetName'],
			loadOptionsMethod: 'getSheetHeaderRow',
		},
		default: '',
		hint: "Used to find the correct row to update. Doesn't get changed.",
		displayOptions: {
			show: {
				operation: ['appendOrUpdate'],
			},
			hide: {
				...untilSheetSelected,
			},
		},
	},
	{
		displayName: 'Value of Column to Match On',
		name: 'valueToMatchOn',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['appendOrUpdate'],
				dataMode: ['defineBelow'],
			},
			hide: {
				...untilSheetSelected,
			},
		},
	},
	{
		displayName: 'Values to Send',
		name: 'fieldsUi',
		placeholder: 'Add Field',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				operation: ['appendOrUpdate'],
				dataMode: ['defineBelow'],
			},
			hide: {
				...untilSheetSelected,
			},
		},
		default: {},
		options: [
			{
				displayName: 'Field',
				name: 'values',
				values: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
						displayName: 'Column',
						name: 'column',
						type: 'options',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
						typeOptions: {
							loadOptionsDependsOn: ['sheetName'],
							loadOptionsMethod: 'getSheetHeaderRowAndAddColumn',
						},
						default: '',
					},
					{
						displayName: 'Column Name',
						name: 'columnName',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								column: ['newColumn'],
							},
						},
					},
					{
						displayName: 'Value',
						name: 'fieldValue',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['sheet'],
				operation: ['appendOrUpdate'],
			},
			hide: {
				...untilSheetSelected,
			},
		},
		options: [...cellFormat, ...locationDefine],
	},
];

export async function execute(
	this: IExecuteFunctions,
	sheet: GoogleSheet,
	sheetName: string,
): Promise<INodeExecutionData[]> {
	const items = this.getInputData();
	const updateData: ISheetUpdateData[] = [];
	const valueInputMode = this.getNodeParameter('options.cellFormat', 0, 'RAW') as ValueInputOption;

	for (let i = 0; i < items.length; i++) {
		const dataMode = this.getNodeParameter('dataMode', i) as
			| 'defineBelow'
			| 'autoMapInputData'
			| 'nothing';

		if (dataMode === 'nothing') continue;

		const options = this.getNodeParameter('options', i, {}) as IDataObject;

		const valueInputMode = (options.cellFormat || 'RAW') as ValueInputOption;
		const valueRenderMode = (options.valueRenderMode || 'UNFORMATTED_VALUE') as ValueRenderOption;

		const locationDefine = ((options.locationDefine as IDataObject) || {}).values as IDataObject;

		let headerRow = 0;
		let firstDataRow = 1;
		let range = `${sheetName}!A:Z`;

		if (locationDefine) {
			if (locationDefine.headerRow) {
				headerRow = parseInt(locationDefine.headerRow as string, 10) - 1;
			}
			if (locationDefine.firstDataRow) {
				firstDataRow = parseInt(locationDefine.firstDataRow as string, 10) - 1;
			}
			if (locationDefine.range) {
				range = `${sheetName}!${locationDefine.range}`;
			}
		}

		let columnNames: string[] = [];
		const response = await sheet.getData(
			`${sheetName}!${headerRow + 1}:${headerRow + 1}`,
			'FORMATTED_VALUE',
		);

		columnNames = response ? response[0] : [];
		const newColumns = new Set<string>();

		const data: IDataObject[] = [];
		const columnToMatchOn = this.getNodeParameter('columnToMatchOn', i) as string;

		if (dataMode === 'autoMapInputData') {
			data.push(items[i].json);
		} else {
			const valueToMatchOn = this.getNodeParameter('valueToMatchOn', i) as string;

			const fields = (this.getNodeParameter('fieldsUi.values', i, {}) as IDataObject[]).reduce(
				(acc, entry) => {
					if (entry.column === 'newColumn') {
						const columnName = entry.columnName as string;

						if (columnNames.includes(columnName) === false) {
							newColumns.add(columnName);
						}

						acc[columnName] = entry.fieldValue as string;
					} else {
						acc[entry.column as string] = entry.fieldValue as string;
					}
					return acc;
				},
				{} as IDataObject,
			);

			fields[columnToMatchOn] = valueToMatchOn;

			data.push(fields);
		}

		if (newColumns.size) {
			await sheet.updateRow(
				sheetName,
				[columnNames.concat([...newColumns])],
				(options.cellFormat as ValueInputOption) || 'RAW',
				headerRow + 1,
			);
		}

		const preparedData = await sheet.prepareDataForUpdateOrUpsert(
			data,
			columnToMatchOn,
			range,
			headerRow,
			firstDataRow,
			valueRenderMode,
			true,
		);

		updateData.push(...preparedData.updateData);

		if (preparedData.appendData.length) {
			await sheet.appendSheetData(
				preparedData.appendData,
				range,
				headerRow + 1,
				valueInputMode,
				false,
			);
		}
	}

	if (updateData.length) {
		await sheet.batchUpdate(updateData, valueInputMode);
	}
	return items;
}
