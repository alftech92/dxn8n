import type { MigrationContext, ReversibleMigration } from '@/databases/types';

export class SeparateExecutionCreationFromStart1726218295879 implements ReversibleMigration {
	async up({
		schemaBuilder: { addColumns, column, dropNotNull },
		runQuery,
		escape,
	}: MigrationContext) {
		await addColumns('execution_entity', [
			column('createdAt').notNull.timestamp().default('NOW()'),
		]);

		await dropNotNull('execution_entity', 'startedAt');

		const executionEntity = escape.tableName('execution_entity');

		// inaccurate for pre-migration rows but prevents `createdAt` from being nullable
		await runQuery(`UPDATE ${executionEntity} SET createdAt = startedAt;`);
	}

	async down({ schemaBuilder: { dropColumns, addNotNull } }: MigrationContext) {
		await dropColumns('execution_entity', ['createdAt']);
		await addNotNull('execution_entity', 'startedAt');
	}
}
