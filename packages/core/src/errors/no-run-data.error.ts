import { ApplicationError } from 'n8n-workflow';

export class NoRunDataError extends ApplicationError {
	constructor() {
		super('No run data.');
	}
}
