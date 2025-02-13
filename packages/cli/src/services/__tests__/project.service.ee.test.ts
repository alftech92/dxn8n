import type { ProjectRelation } from '@n8n/api-types';
import type { EntityManager } from '@n8n/typeorm';
import { mock } from 'jest-mock-extended';

import type { Project } from '@/databases/entities/project';
import type { SharedCredentials } from '@/databases/entities/shared-credentials';
import type { ProjectRelationRepository } from '@/databases/repositories/project-relation.repository';
import type { ProjectRepository } from '@/databases/repositories/project.repository';
import type { SharedCredentialsRepository } from '@/databases/repositories/shared-credentials.repository';

import type { CacheService } from '../cache/cache.service';
import { ProjectService } from '../project.service.ee';
import type { RoleService } from '../role.service';

describe('ProjectService', () => {
	const manager = mock<EntityManager>();
	const projectRepository = mock<ProjectRepository>();
	const projectRelationRepository = mock<ProjectRelationRepository>({ manager });
	const roleService = mock<RoleService>();
	const sharedCredentialsRepository = mock<SharedCredentialsRepository>();
	const cacheService = mock<CacheService>();
	const projectService = new ProjectService(
		mock(),
		projectRepository,
		projectRelationRepository,
		roleService,
		sharedCredentialsRepository,
		cacheService,
		mock(),
	);

	describe('addUsersToProject', () => {
		it('throws if called with a team project', async () => {
			// ARRANGE
			const projectId = '12345';
			projectRepository.findOne.mockResolvedValueOnce(
				mock<Project>({ type: 'personal', projectRelations: [] }),
			);
			roleService.isRoleLicensed.mockReturnValueOnce(true);

			// ACT & ASSERT
			await expect(
				projectService.addUsersToProject(projectId, [{ userId: '1234', role: 'project:admin' }]),
			).rejects.toThrowError("Can't add users to personal projects.");
		});

		it('throws if trying to add a personalOwner to a team project', async () => {
			// ARRANGE
			const projectId = '12345';
			projectRepository.findOne.mockResolvedValueOnce(
				mock<Project>({ type: 'team', projectRelations: [] }),
			);
			roleService.isRoleLicensed.mockReturnValueOnce(true);

			// ACT & ASSERT
			await expect(
				projectService.addUsersToProject(projectId, [
					{ userId: '1234', role: 'project:personalOwner' },
				]),
			).rejects.toThrowError("Can't add a personalOwner to a team project.");
		});
	});

	describe('syncProjectRelations', () => {
		const projectId = '12345';
		const mockRelations: ProjectRelation[] = [
			{ userId: 'user1', role: 'project:admin' },
			{ userId: 'user2', role: 'project:viewer' },
		];

		beforeEach(() => {
			jest.clearAllMocks();
			manager.transaction.mockImplementation(async (arg1: unknown, arg2?: unknown) => {
				const runInTransaction = (arg2 ?? arg1) as (
					entityManager: EntityManager,
				) => Promise<unknown>;
				return await runInTransaction(manager);
			});
		});

		it('should successfully sync project relations', async () => {
			projectRepository.findOne.mockResolvedValueOnce(
				mock<Project>({
					id: projectId,
					type: 'team',
					projectRelations: [],
				}),
			);
			roleService.isRoleLicensed.mockReturnValue(true);

			sharedCredentialsRepository.find.mockResolvedValueOnce([
				mock<SharedCredentials>({ credentialsId: 'cred1' }),
				mock<SharedCredentials>({ credentialsId: 'cred2' }),
			]);

			await projectService.syncProjectRelations(projectId, mockRelations);

			expect(projectRepository.findOne).toHaveBeenCalledWith({
				where: { id: projectId, type: 'team' },
				relations: { projectRelations: true },
			});

			expect(manager.delete).toHaveBeenCalled();
			expect(manager.insert).toHaveBeenCalled();
			expect(cacheService.deleteMany).toHaveBeenCalledWith([
				'credential-can-use-secrets:cred1',
				'credential-can-use-secrets:cred2',
			]);
		});

		it('should throw error if project not found', async () => {
			projectRepository.findOne.mockResolvedValueOnce(null);

			await expect(projectService.syncProjectRelations(projectId, mockRelations)).rejects.toThrow(
				`Could not find project with ID: ${projectId}`,
			);
		});

		it('should throw error if unlicensed role is used', async () => {
			projectRepository.findOne.mockResolvedValueOnce(
				mock<Project>({
					id: projectId,
					type: 'team',
					projectRelations: [],
				}),
			);
			roleService.isRoleLicensed.mockReturnValue(false);

			await expect(projectService.syncProjectRelations(projectId, mockRelations)).rejects.toThrow(
				'Your instance is not licensed to use role "project:admin"',
			);
		});

		it('should not throw error for existing role even if unlicensed', async () => {
			projectRepository.findOne.mockResolvedValueOnce(
				mock<Project>({
					id: projectId,
					type: 'team',
					projectRelations: [{ userId: 'user1', role: 'project:admin' }],
				}),
			);
			roleService.isRoleLicensed.mockReturnValue(false);

			sharedCredentialsRepository.find.mockResolvedValueOnce([]);

			await expect(
				projectService.syncProjectRelations(projectId, [
					{ userId: 'user1', role: 'project:admin' },
				]),
			).resolves.not.toThrow();
		});
	});
});
