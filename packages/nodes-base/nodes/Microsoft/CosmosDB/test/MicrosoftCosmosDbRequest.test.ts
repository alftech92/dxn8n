/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { microsoftCosmosDbRequest } from '../GenericFunctions';

describe('GenericFunctions - microsoftCosmosDbRequest', () => {
	let mockContext: any;
	let mockRequestWithAuthentication: jest.Mock;

	beforeEach(() => {
		mockRequestWithAuthentication = jest.fn();
		mockContext = {
			helpers: {
				requestWithAuthentication: mockRequestWithAuthentication,
			},
			getCredentials: jest.fn(),
		};
	});

	test('should make a successful request with correct options', async () => {
		mockRequestWithAuthentication.mockResolvedValueOnce({ success: true });

		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({
			account: 'us-east-1',
			database: 'first_database_1',
			baseUrl: 'https://us-east-1.documents.azure.com/dbs/first_database_1',
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		const result = await microsoftCosmosDbRequest.call(mockContext, requestOptions);

		expect(mockRequestWithAuthentication).toHaveBeenCalledWith(
			'microsoftCosmosDbSharedKeyApi',
			expect.objectContaining({
				method: 'GET',
				baseURL: 'https://us-east-1.documents.azure.com/dbs/first_database_1',
				url: '/example-endpoint',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
				}),
				json: true,
			}),
		);

		expect(result).toEqual({ success: true });
	});

	test('should throw an error if account is missing in credentials', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'Database account not found in credentials!',
		);

		expect(mockRequestWithAuthentication).not.toHaveBeenCalled();
	});

	test('should throw a descriptive error for invalid credentials (403)', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({ account: 'us-east-1' });
		mockRequestWithAuthentication.mockRejectedValueOnce({
			statusCode: 403,
			response: {
				body: {
					message: 'The security token included in the request is invalid.',
				},
			},
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'The Cosmos DB credentials are not valid!',
		);

		expect(mockRequestWithAuthentication).toHaveBeenCalled();
	});

	test('should throw a descriptive error for invalid request signature (403)', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({ account: 'us-east-1' });
		mockRequestWithAuthentication.mockRejectedValueOnce({
			statusCode: 403,
			response: {
				body: {
					message: 'The request signature we calculated does not match the signature you provided',
				},
			},
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'The Cosmos DB credentials are not valid!',
		);

		expect(mockRequestWithAuthentication).toHaveBeenCalled();
	});

	test('should throw an error for resource not found (404)', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({ account: 'us-east-1' });
		mockRequestWithAuthentication.mockRejectedValueOnce({
			statusCode: 404,
			response: {
				body: {
					message: 'The specified resource does not exist.',
				},
			},
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'The requested resource was not found!',
		);

		expect(mockRequestWithAuthentication).toHaveBeenCalled();
	});

	test('should throw a generic error for unexpected response', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({ account: 'us-east-1' });
		mockRequestWithAuthentication.mockRejectedValueOnce({
			statusCode: 500,
			message: 'Internal Server Error',
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'Cosmos DB error response [500]: Internal Server Error',
		);

		expect(mockRequestWithAuthentication).toHaveBeenCalled();
	});

	test('should handle unexpected error structures', async () => {
		(mockContext.getCredentials as jest.Mock).mockResolvedValueOnce({ account: 'us-east-1' });
		mockRequestWithAuthentication.mockRejectedValueOnce({
			cause: { error: { message: 'Unexpected failure' } },
		});

		const requestOptions = {
			method: 'GET' as const,
			url: '/example-endpoint',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		await expect(microsoftCosmosDbRequest.call(mockContext, requestOptions)).rejects.toThrow(
			'Cosmos DB error response [undefined]: Unexpected failure',
		);

		expect(mockRequestWithAuthentication).toHaveBeenCalled();
	});
});
