import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZabbixApi implements ICredentialType {
	name = 'zabbixApi';

	displayName = 'Zabbix API';

	documentationUrl = 'zabbix';

	icon: Icon = 'file:icons/Zabbix.svg';

	httpRequestNode = {
		name: 'Zabbix',
		docsUrl: 'https://www.zabbix.com/documentation/current/en/manual/api',
		apiBaseUrl: '',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: 'https://zabbix.digital-boss.dev/zabbix/api_jsonrpc.php',
			method: 'POST',
			body: {
				jsonrpc: '2.0',
				method: 'host.get',
				params: {
					output: ['hostid', 'host'],
					selectInterfaces: ['interfaceid', 'ip'],
				},
				id: 2,
			},
			headers: {
				Authorization: 'Bearer {{$credentials.apiToken}}',
				'Content-Type': 'application/json-rpc',
			},
			json: true,
		},
	};
}
