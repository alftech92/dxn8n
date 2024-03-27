import type { EntitySubscriberInterface, UpdateEvent } from '@n8n/typeorm';
import { Column, Entity, EventSubscriber, OneToMany } from '@n8n/typeorm';
import { WithTimestampsAndStringId } from './AbstractEntity';
import type { ProjectRelation } from './ProjectRelation';
import type { SharedCredentials } from './SharedCredentials';
import type { SharedWorkflow } from './SharedWorkflow';
import { User } from './User';
import Container from 'typedi';
import { ProjectRepository } from '../repositories/project.repository';
import { ApplicationError } from 'n8n-workflow';
import { captureException } from '@sentry/node';
import { Logger } from '@/Logger';

export type ProjectType = 'personal' | 'team' | 'public';

@Entity()
export class Project extends WithTimestampsAndStringId {
	@Column({ length: 255, nullable: true })
	name?: string;

	@Column({ length: 36 })
	type: ProjectType;

	@OneToMany('ProjectRelation', 'project')
	projectRelations: ProjectRelation[];

	@OneToMany('SharedCredentials', 'project')
	sharedCredentials: SharedCredentials[];

	@OneToMany('SharedWorkflow', 'project')
	sharedWorkflows: SharedWorkflow[];
}

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
	listenTo() {
		return User;
	}

	async afterUpdate(event: UpdateEvent<User>): Promise<void> {
		if (event.entity) {
			const newUserData = event.entity;

			if (event.databaseEntity) {
				const fields = event.updatedColumns.map((c) => c.propertyName);

				if (
					fields.includes('firstName') ||
					fields.includes('lastName') ||
					fields.includes('email')
				) {
					const oldUser = event.databaseEntity;
					const name = `${newUserData.firstName} ${newUserData.lastName} <${newUserData.email}>`;

					const project = await Container.get(ProjectRepository).getPersonalProjectForUser(
						oldUser.id,
					);

					if (!project) {
						// Since this is benign we're not throwing the exception. We don't
						// know if we're running inside a transaction and thus there is a risk
						// that this could cause further data inconsistencies.
						const message = "Could not update the personal project's name";
						Container.get(Logger).warn(message, event.entity);
						const exception = new ApplicationError(message);
						captureException(exception, event.entity);
						return;
					}

					project.name = name;

					await event.manager.save(Project, project);
				}
			} else {
				// This means the user was updated using `Repository.update`. In this
				// case we're missing the user's id and cannot update their project.
				//
				// When updating the user's firstName, lastName or email we must use
				// `Repository.save`, so this is a bug and we should report it to sentry.
				//
				if (event.entity.firstName || event.entity.lastName || event.entity.email) {
					// Since this is benign we're not throwing the exception. We don't
					// know if we're running inside a transaction and thus there is a risk
					// that this could cause further data inconsistencies.
					const message = "Could not update the personal project's name";
					Container.get(Logger).warn(message, event.entity);
					const exception = new ApplicationError(message);
					captureException(exception, event.entity);
				}
			}
		}
	}
}
