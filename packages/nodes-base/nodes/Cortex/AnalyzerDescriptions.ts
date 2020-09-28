import {
	INodeProperties,
} from 'n8n-workflow';

import {
	TLP,
}from './AnalyzerInterface';

export const analyzersOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		required: true,
		description: 'Choose an operation',
		displayOptions: {
			show: {
				resource: [
					'analyzer',
				],
			},
		},
		default: 'execute',
		options: [
			{
				name: 'Execute',
				value: 'execute',
				description: 'Execute Analyzer',
			},
		],
	},
] as INodeProperties[];

export const analyzerFields: INodeProperties[] =[
	{
		displayName: 'Analyzer Type',
		name: 'analyzer',
		type: 'options',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'loadActiveAnalyzers',
		},
		displayOptions:{
			show: {
				resource: [
					'analyzer',
				],
				operation:[
					'execute',
				],
			},
		},
		description: 'choose the analyzer',
		default: '',
	},
	{
		displayName: 'Observable Type',
		name: 'observableType',
		type: 'options',
		required: true,
		displayOptions:{
			show: {
				resource: [
					'analyzer',
				],
				operation:[
					'execute',
				],
			},
			hide:{
				analyzer:[
					'',
				],
			},
		},
		typeOptions:{
			loadOptionsMethod: 'loadObservableOptions',
			loadOptionsDependsOn: [
				'analyzer',
			],
		},
		default: '',
		description: 'Choose the observable type',
	},

	// Observable type != file
	{
		displayName: 'Observable Value',
		name: 'observableValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [
					'analyzer',
				],
				operation:[
					'execute',
				],
			},
			hide:{
				observableType: [
					'file',
				],
				analyzer:[
					'',
				],
			},
		},
		default: '',
		description: 'enter the observable value',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				observableType: [
					'file',
				],
				resource: [
					'analyzer',
				],
				operation: [
					'execute',
				],
			},
		},
		description: 'Name of the binary property to which to<br />write the data of the read file.',
	},
	{
		displayName: 'TLP',
		name: 'tlp',
		type: 'options',
		required: false,
		displayOptions:{
			show: {
				resource: [
					'analyzer',
				],
				operation: [
					'execute',
				],
			},
			hide:{
				observableType: [
					'',
				],
				analyzer: [
					'',
				],
			},
		},
		options: [
			{
				name: 'White',
				value: TLP.white,
			},
			{
				name: 'Green',
				value: TLP.green,
			},
			{
				name: 'Amber',
				value: TLP.amber,
			},{
				name: 'Red',
				value: TLP.red,
			}
		],
		default: 2,
		description: 'The TLP of the analyzed observable',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'analyzer',
				],
				operation: [
					'execute',
				],
			},
		},
		options: [
			{
				displayName: 'Force',
				name: 'force',
				type: 'boolean',
				default: false,
				description: 'To force bypassing the cache, set this parameter to true',
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 3,
				description: 'Timeout to wait for the report in case it is not available at the time the query was made',
			},
		],
	},
];
