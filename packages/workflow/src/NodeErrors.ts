/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-shadow */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { parseString } from 'xml2js';
import { removeCircularRefs, isTraversableObject } from './utils';
import type { IDataObject, INode, IStatusCodeMessages, JsonObject } from './Interfaces';

type Severity = 'warning' | 'error';

/**
 * Top-level properties where an error message can be found in an API response.
 */
const ERROR_MESSAGE_PROPERTIES = [
	'cause',
	'error',
	'message',
	'Message',
	'msg',
	'messages',
	'description',
	'reason',
	'detail',
	'details',
	'errors',
	'errorMessage',
	'errorMessages',
	'ErrorMessage',
	'error_message',
	'_error_message',
	'errorDescription',
	'error_description',
	'error_summary',
	'title',
	'text',
	'field',
	'err',
	'type',
];

/**
 * Top-level properties where an HTTP error code can be found in an API response.
 */
const ERROR_STATUS_PROPERTIES = [
	'statusCode',
	'status',
	'code',
	'status_code',
	'errorCode',
	'error_code',
];

/**
 * Properties where a nested object can be found in an API response.
 */
const ERROR_NESTING_PROPERTIES = ['error', 'err', 'response', 'body', 'data'];

interface ExecutionBaseErrorOptions {
	cause?: Error | JsonObject;
}

export abstract class ExecutionBaseError extends Error {
	description: string | null | undefined;

	cause: Error | JsonObject | undefined;

	timestamp: number;

	context: IDataObject = {};

	lineNumber: number | undefined;

