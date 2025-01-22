import { WorkflowPage as WorkflowPageClass } from '../pages/workflow';

const WorkflowPage = new WorkflowPageClass();

describe('PAY-1858 context menu', () => {
	/**
	 * @TODO: New Canvas - Fix this test
	 */
	// eslint-disable-next-line n8n-local-rules/no-skipped-tests
	it.skip('can use context menu on saved workflow', () => {
		WorkflowPage.actions.visit();
		cy.createFixtureWorkflow('Test_workflow_filter.json', 'test');

		WorkflowPage.getters.canvasNodes().should('have.length', 5);
		WorkflowPage.actions.deleteNodeFromContextMenu('Then');
		WorkflowPage.getters.canvasNodes().should('have.length', 4);

		WorkflowPage.actions.hitSaveWorkflow();

		cy.reload();
		WorkflowPage.getters.canvasNodes().should('have.length', 4);
		WorkflowPage.actions.deleteNodeFromContextMenu('Code');
		WorkflowPage.getters.canvasNodes().should('have.length', 3);
	});
});
