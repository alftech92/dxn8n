export interface IRequestBody {
	[key: string]: string | IAttributeValue | undefined | boolean | object | number;
	TableName: string;
	Key?: object;
	IndexName?: string;
	ProjectionExpression?: string;
	KeyConditionExpression?: string;
	ExpressionAttributeValues?: IAttributeValue;
	ConsistentRead?: boolean;
	FilterExpression?: string;
	Limit?: number;
	ExclusiveStartKey?: IAttributeValue;
}

export interface IAttributeValue {
	[attribute: string]: DynamoDBAttributeValue;
}

export interface IAttributeValueValue {
	[type: string]: DynamoDBAttributeValue;
}

export interface IAttributeValueUi {
	attribute: string;
	type: AttributeValueType;
	value: string;
}

export interface IAttributeNameUi {
	key: string;
	value: string;
}

export type AttributeValueType =
	| 'B' // binary
	| 'BOOL' // boolean
	| 'BS' // binary set
	| 'L' // list
	| 'M' // map
	| 'N' // number
	| 'NULL'
	| 'NS' // number set
	| 'S' // string
	| 'SS'; // string set

export type PartitionKey = {
	details: {
		name: string;
		type: string;
		value: string;
	};
};

export const enum EAttributeValueType {
	S = 'S',
	SS = 'SS',
	M = 'M',
	L = 'L',
	NS = 'NS',
	N = 'N',
	BOOL = 'BOOL',
	B = 'B',
	BS = 'BS',
	NULL = 'NULL',
}

export interface IExpressionAttributeValue {
	attribute: string;
	type: EAttributeValueType;
	value: string;
}

export type FieldsUiValues = Array<{
	fieldId: string;
	fieldValue: string;
}>;

export type DynamoDBAttributeValue = {
	S?: string;
	N?: string;
	B?: string;
	BOOL?: boolean;
	NULL?: boolean;
	M?: { [key: string]: DynamoDBAttributeValue };
	L?: DynamoDBAttributeValue[];
	SS?: string[];
	NS?: string[];
	BS?: string[];
};

export type PutItemUi = {
	[key: string]: any;
};

export type AdjustedPutItem = {
	[attribute: string]: DynamoDBAttributeValue;
};
