import { validate as jsonSchemaValidate } from 'jsonschema';
import { INode, IPinData, JsonObject, jsonParse, LoggerProxy, Workflow } from 'n8n-workflow';
import { FindManyOptions, FindOneOptions, In, ObjectLiteral } from 'typeorm';
import * as ActiveWorkflowRunner from '@/ActiveWorkflowRunner';
import * as Db from '@/Db';
import { InternalHooksManager } from '@/InternalHooksManager';
import * as ResponseHelper from '@/ResponseHelper';
import * as WorkflowHelpers from '@/WorkflowHelpers';
import { whereClause } from '@/CredentialsHelper';
import config from '@/config';
import { SharedWorkflow } from '@db/entities/SharedWorkflow';
import { User } from '@db/entities/User';
import { WorkflowEntity } from '@db/entities/WorkflowEntity';
import { validateEntity } from '@/GenericHelpers';
import { externalHooks } from '@/Server';
import * as TagHelpers from '@/TagHelpers';
import { WorkflowRequest } from '@/requests';
import { IWorkflowDb, IWorkflowExecutionDataProcess } from '@/Interfaces';
import { NodeTypes } from '@/NodeTypes';
import { WorkflowRunner } from '@/WorkflowRunner';
import * as WorkflowExecuteAdditionalData from '@/WorkflowExecuteAdditionalData';
import * as TestWebhooks from '@/TestWebhooks';
import { getSharedWorkflowIds } from '@/WorkflowHelpers';

export interface IGetWorkflowsQueryFilter {
	id?: number | string;
	name?: string;
	active?: boolean;
}

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

const isTrigger = (nodeType: string) =>
	['trigger', 'webhook'].some((suffix) => nodeType.toLowerCase().includes(suffix));

function findFirstPinnedTrigger(workflow: IWorkflowDb, pinData?: IPinData) {
	if (!pinData) return;

	// eslint-disable-next-line consistent-return
	return workflow.nodes.find(
		(node) => !node.disabled && isTrigger(node.type) && pinData[node.name],
	);
}

export class WorkflowsService {
	static async getSharing(
		user: User,
		workflowId: number | string,
		relations: string[] = ['workflow'],
		{ allowGlobalOwner } = { allowGlobalOwner: true },
	): Promise<SharedWorkflow | undefined> {
		const options: FindOneOptions<SharedWorkflow> & { where: ObjectLiteral } = {
			where: {
				workflow: { id: workflowId },
			},
		};

		// Omit user from where if the requesting user is the global
		// owner. This allows the global owner to view and delete
		// workflows they don't own.
		if (!allowGlobalOwner || user.globalRole.name !== 'owner') {
			options.where.user = { id: user.id };
		}

		if (relations?.length) {
			options.relations = relations;
		}

		return Db.collections.SharedWorkflow.findOne(options);
	}

	static async get(workflow: Partial<WorkflowEntity>, options?: { relations: string[] }) {
		return Db.collections.Workflow.findOne(workflow, options);
	}

