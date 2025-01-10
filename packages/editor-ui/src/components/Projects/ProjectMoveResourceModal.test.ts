import { createTestingPinia } from '@pinia/testing';
import userEvent from '@testing-library/user-event';
import { createComponentRenderer } from '@/__tests__/render';
import { createTestWorkflow } from '@/__tests__/mocks';
import { createProjectListItem } from '@/__tests__/data/projects';
import { getDropdownItems, mockedStore } from '@/__tests__/utils';
import type { MockedStore } from '@/__tests__/utils';
import { PROJECT_MOVE_RESOURCE_MODAL } from '@/constants';
import ProjectMoveResourceModal from '@/components/Projects/ProjectMoveResourceModal.vue';
import { useTelemetry } from '@/composables/useTelemetry';
import { useProjectsStore } from '@/stores/projects.store';
import { useWorkflowsStore } from '@/stores/workflows.store';

const renderComponent = createComponentRenderer(ProjectMoveResourceModal, {
	pinia: createTestingPinia(),
	global: {
		stubs: {
			Modal: {
				template:
					'<div role="dialog"><slot name="header" /><slot name="content" /><slot name="footer" /></div>',
			},
		},
	},
});

let telemetry: ReturnType<typeof useTelemetry>;
let projectsStore: MockedStore<typeof useProjectsStore>;
let workflowsStore: MockedStore<typeof useWorkflowsStore>;

describe('ProjectMoveResourceModal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		telemetry = useTelemetry();
		projectsStore = mockedStore(useProjectsStore);
		workflowsStore = mockedStore(useWorkflowsStore);
	});

	it('should send telemetry when mounted', async () => {
		const telemetryTrackSpy = vi.spyOn(telemetry, 'track');

		projectsStore.availableProjects = [createProjectListItem()];
		workflowsStore.fetchWorkflow.mockResolvedValueOnce(createTestWorkflow());

		const props = {
			modalName: PROJECT_MOVE_RESOURCE_MODAL,
			data: {
				resourceType: 'workflow',
				resourceTypeLabel: 'Workflow',
				resource: {
					id: '1',
					homeProject: {
						id: '2',
						name: 'My Project',
					},
				},
			},
		};
		renderComponent({ props });
		expect(telemetryTrackSpy).toHaveBeenCalledWith(
			'User clicked to move a workflow',
			expect.objectContaining({ workflow_id: '1' }),
		);
	});

	it('should show no available projects message', async () => {
		projectsStore.availableProjects = [];
		workflowsStore.fetchWorkflow.mockResolvedValueOnce(createTestWorkflow());

		const props = {
			modalName: PROJECT_MOVE_RESOURCE_MODAL,
			data: {
				resourceType: 'workflow',
				resourceTypeLabel: 'Workflow',
				resource: {
					id: '1',
					homeProject: {
						id: '2',
						name: 'My Project',
					},
				},
			},
		};
		const { getByText } = renderComponent({ props });
		expect(getByText(/Currently there are not any projects or users available/)).toBeVisible();
	});

	it('should not load workflow if the resource is a credential', async () => {
		const telemetryTrackSpy = vi.spyOn(telemetry, 'track');
		projectsStore.availableProjects = [createProjectListItem()];

		const props = {
			modalName: PROJECT_MOVE_RESOURCE_MODAL,
			data: {
				resourceType: 'credential',
				resourceTypeLabel: 'Credential',
				resource: {
					id: '1',
					homeProject: {
						id: '2',
						name: 'My Project',
					},
				},
			},
		};

		renderComponent({ props });
		expect(telemetryTrackSpy).toHaveBeenCalledWith(
			'User clicked to move a credential',
			expect.objectContaining({ credential_id: '1' }),
		);
		expect(workflowsStore.fetchWorkflow).not.toHaveBeenCalled();
	});

	it('should send credential IDs when workflow moved with used credentials and checkbox checked', async () => {
		const destinationProject = createProjectListItem();
		const currentProjectId = '123';
		const movedWorkflow = {
			...createTestWorkflow(),
			usedCredentials: [
				{
					id: '1',
					name: 'PG Credential',
					credentialType: 'postgres',
					currentUserHasAccess: true,
				},
				{
					id: '2',
					name: 'Notion Credential',
					credentialType: 'notion',
					currentUserHasAccess: true,
				},
			],
		};

		projectsStore.currentProjectId = currentProjectId;
		projectsStore.availableProjects = [destinationProject];
		workflowsStore.fetchWorkflow.mockResolvedValueOnce(movedWorkflow);

		const props = {
			modalName: PROJECT_MOVE_RESOURCE_MODAL,
			data: {
				resourceType: 'workflow',
				resourceTypeLabel: 'Workflow',
				resource: movedWorkflow,
			},
		};
		const { getByTestId } = renderComponent({ props });
		expect(getByTestId('project-move-resource-modal-button')).toBeDisabled();

		const projectSelect = getByTestId('project-move-resource-modal-select');
		expect(projectSelect).toBeVisible();

		const projectSelectDropdownItems = await getDropdownItems(projectSelect);
		await userEvent.click(projectSelectDropdownItems[0]);

		expect(getByTestId('project-move-resource-modal-button')).toBeEnabled();

		await userEvent.click(getByTestId('project-move-resource-modal-checkbox-all'));
		await userEvent.click(getByTestId('project-move-resource-modal-button'));

		expect(projectsStore.moveResourceToProject).toHaveBeenCalledWith(
			'workflow',
			movedWorkflow.id,
			destinationProject.id,
			['1', '2'],
		);
	});
});
