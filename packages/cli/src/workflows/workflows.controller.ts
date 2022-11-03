/* eslint-disable no-param-reassign */

import express from 'express';
import { INode, IPinData, JsonObject, jsonParse, LoggerProxy, Workflow } from 'n8n-workflow';

import axios from 'axios';
import { FindManyOptions, In } from 'typeorm';
import * as ActiveWorkflowRunner from '@/ActiveWorkflowRunner';
import * as Db from '@/Db';
import * as GenericHelpers from '@/GenericHelpers';
import * as ResponseHelper from '@/ResponseHelper';
import * as WorkflowHelpers from '@/WorkflowHelpers';
import { whereClause } from '@/CredentialsHelper';
import { NodeTypes } from '@/NodeTypes';
import * as WorkflowExecuteAdditionalData from '@/WorkflowExecuteAdditionalData';
import * as TestWebhooks from '@/TestWebhooks';
import { WorkflowRunner } from '@/WorkflowRunner';
import {
	IWorkflowResponse,
	IExecutionPushResponse,
	IWorkflowExecutionDataProcess,
	IWorkflowDb,
} from '@/Interfaces';
import config from '@/config';
import * as TagHelpers from '@/TagHelpers';
import { SharedWorkflow } from '@db/entities/SharedWorkflow';
import { WorkflowEntity } from '@db/entities/WorkflowEntity';
import { validateEntity } from '@/GenericHelpers';
import { InternalHooksManager } from '@/InternalHooksManager';
import { externalHooks } from '@/Server';
import { getLogger } from '@/Logger';
import type { WorkflowRequest } from '@/requests';
import { getSharedWorkflowIds, isBelowOnboardingThreshold } from '@/WorkflowHelpers';
import { EEWorkflowController } from './workflows.controller.ee';
import { WorkflowsService } from './workflows.services';
import { validate as jsonSchemaValidate } from 'jsonschema';

export const workflowsController = express.Router();

const schemaGetWorkflowsQueryFilter = {
	$id: '/IGetWorkflowsQueryFilter',
	type: 'object',
	properties: {
		id: { anyOf: [{ type: 'integer' }, { type: 'string' }] },
		name: { type: 'string' },
		active: { type: 'boolean' },
	},
};

const allowedWorkflowsQueryFilterFields = Object.keys(schemaGetWorkflowsQueryFilter.properties);

interface IGetWorkflowsQueryFilter {
	id?: number | string;
	name?: string;
	active?: boolean;
}

/**
 * Initialize Logger if needed
 */
workflowsController.use((req, res, next) => {
	try {
		LoggerProxy.getInstance();
	} catch (error) {
		LoggerProxy.init(getLogger());
	}
	next();
});

workflowsController.use('/', EEWorkflowController);

const isTrigger = (nodeType: string) =>
	['trigger', 'webhook'].some((suffix) => nodeType.toLowerCase().includes(suffix));

function findFirstPinnedTrigger(workflow: IWorkflowDb, pinData?: IPinData) {
	if (!pinData) return;

	// eslint-disable-next-line consistent-return
	return workflow.nodes.find(
		(node) => !node.disabled && isTrigger(node.type) && pinData[node.name],
	);
}

/**
 * POST /workflows
 */
workflowsController.post(
	'/',
	ResponseHelper.send(async (req: WorkflowRequest.Create) => {
		delete req.body.id; // delete if sent

		const newWorkflow = new WorkflowEntity();

		Object.assign(newWorkflow, req.body);

		await validateEntity(newWorkflow);

		await externalHooks.run('workflow.create', [newWorkflow]);

		const { tags: tagIds } = req.body;

		if (tagIds?.length && !config.getEnv('workflowTagsDisabled')) {
			newWorkflow.tags = await Db.collections.Tag.findByIds(tagIds, {
				select: ['id', 'name'],
			});
		}

		await WorkflowHelpers.replaceInvalidCredentials(newWorkflow);

		WorkflowHelpers.addNodeIds(newWorkflow);

		let savedWorkflow: undefined | WorkflowEntity;

		await Db.transaction(async (transactionManager) => {
			savedWorkflow = await transactionManager.save<WorkflowEntity>(newWorkflow);

			const role = await Db.collections.Role.findOneOrFail({
				name: 'owner',
				scope: 'workflow',
			});

			const newSharedWorkflow = new SharedWorkflow();

			Object.assign(newSharedWorkflow, {
				role,
				user: req.user,
				workflow: savedWorkflow,
			});

			await transactionManager.save<SharedWorkflow>(newSharedWorkflow);
		});

		if (!savedWorkflow) {
			LoggerProxy.error('Failed to create workflow', { userId: req.user.id });
			throw new ResponseHelper.ResponseError('Failed to save workflow');
		}

		if (tagIds && !config.getEnv('workflowTagsDisabled') && savedWorkflow.tags) {
			savedWorkflow.tags = TagHelpers.sortByRequestOrder(savedWorkflow.tags, {
				requestOrder: tagIds,
			});
		}

		await externalHooks.run('workflow.afterCreate', [savedWorkflow]);
		void InternalHooksManager.getInstance().onWorkflowCreated(req.user.id, newWorkflow, false);

		const { id, ...rest } = savedWorkflow;

		return {
			id: id.toString(),
			...rest,
		};
	}),
);

