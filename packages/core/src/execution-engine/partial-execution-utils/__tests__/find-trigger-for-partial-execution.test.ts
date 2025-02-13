import { createNodeData } from './helpers';
import { DirectedGraph } from '../directed-graph';
import { findTriggerForPartialExecution } from '../find-trigger-for-partial-execution';
import { NodeTypes } from '@test/helpers';

const nodeTypes = NodeTypes();

describe('findTriggerForPartialExecution', () => {
	test('works if the trigger is the destination node', () => {
		// ARRANGE
		const trigger = createNodeData({ name: 'trigger', type: 'n8n-nodes-base.manualTrigger' });
		const workflow = new DirectedGraph()
			.addNode(trigger)
			.toWorkflow({ name: '', active: false, nodeTypes });

		// ACT
		const result = findTriggerForPartialExecution(workflow, 'trigger');

		// ASSERT
		expect(result).toBe(trigger);
	});

	test('only returns triggers', () => {
		// ARRANGE
		const trigger = createNodeData({ name: 'no trigger' });
		const workflow = new DirectedGraph()
			.addNode(trigger)
			.toWorkflow({ name: '', active: false, nodeTypes });

		// ACT
		const result = findTriggerForPartialExecution(workflow, 'no trigger');

		// ASSERT
		expect(result).toBeUndefined();
	});
});

//AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
//
//  a.ok(nodeExists)
//
//    at DirectedGraph.getDirectChildConnections (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/core/src/execution-engine/partial-execution-utils/directed-graph.ts:196:5)
//    at DirectedGraph.getChildrenRecursive (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/core/src/execution-engine/partial-execution-utils/directed-graph.ts:212:31)
//    at DirectedGraph.getChildren (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/core/src/execution-engine/partial-execution-utils/directed-graph.ts:234:15)
//    at cleanRunData (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/core/src/execution-engine/partial-execution-utils/clean-run-data.ts:20:26)
//    at WorkflowExecute.runPartialWorkflow2 (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/core/src/execution-engine/workflow-execute.ts:379:25)
//    at ManualExecutionService.runManually (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/cli/src/manual-execution.service.ts:116:28)
//    at WorkflowRunner.runMainProcess (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/cli/src/workflow-runner.ts:274:53)
//    at WorkflowRunner.run (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/cli/src/workflow-runner.ts:162:4)
//    at WorkflowExecutionService.executeManually (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/cli/src/workflows/workflow-execution.service.ts:191:23)
//    at WorkflowsController.runManually (/home/despairblue/git/n8n/pay-1998-clicking-run-on-a-trigger-produces-an-error/packages/cli/src/workflows/workflows.controller.ts:397:10)
