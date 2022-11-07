import express from 'express';
import { JsonObject, jsonParse, LoggerProxy } from 'n8n-workflow';

import axios from 'axios';
import { FindManyOptions, In } from 'typeorm';
import {
	ActiveWorkflowRunner,
	Db,
	GenericHelpers,
	ResponseHelper,
	whereClause,
	WorkflowHelpers,
	IWorkflowResponse,
	IExecutionPushResponse,
} from '..';
import config from '../../config';
import * as TagHelpers from '../TagHelpers';
import { SharedWorkflow } from '../databases/entities/SharedWorkflow';
import { WorkflowEntity } from '../databases/entities/WorkflowEntity';
import { validateEntity } from '../GenericHelpers';
import { InternalHooksManager } from '../InternalHooksManager';
import { externalHooks } from '../Server';
import { getLogger } from '../Logger';
import type { WorkflowRequest } from '../requests';
import { getSharedWorkflowIds, isBelowOnboardingThreshold } from '../WorkflowHelpers';
import { EEWorkflowController } from './workflows.controller.ee';
import { WorkflowsService } from './workflows.services';
import { validate as jsonSchemaValidate } from 'jsonschema';

const activeWorkflowRunner = ActiveWorkflowRunner.getInstance();
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

		const updatedWorkflow = await WorkflowsService.update(req.user, updateData, workflowId, tags);

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
			await activeWorkflowRunner.remove(workflowId);
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
	'/run',
	ResponseHelper.send(async (req: WorkflowRequest.ManualRun): Promise<IExecutionPushResponse> => {
		return WorkflowsService.runManually(req.body, req.user, GenericHelpers.getSessionId(req));
	}),
);
