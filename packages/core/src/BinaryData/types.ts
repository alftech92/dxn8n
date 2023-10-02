import type { Readable } from 'stream';
import type { CONFIG_BINARY_DATA_MODES } from './utils';

export namespace BinaryData {
	type LegacyMode = 'filesystem';

	type UpgradedMode = 'filesystem-v2';

	/**
	 * Binary data mode selectable by user via env var config.
	 */
	export type ConfigMode = (typeof CONFIG_BINARY_DATA_MODES)[number];

	/**
	 * Binary data mode used internally by binary data service. User-selected
	 * legacy modes are replaced with upgraded modes.
	 */
	export type ServiceMode = Exclude<ConfigMode, LegacyMode> | UpgradedMode;

	/**
	 * Binary data mode in binary data ID in stored execution data, where
	 * both legacy and upgraded modes may be present.
	 */
	export type StoredMode = Exclude<ConfigMode | UpgradedMode, 'default'>;

	export type Config = {
		mode: ConfigMode;
		availableModes: ConfigMode[];
		localStoragePath: string;
	};

	export type Metadata = {
		fileName?: string;
		mimeType?: string;
		fileSize: number;
	};

	export type WriteResult = { fileId: string; fileSize: number };

	export type PreWriteMetadata = Omit<Metadata, 'fileSize'>;

	export type IdsForDeletion = Array<{ workflowId: string; executionId: string }>;

	export interface Manager {
		init(): Promise<void>;

		store(
			workflowId: string,
			executionId: string,
			bufferOrStream: Buffer | Readable,
			metadata: PreWriteMetadata,
		): Promise<WriteResult>;

		getPath(fileId: string): string;
		getAsBuffer(fileId: string): Promise<Buffer>;
		getAsStream(fileId: string, chunkSize?: number): Promise<Readable>;
		getMetadata(fileId: string): Promise<Metadata>;

		deleteMany(ids: IdsForDeletion): Promise<void>;

		copyByFileId(workflowId: string, executionId: string, sourceFileId: string): Promise<string>;
		copyByFilePath(
			workflowId: string,
			executionId: string,
			sourcePath: string,
			metadata: PreWriteMetadata,
		): Promise<WriteResult>;

		rename(oldFileId: string, newFileId: string): Promise<void>;
	}
}