	static async getMany(user: User, rawFilter: string) {
		const sharedWorkflowIds = await getSharedWorkflowIds(user);
		if (sharedWorkflowIds.length === 0) {
			// return early since without shared workflows there can be no hits
			// (note: getSharedWorkflowIds() returns _all_ workflow ids for global owners)
			return [];
		}

		let filter: IGetWorkflowsQueryFilter | undefined = undefined;
		if (rawFilter) {
			try {
				const filterJson: JsonObject = jsonParse(rawFilter);
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
					userId: user.id,
					filter,
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
				LoggerProxy.verbose(`User ${user.id} attempted to query non-shared workflow ${workflowId}`);
				return [];
			}
		}

		const fields: Array<keyof WorkflowEntity> = ['id', 'name', 'active', 'createdAt', 'updatedAt'];

		const query: FindManyOptions<WorkflowEntity> = {
			select: config.get('enterprise.features.sharing') ? [...fields, 'nodes'] : fields,
			relations: config.get('enterprise.features.sharing')
				? ['tags', 'shared', 'shared.user', 'shared.role']
				: ['tags'],
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
	}

	static async update(
		user: User,
		workflow: WorkflowEntity,
		workflowId: string,
		tags?: string[],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		forceSave?: boolean,
	): Promise<WorkflowEntity> {
		const shared = await Db.collections.SharedWorkflow.findOne({
			relations: ['workflow'],
			where: whereClause({
				user,
				entityType: 'workflow',
				entityId: workflowId,
			}),
		});

		if (!shared) {
			LoggerProxy.info('User attempted to update a workflow without permissions', {
				workflowId,
				userId: user.id,
			});
			throw new ResponseHelper.ResponseError(
				`Workflow with ID "${workflowId}" could not be found to be updated.`,
				undefined,
				404,
			);
		}

		// if (!forceSave && workflow.hash !== shared.workflow.hash) {
		// 	throw new ResponseHelper.ResponseError(
		// 		`Workflow ID ${workflowId} cannot be saved because it was changed by another user.`,
		// 		undefined,
		// 		400,
		// 	);
		// }

		// check credentials for old format
		await WorkflowHelpers.replaceInvalidCredentials(workflow);

		WorkflowHelpers.addNodeIds(workflow);

		await externalHooks.run('workflow.update', [workflow]);

		if (shared.workflow.active) {
			// When workflow gets saved always remove it as the triggers could have been
			// changed and so the changes would not take effect
			await ActiveWorkflowRunner.getInstance().remove(workflowId);
		}

		if (workflow.settings) {
			if (workflow.settings.timezone === 'DEFAULT') {
				// Do not save the default timezone
				delete workflow.settings.timezone;
			}
			if (workflow.settings.saveDataErrorExecution === 'DEFAULT') {
				// Do not save when default got set
				delete workflow.settings.saveDataErrorExecution;
			}
			if (workflow.settings.saveDataSuccessExecution === 'DEFAULT') {
				// Do not save when default got set
				delete workflow.settings.saveDataSuccessExecution;
			}
			if (workflow.settings.saveManualExecutions === 'DEFAULT') {
				// Do not save when default got set
				delete workflow.settings.saveManualExecutions;
			}
			if (
				parseInt(workflow.settings.executionTimeout as string, 10) ===
				config.get('executions.timeout')
			) {
				// Do not save when default got set
				delete workflow.settings.executionTimeout;
			}
		}

		if (workflow.name) {
			workflow.updatedAt = new Date(); // required due to atomic update
			await validateEntity(workflow);
		}

		const { hash, ...rest } = workflow;

		await Db.collections.Workflow.update(workflowId, rest);

		if (tags && !config.getEnv('workflowTagsDisabled')) {
			const tablePrefix = config.getEnv('database.tablePrefix');
			await TagHelpers.removeRelations(workflowId, tablePrefix);

			if (tags.length) {
				await TagHelpers.createRelations(workflowId, tags, tablePrefix);
			}
		}

		const options: FindManyOptions<WorkflowEntity> = {
			relations: ['tags'],
		};

		if (config.getEnv('workflowTagsDisabled')) {
			delete options.relations;
		}

		// We sadly get nothing back from "update". Neither if it updated a record
		// nor the new value. So query now the hopefully updated entry.
		const updatedWorkflow = await Db.collections.Workflow.findOne(workflowId, options);

		if (updatedWorkflow === undefined) {
			throw new ResponseHelper.ResponseError(
				`Workflow with ID "${workflowId}" could not be found to be updated.`,
				undefined,
				400,
			);
		}

		if (updatedWorkflow.tags?.length && tags?.length) {
			updatedWorkflow.tags = TagHelpers.sortByRequestOrder(updatedWorkflow.tags, {
				requestOrder: tags,
			});
		}

		await externalHooks.run('workflow.afterUpdate', [updatedWorkflow]);
		void InternalHooksManager.getInstance().onWorkflowSaved(user.id, updatedWorkflow, false);

		if (updatedWorkflow.active) {
			// When the workflow is supposed to be active add it again
			try {
				await externalHooks.run('workflow.activate', [updatedWorkflow]);
				await ActiveWorkflowRunner.getInstance().add(
					workflowId,
					shared.workflow.active ? 'update' : 'activate',
				);
			} catch (error) {
				// If workflow could not be activated set it again to inactive
				workflow.active = false;
				await Db.collections.Workflow.update(workflowId, workflow);

				// Also set it in the returned data
				updatedWorkflow.active = false;

				// Now return the original error for UI to display
				throw error;
			}
		}

		return updatedWorkflow;
	}

	static async runManually(
		{
			workflowData,
			runData,
			pinData,
			startNodes,
			destinationNode,
		}: WorkflowRequest.ManualRunPayload,
		user: User,
		sessionId?: string,
	) {
		const EXECUTION_MODE = 'manual';
		const ACTIVATION_MODE = 'manual';

		const pinnedTrigger = findFirstPinnedTrigger(workflowData, pinData);

		// If webhooks nodes exist and are active we have to wait for till we receive a call
		if (
			pinnedTrigger === undefined &&
			(runData === undefined ||
				startNodes === undefined ||
				startNodes.length === 0 ||
				destinationNode === undefined)
		) {
			const workflow = new Workflow({
				id: workflowData.id?.toString(),
				name: workflowData.name,
				nodes: workflowData.nodes,
				connections: workflowData.connections,
				active: false,
				nodeTypes: NodeTypes(),
				staticData: undefined,
				settings: workflowData.settings,
			});

			const additionalData = await WorkflowExecuteAdditionalData.getBase(user.id);

			const needsWebhook = await TestWebhooks.getInstance().needsWebhookData(
				workflowData,
				workflow,
				additionalData,
				EXECUTION_MODE,
				ACTIVATION_MODE,
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
			executionMode: EXECUTION_MODE,
			runData,
			pinData,
			sessionId,
			startNodes,
			workflowData,
			userId: user.id,
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
	}
}