// Returns workflows
/**
 * GET /workflows
 */
workflowsController.get(
	`/`,
	ResponseHelper.send(async (req: WorkflowRequest.GetAll) => {
		const sharedWorkflowIds = await getSharedWorkflowIds(req.user);
		if (sharedWorkflowIds.length === 0) {
			// return early since without shared workflows there can be no hits
			// (note: getSharedWorkflowIds() returns _all_ workflow ids for global owners)
			return [];
		}

		// parse incoming filter object and remove non-valid fields
		let filter: IGetWorkflowsQueryFilter | undefined = undefined;
		if (req.query.filter) {
			try {
				const filterJson: JsonObject = jsonParse(req.query.filter);
				if (filterJson) {
					Object.keys(filterJson).map((key) => {
						if (!allowedWorkflowsQueryFilterFields.includes(key)) delete filterJson[key];
					});
					if (jsonSchemaValidate(filterJson, schemaGetWorkflowsQueryFilter).valid) {
						filter = filterJson as IGetWorkflowsQueryFilter;
					}
				}
			} catch (error) {
				LoggerProxy.error('Failed to parse filter', {
					userId: req.user.id,
					filter: req.query.filter,
				});
				throw new ResponseHelper.ResponseError(
					`Parameter "filter" contained invalid JSON string.`,
					500,
					500,
				);
			}
		}

		// safeguard against querying ids not shared with the user
		if (filter?.id !== undefined) {
			const workflowId = parseInt(filter.id.toString());
			if (workflowId && !sharedWorkflowIds.includes(workflowId)) {
				LoggerProxy.verbose(
					`User ${req.user.id} attempted to query non-shared workflow ${workflowId}`,
				);
				return [];
			}
		}

		const query: FindManyOptions<WorkflowEntity> = {
			select: ['id', 'name', 'active', 'createdAt', 'updatedAt'],
			relations: ['tags'],
		};

		if (config.getEnv('workflowTagsDisabled')) {
			delete query.relations;
		}

		const workflows = await Db.collections.Workflow.find(
			Object.assign(query, {
				where: {
					id: In(sharedWorkflowIds),
					...filter,
				},
			}),
		);

		return workflows.map((workflow) => {
			const { id, ...rest } = workflow;

			return {
				id: id.toString(),
				...rest,
			};
		});
	}),
);

/**
 * GET /workflows/new
 */
workflowsController.get(
	`/new`,
	ResponseHelper.send(async (req: WorkflowRequest.NewName) => {
		const requestedName =
			req.query.name && req.query.name !== ''
				? req.query.name
				: config.getEnv('workflows.defaultName');

		const name = await GenericHelpers.generateUniqueName(requestedName, 'workflow');

		const onboardingFlowEnabled =
			!config.getEnv('workflows.onboardingFlowDisabled') &&
			!req.user.settings?.isOnboarded &&
			(await isBelowOnboardingThreshold(req.user));

		return { name, onboardingFlowEnabled };
	}),
);

// Reads and returns workflow data from an URL
/**
 * GET /workflows/from-url
 */
workflowsController.get(
	`/from-url`,
	ResponseHelper.send(async (req: express.Request): Promise<IWorkflowResponse> => {
		if (req.query.url === undefined) {
			throw new ResponseHelper.ResponseError(`The parameter "url" is missing!`, undefined, 400);
		}
		if (!/^http[s]?:\/\/.*\.json$/i.exec(req.query.url as string)) {
			throw new ResponseHelper.ResponseError(
				`The parameter "url" is not valid! It does not seem to be a URL pointing to a n8n workflow JSON file.`,
				undefined,
				400,
			);
		}
		let workflowData: IWorkflowResponse | undefined;
		try {
			const { data } = await axios.get<IWorkflowResponse>(req.query.url as string);
			workflowData = data;
		} catch (error) {
			throw new ResponseHelper.ResponseError(
				`The URL does not point to valid JSON file!`,
				undefined,
				400,
			);
		}

		// Do a very basic check if it is really a n8n-workflow-json
		if (
			workflowData === undefined ||
			workflowData.nodes === undefined ||
			!Array.isArray(workflowData.nodes) ||
			workflowData.connections === undefined ||
			typeof workflowData.connections !== 'object' ||
			Array.isArray(workflowData.connections)
		) {
			throw new ResponseHelper.ResponseError(
				`The data in the file does not seem to be a n8n workflow JSON file!`,
				undefined,
				400,
			);
		}

		return workflowData;
	}),
);

/**
 * GET /workflows/:id
 */
