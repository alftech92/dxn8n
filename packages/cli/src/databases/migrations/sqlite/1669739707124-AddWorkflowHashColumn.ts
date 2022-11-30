import { MigrationInterface, QueryRunner } from 'typeorm';
import { logMigrationEnd, logMigrationStart } from '@db/utils/migrationHelpers';
import config from '@/config';
import { v4 as uuidv4 } from 'uuid';

export class AddWorkflowHashColumn1669739707124 implements MigrationInterface {
	name = 'AddWorkflowHashColumn1669739707124';

	async up(queryRunner: QueryRunner): Promise<void> {
		logMigrationStart(this.name);

		const tablePrefix = config.getEnv('database.tablePrefix');

		await queryRunner.query(
			`ALTER TABLE \`${tablePrefix}workflow_entity\` ADD COLUMN "hash" char(36)`,
		);

		const workflowIds: Array<{ id: number }> = await queryRunner.query(`
			SELECT id
			FROM "${tablePrefix}workflow_entity"
		`);

		workflowIds.map(({ id }) => {
			const [updateQuery, updateParams] = queryRunner.connection.driver.escapeQueryWithParameters(
				`
					UPDATE "${tablePrefix}workflow_entity"
					SET hash = :hash
					WHERE id = '${id}'
				`,
				{ hash: uuidv4() },
				{},
			);

			return queryRunner.query(updateQuery, updateParams);
		});

		logMigrationEnd(this.name);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		const tablePrefix = config.getEnv('database.tablePrefix');

		await queryRunner.query(
			`ALTER TABLE \`${tablePrefix}workflow_entity\` DROP COLUMN "hash"`,
		);
	}
}
