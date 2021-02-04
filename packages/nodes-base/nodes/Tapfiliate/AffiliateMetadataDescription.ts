import {
	INodeProperties,
} from 'n8n-workflow';

export const affiliateMetadataOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: `Add metadata to affiliate`,
			},
			{
				name: 'Remove',
				value: 'remove',
				description: `Remove metadata from affiliate`,
			},
			{
				name: 'Update',
				value: 'update',
				description: `Update affiliate's metadata`,
			},
		],
		default: 'Add',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const affiliateMetadataFields = [
	/* -------------------------------------------------------------------------- */
	/*                         affiliateMetadata:add                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'add',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	{
		displayName: 'Metadata',
		name: 'metadataUi',
		placeholder: 'Add Metadata',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'add',
				],
			},
		},
		default: '',
		typeOptions: {
			multipleValues: true,
		},
		description: 'Meta data',
		options: [
			{
				name: 'metadataValues',
				displayName: 'Metadata',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						description: 'Name of the metadata key to add.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to set for the metadata key.',
					},
				],
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                          ffiliateMetadata:remove                           */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'remove',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'remove',
				],
			},
		},
		default: '',
		description: 'Name of the metadata key to remove.',
	},
	/* -------------------------------------------------------------------------- */
	/*                         affiliateMetadata:update                           */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'update',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'update',
				],
			},
		},
		default: '',
		description: 'Name of the metadata key to update.',
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'affiliateMetadata',
				],
				operation: [
					'update',
				],
			},
		},
		default: '',
		description: 'Value to set for the metadata key.',
	},
] as INodeProperties[];