workflowsController.get(
	'/:id(\\d+)',
	ResponseHelper.send(async (req: WorkflowRequest.Get) => {
		const { id: workflowId } = req.params;

		let relations = ['workflow', 'workflow.tags'];

		if (config.getEnv('workflowTagsDisabled')) {
			relations = relations.filter((relation) => relation !== 'workflow.tags');
		}

		const shared = await Db.collections.SharedWorkflow.findOne({
			relations,
			where: whereClause({
				user: req.user,
				entityType: 'workflow',
				entityId: workflowId,
			}),
		});

		if (!shared) {
			LoggerProxy.info('User attempted to access a workflow without permissions', {
				workflowId,
				userId: req.user.id,
			});
			throw new ResponseHelper.ResponseError(
				`Workflow with ID "${workflowId}" could not be found.`,
				undefined,
				404,
			);
		}

		const {
			workflow: { id, ...rest },
		} = shared;

		return {
			id: id.toString(),
			...rest,
		};
	}),
);

// Updates an existing workflow
/**
 * PATCH /workflows/:id
 */
workflowsController.patch(
	`/:id`,
	ResponseHelper.send(async (req: WorkflowRequest.Update) => {
		const { id: workflowId } = req.params;

		const updateData = new WorkflowEntity();
		const { tags, ...rest } = req.body;
		Object.assign(updateData, rest);

		const updatedWorkflow = await WorkflowsService.updateWorkflow(
			req.user,
			updateData,
			workflowId,
			tags,
		);

		const { id, ...remainder } = updatedWorkflow;

		return {
			id: id.toString(),
			...remainder,
		};
	}),
);

// Deletes a specific workflow
/**
 * DELETE /workflows/:id
 */
workflowsController.delete(
	`/:id`,
	ResponseHelper.send(async (req: WorkflowRequest.Delete) => {
		const { id: workflowId } = req.params;

		await externalHooks.run('workflow.delete', [workflowId]);

		const shared = await Db.collections.SharedWorkflow.findOne({
			relations: ['workflow'],
			where: whereClause({
				user: req.user,
				entityType: 'workflow',
				entityId: workflowId,
			}),
		});

		if (!shared) {
			LoggerProxy.info('User attempted to delete a workflow without permissions', {
				workflowId,
				userId: req.user.id,
			});
			throw new ResponseHelper.ResponseError(
				`Workflow with ID "${workflowId}" could not be found to be deleted.`,
				undefined,
				400,
			);
		}

		if (shared.workflow.active) {
			// deactivate before deleting
			await ActiveWorkflowRunner.getInstance().remove(workflowId);
		}

		await Db.collections.Workflow.delete(workflowId);

		void InternalHooksManager.getInstance().onWorkflowDeleted(req.user.id, workflowId, false);
		await externalHooks.run('workflow.afterDelete', [workflowId]);

		return true;
	}),
);

/**
 * POST /workflows/run
 */
workflowsController.post(
	`/run`,
	ResponseHelper.send(async (req: WorkflowRequest.ManualRun): Promise<IExecutionPushResponse> => {
		const { workflowData } = req.body;
		const { runData } = req.body;
		const { pinData } = req.body;
		const { startNodes } = req.body;
		const { destinationNode } = req.body;
		const executionMode = 'manual';
		const activationMode = 'manual';

		const sessionId = GenericHelpers.getSessionId(req);

		const pinnedTrigger = findFirstPinnedTrigger(workflowData, pinData);

		// If webhooks nodes exist and are active we have to wait for till we receive a call
		if (
			pinnedTrigger === undefined &&
			(runData === undefined ||
				startNodes === undefined ||
				startNodes.length === 0 ||
				destinationNode === undefined)
		) {
			const additionalData = await WorkflowExecuteAdditionalData.getBase(req.user.id);
			const nodeTypes = NodeTypes();
			const workflowInstance = new Workflow({
				id: workflowData.id?.toString(),
				name: workflowData.name,
				nodes: workflowData.nodes,
				connections: workflowData.connections,
				active: false,
				nodeTypes,
				staticData: undefined,
				settings: workflowData.settings,
			});
			const needsWebhook = await TestWebhooks.getInstance().needsWebhookData(
				workflowData,
				workflowInstance,
				additionalData,
				executionMode,
				activationMode,
				sessionId,
				destinationNode,
			);
			if (needsWebhook) {
				return {
					waitingForWebhook: true,
				};
			}
		}

		// For manual testing always set to not active
		workflowData.active = false;

		// Start the workflow
		const data: IWorkflowExecutionDataProcess = {
			destinationNode,
			executionMode,
			runData,
			pinData,
			sessionId,
			startNodes,
			workflowData,
			userId: req.user.id,
		};

		const hasRunData = (node: INode) => runData !== undefined && !!runData[node.name];

		if (pinnedTrigger && !hasRunData(pinnedTrigger)) {
			data.startNodes = [pinnedTrigger.name];
		}

		const workflowRunner = new WorkflowRunner();
		const executionId = await workflowRunner.run(data);

		return {
			executionId,
		};
	}),
);
