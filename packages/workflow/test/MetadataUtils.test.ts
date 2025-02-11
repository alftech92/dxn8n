import type { INodeExecutionData } from '@/.';
import { parseErrorResponseWorkflowMetadata, parseErrorMetadata } from '@/MetadataUtils';

describe('MetadataUtils', () => {
	describe('parseMetadata', () => {
		it('should return undefined if response does not have subworkflow data', () => {
			const response = { someKey: 'someValue' };
			const result = parseErrorResponseWorkflowMetadata(response);
			expect(result).toBeUndefined();
		});

		it('should return metadata if response has subworkflow data', () => {
			const response = { executionId: '123', workflowId: '456' };
			const expectedMetadata: INodeExecutionData['metadata'] = {
				subExecution: {
					executionId: '123',
					workflowId: '456',
				},
			};
			const result = parseErrorResponseWorkflowMetadata(response);
			expect(result).toEqual(expectedMetadata);
		});
	});

	describe('parseMetadataFromError', () => {
		it('should return undefined if error does not have response', () => {
			const error = { message: 'An error occurred' };
			const result = parseErrorMetadata(error);
			expect(result).toBeUndefined();
		});

		it('should return undefined if error response does not have subworkflow data', () => {
			const error = { errorResponse: { someKey: 'someValue' } };
			const result = parseErrorMetadata(error);
			expect(result).toBeUndefined();
		});

		it('should return metadata if error response has subworkflow data', () => {
			const error = { errorResponse: { executionId: '123', workflowId: '456' } };
			const expectedMetadata: INodeExecutionData['metadata'] = {
				subExecution: {
					executionId: '123',
					workflowId: '456',
				},
			};
			const result = parseErrorMetadata(error);
			expect(result).toEqual(expectedMetadata);
		});
	});
});
