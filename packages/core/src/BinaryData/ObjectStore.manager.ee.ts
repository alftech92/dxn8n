/* eslint-disable @typescript-eslint/no-unused-vars */

import type { BinaryMetadata } from 'n8n-workflow';
import type { Readable } from 'stream';
import type { BinaryData } from './types';

// `/workflows/{workflowId}/executions/{executionId}/binary_data/{fileId}`

export class ObjectStoreManager implements BinaryData.Manager {
	async init() {
		throw new Error('TODO');
	}

	async store(binaryData: Buffer | Readable, executionId: string): Promise<string> {
		throw new Error('TODO');
	}

	getPath(identifier: string): string {
		throw new Error('TODO');
	}

	async getSize(identifier: string): Promise<number> {
		throw new Error('TODO');
	}

	async getBuffer(identifier: string): Promise<Buffer> {
		throw new Error('TODO');
	}

	getStream(identifier: string, chunkSize?: number): Readable {
		throw new Error('TODO');
	}

	async storeMetadata(identifier: string, metadata: BinaryMetadata): Promise<void> {
		throw new Error('TODO');
	}

	async getMetadata(identifier: string): Promise<BinaryMetadata> {
		throw new Error('TODO');
	}

	async copyByPath(path: string, executionId: string): Promise<string> {
		throw new Error('TODO');
	}

	async copyByIdentifier(identifier: string, executionId: string): Promise<string> {
		throw new Error('TODO');
	}

	async deleteOne(identifier: string): Promise<void> {
		throw new Error('TODO');
	}

	async deleteManyByExecutionIds(executionIds: string[]): Promise<string[]> {
		throw new Error('TODO');
	}
}
