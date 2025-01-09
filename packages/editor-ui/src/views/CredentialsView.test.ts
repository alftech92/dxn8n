import { createComponentRenderer } from '@/__tests__/render';
import { createTestingPinia } from '@pinia/testing';
import { useCredentialsStore } from '@/stores/credentials.store';
import CredentialsView from '@/views/CredentialsView.vue';
import { useUIStore } from '@/stores/ui.store';
import { mockedStore } from '@/__tests__/utils';
import { waitFor, within, fireEvent } from '@testing-library/vue';
import { CREDENTIAL_SELECT_MODAL_KEY, STORES, VIEWS } from '@/constants';
import { useProjectsStore } from '@/stores/projects.store';
import type { Project } from '@/types/projects.types';
import { createRouter, createWebHistory } from 'vue-router';
vi.mock('@/composables/useGlobalEntityCreation', () => ({
	useGlobalEntityCreation: () => ({
		menu: [],
	}),
}));

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/:credentialId?',
			name: VIEWS.CREDENTIALS,
			component: { template: '<div></div>' },
		},
	],
});

const initialState = {
	[STORES.SETTINGS]: {
		settings: { enterprise: { variables: true, projects: { team: { limit: -1 } } } },
	},
};

const renderComponent = createComponentRenderer(CredentialsView, {
	global: { stubs: { ProjectHeader: true }, plugins: [router] },
});

describe('CredentialsView', () => {
	beforeEach(async () => {
		createTestingPinia({ initialState });
		await router.push('/');
		await router.isReady();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should render credentials', () => {
		const credentialsStore = mockedStore(useCredentialsStore);
		credentialsStore.allCredentials = [
			{
				id: '1',
				name: 'test',
				type: 'test',
				createdAt: '2021-05-05T00:00:00Z',
				updatedAt: '2021-05-05T00:00:00Z',
				isManaged: false,
			},
		];
		const projectsStore = mockedStore(useProjectsStore);
		projectsStore.isProjectHome = false;
		const { getByTestId } = renderComponent();
		expect(getByTestId('resources-list-item')).toBeVisible();
	});

	it('should disable cards based on permissions', () => {
		const credentialsStore = mockedStore(useCredentialsStore);
		credentialsStore.allCredentials = [
			{
				id: '1',
				name: 'test',
				type: 'test',
				createdAt: '2021-05-05T00:00:00Z',
				updatedAt: '2021-05-05T00:00:00Z',
				scopes: ['credential:update'],
				isManaged: false,
			},
			{
				id: '2',
				name: 'test2',
				type: 'test2',
				createdAt: '2021-05-05T00:00:00Z',
				updatedAt: '2021-05-05T00:00:00Z',
				isManaged: false,
			},
		];
		const projectsStore = mockedStore(useProjectsStore);
		projectsStore.isProjectHome = false;
		const { getAllByTestId } = renderComponent();

		const items = getAllByTestId('resources-list-item');
		expect(items.length).toBe(2);

		expect(within(items[1]).getByText('Read only')).toBeInTheDocument();
	});

	describe('create credential', () => {
		it('should show modal based on route param', async () => {
			const uiStore = mockedStore(useUIStore);
			renderComponent({ props: { credentialId: 'create' } });
			expect(uiStore.openModal).toHaveBeenCalledWith(CREDENTIAL_SELECT_MODAL_KEY);
		});
	});

	describe('open existing credential', () => {
		it('should show modal based on route param', async () => {
			const uiStore = mockedStore(useUIStore);
			renderComponent({ props: { credentialId: 'credential-id' } });
			expect(uiStore.openExistingCredential).toHaveBeenCalledWith('credential-id');
		});

		it('should update credentialId route param when opened', async () => {
			const replaceSpy = vi.spyOn(router, 'replace');
			const projectsStore = mockedStore(useProjectsStore);
			projectsStore.isProjectHome = false;
			projectsStore.currentProject = { scopes: ['credential:read'] } as Project;
			const credentialsStore = mockedStore(useCredentialsStore);
			credentialsStore.allCredentials = [
				{
					id: '1',
					name: 'test',
					type: 'test',
					createdAt: '2021-05-05T00:00:00Z',
					updatedAt: '2021-05-05T00:00:00Z',
					scopes: ['credential:update'],
					isManaged: false,
				},
			];
			const { getByTestId } = renderComponent();

			/**
			 * userEvent DOES NOT work here
			 */
			await fireEvent.click(getByTestId('resources-list-item'));
			await waitFor(() =>
				expect(replaceSpy).toHaveBeenCalledWith(
					expect.objectContaining({ params: { credentialId: '1' } }),
				),
			);
		});
	});
});