	constructor(message: string, { cause }: ExecutionBaseErrorOptions) {
		const options = cause instanceof Error ? { cause } : {};
		super(message, options);

		this.name = this.constructor.name;
		this.timestamp = Date.now();

		if (cause instanceof ExecutionBaseError) {
			this.context = cause.context;
		} else if (cause && !(cause instanceof Error)) {
			this.cause = cause;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	toJSON?(): any {
		return {
			message: this.message,
			lineNumber: this.lineNumber,
			timestamp: this.timestamp,
			name: this.name,
			description: this.description,
			context: this.context,
			cause: this.cause,
		};
	}
}

/**
 * Base class for specific NodeError-types, with functionality for finding
 * a value recursively inside an error object.
 */
export abstract class NodeError extends ExecutionBaseError {
	node: INode;

	severity: Severity = 'error';

	constructor(node: INode, error: Error | JsonObject) {
		const message = error instanceof Error ? error.message : '';
		super(message, { cause: error });
		this.node = node;
	}

	/**
	 * Finds property through exploration based on potential keys and traversal keys.
	 * Depth-first approach.
	 *
	 * This method iterates over `potentialKeys` and, if the value at the key is a
	 * truthy value, the type of the value is checked:
	 * (1) if a string or number, the value is returned as a string; or
	 * (2) if an array,
	 * 		its string or number elements are collected as a long string,
	 * 		its object elements are traversed recursively (restart this function
	 *    with each object as a starting point), or
	 * (3) if it is an object, it traverses the object and nested ones recursively
	 * 		based on the `potentialKeys` and returns a string if found.
	 *
	 * If nothing found via `potentialKeys` this method iterates over `traversalKeys` and
	 * if the value at the key is a traversable object, it restarts with the object as the
	 * new starting point (recursion).
	 * If nothing found for any of the `traversalKeys`, exploration continues with remaining
	 * `traversalKeys`.
	 *
	 * Otherwise, if all the paths have been exhausted and no value is eligible, `null` is
	 * returned.
	 *
	 */
	protected findProperty(
		jsonError: JsonObject,
		potentialKeys: string[],
		traversalKeys: string[] = [],
	): string | null {
		for (const key of potentialKeys) {
			const value = jsonError[key];
			if (value) {
				if (typeof value === 'string') return value;
				if (typeof value === 'number') return value.toString();
				if (Array.isArray(value)) {
					const resolvedErrors: string[] = value
						.map((jsonError) => {
							if (typeof jsonError === 'string') return jsonError;
							if (typeof jsonError === 'number') return jsonError.toString();
							if (isTraversableObject(jsonError)) {
								return this.findProperty(jsonError, potentialKeys);
							}
							return null;
						})
						.filter((errorValue): errorValue is string => errorValue !== null);

					if (resolvedErrors.length === 0) {
						return null;
					}
					return resolvedErrors.join(' | ');
				}
				if (isTraversableObject(value)) {
					const property = this.findProperty(value, potentialKeys);
					if (property) {
						return property;
					}
				}
			}
		}

		for (const key of traversalKeys) {
			const value = jsonError[key];
			if (isTraversableObject(value)) {
				const property = this.findProperty(value, potentialKeys, traversalKeys);
				if (property) {
					return property;
				}
			}
		}

		return null;
	}
}

interface NodeOperationErrorOptions {
	message?: string;
	description?: string;
	runIndex?: number;
	itemIndex?: number;
	severity?: Severity;
}

const COMMON_NODE_JS_ERRORS: IDataObject = {
	ECONNREFUSED:
		'The connection could not be established because the specified address is not reachable, perhaps the server is offline',
	ECONNRESET:
		'The connection to the server wes closed unexpectedly, perhaps it is offline. You can retry request immidiately or wait and retry later.',
	ENOTFOUND:
		'The connection cannot be established, this usually occurs due to an incorrect host(domain) value',
	ETIMEDOUT:
		"The connection timed out, consider setting 'Retry on Fail' option in the node settings",
	ERRADDRINUSE:
		'The port is already occupied by some other application, if possible change the port or kill the application that is using it',
	EADDRNOTAVAIL: 'The address is not available, ensure that you have the right IP address',
	ECONNABORTED: 'The connection was aborted, perhaps the server is offline',
	EHOSTUNREACH: 'The host is unreachable, perhaps the server is offline',
	EAI_AGAIN: 'The DNS server returned an error, perhaps the server is offline',
	ENOENT: 'The file or directory does not exist',
	EISDIR: 'The file path expected but a given path is a directory',
	ENOTDIR: 'The directory path expected but a given path is a file',
	EACCES: 'Forbidden by access permissions, make sure you have the right permissions',
	EEXIST: 'The file or directory already exists',
	EPERM: 'Operation not permitted, make sure you have the right permissions',
};

function setCommonNodeJsErrorMessage(
	message: string,
	description: string | undefined | null,
	code?: string | null,
) {
	let newMessage = message;
	let newDescription = description as string;

	// if code is provided and it is in the list of common node js errors set the message and return early
	if (code && COMMON_NODE_JS_ERRORS[code]) {
		newMessage = COMMON_NODE_JS_ERRORS[code] as string;
		newDescription = `${message}; ${description}`;
		return [newMessage, newDescription];
	}

	// check if message contains any of the common node js errors and set the message and description
	for (const [errorCode, errorDescriptiveMessage] of Object.entries(COMMON_NODE_JS_ERRORS)) {
		if ((message || '').toUpperCase().includes(errorCode)) {
			newMessage = errorDescriptiveMessage as string;
			newDescription = `${message}; ${description ?? ''}`;
			break;
		}
	}

	return [newMessage, newDescription];
}

/**
 * Class for instantiating an operational error, e.g. an invalid credentials error.
 */
export class NodeOperationError extends NodeError {
	lineNumber: number | undefined;

	constructor(node: INode, error: Error | string, options: NodeOperationErrorOptions = {}) {
		if (typeof error === 'string') {
			error = new Error(error);
		}
		super(node, error);

		if (options.message) this.message = options.message;
		if (options.severity) this.severity = options.severity;
		this.description = options.description;
		this.context.runIndex = options.runIndex;
		this.context.itemIndex = options.itemIndex;

		[this.message, this.description] = setCommonNodeJsErrorMessage(this.message, this.description);
	}
}

const STATUS_CODE_MESSAGES: IStatusCodeMessages = {
	'4XX': 'Your request is invalid or could not be processed by the service',
	'400': 'Bad request - please check your parameters',
	'401': 'Authorization failed - please check your credentials',
	'402': 'Payment required - perhaps check your payment details?',
	'403': 'Forbidden - perhaps check your credentials?',
	'404': 'The resource you are requesting could not be found',
	'405': 'Method not allowed - please check you are using the right HTTP method',
	'429': 'The service is receiving too many requests from you! Perhaps take a break?',

	'5XX': 'The service failed to process your request',
	'500': 'The service was not able to process your request',
	'502': 'Bad gateway - the service failed to handle your request',
	'503':
		'Service unavailable - try again later or consider setting this node to retry automatically (in the node settings)',
	'504': 'Gateway timed out - perhaps try again later?',
};

const UNKNOWN_ERROR_MESSAGE = 'UNKNOWN ERROR - check the detailed error for more information';
const UNKNOWN_ERROR_MESSAGE_CRED = 'UNKNOWN ERROR';

interface NodeApiErrorOptions extends NodeOperationErrorOptions {
	message?: string;
	httpCode?: string;
	parseXml?: boolean;
}

/**
 * Class for instantiating an error in an API response, e.g. a 404 Not Found response,
 * with an HTTP error code, an error message and a description.
 */
export class NodeApiError extends NodeError {
	httpCode: string | null;

	constructor(
		node: INode,
		error: JsonObject,
		{
			message,
			description,
			httpCode,
			parseXml,
			runIndex,
			itemIndex,
			severity,
		}: NodeApiErrorOptions = {},
	) {
		super(node, error);

		if (severity) this.severity = severity;
		else if (httpCode?.charAt(0) !== '5') this.severity = 'warning';

		// only for request library error
		if (error.error) {
			removeCircularRefs(error.error as JsonObject);
		}

		// if not description provided, try to find it in the error object
		if (!description && (error.description || (error?.reason as IDataObject)?.description)) {
			this.description = (error.description ||
				(error?.reason as IDataObject)?.description) as string;
		}

		// if not message provided, try to find it in the error object or set description as message
		if (!message && (error.message || (error?.reason as IDataObject)?.message || description)) {
			this.message = (error.message ||
				(error?.reason as IDataObject)?.message ||
				description) as string;
		}

		// Set generic error message for 502 Bad Gateway
		if (
			!httpCode &&
			!message &&
			this.message &&
			this.message.toLowerCase().includes('bad gateway')
		) {
			httpCode = '502';

			const originalMessage = this.message;
			if (!description) {
				this.description = `${originalMessage}; ${this.description ?? ''}`;
			}
		}

		// if it's an error generated by axios
		// look for descriptions in the response object
		if (error.reason) {
			const reason: IDataObject = error.reason as unknown as IDataObject;

			if (reason.isAxiosError && reason.response) {
				error = reason.response as JsonObject;
			}
		}

		// set http code of this error
		if (httpCode) {
			this.httpCode = httpCode;
		} else {
			this.httpCode =
				this.findProperty(error, ERROR_STATUS_PROPERTIES, ERROR_NESTING_PROPERTIES) || null;
		}

		// set message of this error
		if (message) {
			this.message = message;
		}

		if (!this.message) {
			this.setMessage();
		}

		// set description of this error
		if (description) {
			this.description = description;
		}

		if (!this.description) {
			if (parseXml) {
				this.setDescriptionFromXml(error.error as string);
			} else {
				this.description = this.findProperty(
					error,
					ERROR_MESSAGE_PROPERTIES,
					ERROR_NESTING_PROPERTIES,
				);
			}
		}

		// if message contain common nodeJS error code set descriptive message and update description
		[this.message, this.description] = setCommonNodeJsErrorMessage(
			this.message,
			this.description,
			this.httpCode ||
				(error?.code as string) ||
				((error?.reason as JsonObject)?.code as string) ||
				undefined,
		);

		if (runIndex !== undefined) this.context.runIndex = runIndex;
		if (itemIndex !== undefined) this.context.itemIndex = itemIndex;
	}

	private setDescriptionFromXml(xml: string) {
		parseString(xml, { explicitArray: false }, (_, result) => {
			if (!result) return;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const topLevelKey = Object.keys(result)[0];
			this.description = this.findProperty(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				result[topLevelKey],
				ERROR_MESSAGE_PROPERTIES,
				['Error'].concat(ERROR_NESTING_PROPERTIES),
			);
		});
	}

	/**
	 * Set the error's message based on the HTTP status code.
	 *
	 */
	private setMessage() {
		if (!this.httpCode) {
			this.httpCode = null;
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.message = this.message || this.description || UNKNOWN_ERROR_MESSAGE;
			return;
		}

		if (STATUS_CODE_MESSAGES[this.httpCode]) {
			this.message = STATUS_CODE_MESSAGES[this.httpCode];
			return;
		}

		switch (this.httpCode.charAt(0)) {
			case '4':
				this.message = STATUS_CODE_MESSAGES['4XX'];
				break;
			case '5':
				this.message = STATUS_CODE_MESSAGES['5XX'];
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				this.message = this.message || this.description || UNKNOWN_ERROR_MESSAGE;
		}
		if (this.node.type === 'n8n-nodes-base.noOp' && this.message === UNKNOWN_ERROR_MESSAGE) {
			this.message = `${UNKNOWN_ERROR_MESSAGE_CRED} - ${this.httpCode}`;
		}
	}
}

export class NodeSSLError extends ExecutionBaseError {
	constructor(cause: Error) {
		super("SSL Issue: consider using the 'Ignore SSL issues' option", { cause });
	}
}
