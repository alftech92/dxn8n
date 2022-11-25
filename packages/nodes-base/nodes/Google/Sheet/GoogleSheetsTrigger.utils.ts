import { IDataObject, IPollFunctions } from 'n8n-workflow';
import { apiRequest } from './v2/transport';
import { SheetDataRow, SheetRangeData } from './v2/helpers/GoogleSheets.types';

import * as XLSX from 'xlsx';
import { isEqual, zip } from 'lodash';

const BINARY_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function getRevisionFile(this: IPollFunctions, exportLink: string) {
	const mimeType = BINARY_MIME_TYPE;

	const response = await apiRequest.call(
		this,
		'GET',
		``,
		undefined,
		{ mimeType },
		exportLink,
		undefined,
		{
			resolveWithFullResponse: true,
			encoding: null,
			json: false,
		},
	);

	return Buffer.from(response.body as string);
}

export function sheetBinaryToArrayOfArrays(data: Buffer, sheetName: string) {
	const workbook = XLSX.read(data, { type: 'buffer', sheets: [sheetName] });
	const sheet = workbook.Sheets[sheetName];
	const sheetData: string[][] = sheet['!ref']
		? XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' })
		: [];

	return sheetData.filter((row) => row.filter((cell) => cell !== '').length);
}

export function arrayOfArraysToJson(sheetData: SheetRangeData, columns: SheetDataRow) {
	const returnData: IDataObject[] = [];

	for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
		const rowData: IDataObject = {};

		for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
			const columnName = columns[columnIndex];
			const cellValue = sheetData[rowIndex][columnIndex] || '';

			rowData[columnName] = cellValue;
		}

		returnData.push(rowData);
	}

	return returnData;
}

export function compareRevisions(
	previous: SheetRangeData,
	current: SheetRangeData,
	keyRow: number,
	includeInOutput: string,
	columnsToWatch?: string[],
) {
	const [dataLength, columns] =
		current.length > previous.length
			? [current.length, ['row_number', ...current[keyRow - 1]]]
			: [previous.length, ['row_number', ...previous[keyRow - 1]]];

	const diffData: Array<{
		rowIndex: number;
		previous: SheetDataRow;
		current: SheetDataRow;
	}> = [];

	for (let i = 0; i < dataLength; i++) {
		// columns row, continue
		if (i === keyRow - 1) {
			continue;
		}
		// sheets API omits trailing empty columns, xlsx does not - so we need to pad the shorter array
		while (current[i].length < previous[i].length) {
			current[i].push('');
		}

		// if columnsToWatch is defined, only compare those columns
		if (columnsToWatch && columnsToWatch.length) {
			const currentRow = columnsToWatch.map((column) => current[i][columns.indexOf(column) - 1]);
			const previousRow = columnsToWatch.map((column) => previous[i][columns.indexOf(column) - 1]);

			if (isEqual(currentRow, previousRow)) continue;
		} else {
			if (isEqual(current[i], previous[i])) continue;
		}

		diffData.push({
			rowIndex: i + 1,
			previous: previous[i],
			current: current[i],
		});
	}

	if (includeInOutput === 'previousVersion') {
		return arrayOfArraysToJson(
			diffData.map(({ previous, rowIndex }) => (previous ? [rowIndex, ...previous] : [rowIndex])),
			columns,
		);
	}
	if (includeInOutput === 'bothVersions') {
		const previousData = arrayOfArraysToJson(
			diffData.map(({ previous, rowIndex }) => (previous ? [rowIndex, ...previous] : [rowIndex])),
			columns,
		).map((row) => ({ previous: row }));

		const currentData = arrayOfArraysToJson(
			diffData.map(({ current, rowIndex }) => (current ? [rowIndex, ...current] : [rowIndex])),
			columns,
		).map((row) => ({ current: row }));

		return zip(previousData, currentData).map((row) => Object.assign({}, ...row));
	}

	return arrayOfArraysToJson(
		diffData.map(({ current, rowIndex }) => (current ? [rowIndex, ...current] : [rowIndex])),
		columns,
	);
}
