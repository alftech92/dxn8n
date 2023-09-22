import { WorkflowPage, NDV } from '../pages';

const workflowPage = new WorkflowPage();
const ndv = new NDV();

describe('SQL editors', () => {
	beforeEach(() => {
		workflowPage.actions.visit();
	});

	it('should preserve changes when opening-closing MySQL node', () => {
		workflowPage.actions.addInitialNodeToCanvas('Manual');
		workflowPage.actions.addNodeToCanvas('MySQL');
		workflowPage.actions.openNode('MySQL');
		ndv.getters.parameterInput('operation').click();
		cy.get('div').contains('Execute SQL').click();
		cy.get('div.cm-activeLine').type('SELECT * FROM `testTable`');
		ndv.actions.close();
		workflowPage.actions.openNode('MySQL');
		cy.get('div.cm-activeLine').type('{end} LIMIT 10');
		ndv.actions.close();
		workflowPage.actions.openNode('MySQL');

		cy.get('div.cm-activeLine').contains('SELECT * FROM `testTable` LIMIT 10');
	});

	it('should preserve changes when opening-closing Postgres node', () => {
		workflowPage.actions.addInitialNodeToCanvas('Manual');
		workflowPage.actions.addNodeToCanvas('Postgres');
		workflowPage.actions.openNode('Postgres');
		ndv.getters.parameterInput('operation').click();
		cy.get('div').contains('Execute Query').click();
		cy.get('div.cm-activeLine').type('SELECT * FROM `testTable`');
		ndv.actions.close();
		workflowPage.actions.openNode('Postgres');
		cy.get('div.cm-activeLine').type('{end} LIMIT 10');
		ndv.actions.close();
		workflowPage.actions.openNode('Postgres');

		cy.get('div.cm-activeLine').contains('SELECT * FROM `testTable` LIMIT 10');
	});

	it('should preserve changes when opening-closing Google BigQuery node', () => {
		workflowPage.actions.addInitialNodeToCanvas('Manual');
		workflowPage.actions.addNodeToCanvas('Google BigQuery');
		workflowPage.actions.openNode('Google BigQuery');
		ndv.getters.parameterInput('operation').click();
		cy.get('div').contains('Execute Query').click();
		cy.get('div.cm-activeLine').type('SELECT * FROM `testTable`');
		ndv.actions.close();
		workflowPage.actions.openNode('Google BigQuery');
		cy.get('div.cm-activeLine').type('{end} LIMIT 10');
		ndv.actions.close();
		workflowPage.actions.openNode('Google BigQuery');

		cy.get('div.cm-activeLine').contains('SELECT * FROM `testTable` LIMIT 10');
	});
});
