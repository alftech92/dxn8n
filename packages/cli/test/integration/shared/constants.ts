import { ConnectionOptions } from 'typeorm';

import config = require('../../../config');
import { sqliteMigrations } from '../../../src/databases/sqlite/migrations';

export const REST_PATH_SEGMENT = config.get('endpoints.rest') as Readonly<string>;

export const AUTHLESS_ENDPOINTS: Readonly<string[]> = [
	'healthz',
	'metrics',
	config.get('endpoints.webhook') as string,
	config.get('endpoints.webhookWaiting') as string,
	config.get('endpoints.webhookTest') as string,
];

export const TEST_CONNECTION_OPTIONS: Readonly<ConnectionOptions> = {
	type: 'sqlite',
	database: ':memory:',
	entityPrefix: '',
	dropSchema: true,
	migrations: sqliteMigrations,
	migrationsTableName: 'migrations',
	migrationsRun: false,
	logging: false,
};

export const SUCCESS_RESPONSE_BODY = {
	data: {
		success: true,
	},
} as const;

export const LOGGED_OUT_RESPONSE_BODY = {
	data: {
		loggedOut: true,
	},
} as const;

export const USER_MANAGEMENT_ENDPOINT_GROUP = ['me', 'users', 'auth', 'owner', 'passwordReset'];

export const ROUTER_ENDPOINT_GROUP = ['credentials'];
