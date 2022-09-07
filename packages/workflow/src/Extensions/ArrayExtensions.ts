/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
// eslint-disable-next-line import/no-cycle
import { ExpressionError } from '../ExpressionError';
import { BaseExtension, ExtensionMethodHandler } from './Extensions';

export class ArrayExtensions extends BaseExtension<any> {
	methodMapping = new Map<string, ExtensionMethodHandler<any>>();

	constructor() {
		super();
		this.initializeMethodMap();
	}

	bind(mainArg: any[], extraArgs?: number[] | string[] | boolean[] | undefined) {
		return Array.from(this.methodMapping).reduce((p, c) => {
			const [key, method] = c;
			Object.assign(p, {
				[key]: () => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return method.call('', mainArg, extraArgs);
				},
			});
			return p;
		}, {} as object);
	}

	private initializeMethodMap(): void {
		this.methodMapping = new Map<
			string,
			(
				value: any[],
				extraArgs?: number[] | string[] | boolean[] | undefined,
			) => any[] | boolean | string | Date | number
		>([
			['duplicates', this.unique],
			['isPresent', this.isPresent],
			['filter', this.filter],
			['first', this.first],
			['last', this.last],
			['length', this.length],
			['pluck', this.pluck],
			['unique', this.unique],
			['random', this.random],
			['remove', this.unique],
		]);
	}

	filter(value: any[], extraArgs?: any[]): any[] {
		if (!Array.isArray(extraArgs)) {
			throw new ExpressionError('arguments must be passed to filter');
		}
		const terms = extraArgs as string[] | number[];
		return value.filter((v: string | number) => (terms as Array<typeof v>).includes(v));
	}

	first(value: any[]): any {
		return value[0];
	}

	isBlank(value: any[]): boolean {
		return Array.isArray(value) && value.length === 0;
	}

	isPresent(value: any[], extraArgs?: any[]): boolean {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		if (!Array.isArray(extraArgs)) {
			throw new ExpressionError('arguments must be passed to isPresent');
		}
		const comparators = extraArgs as string[] | number[];
		return value.some((v: string | number) => {
			return (comparators as Array<typeof v>).includes(v);
		});
	}

	last(value: any[]): any {
		return value[value.length - 1];
	}

	length(value: any[]): number {
		return Array.isArray(value) ? value.length : 0;
	}

	pluck(value: any[], extraArgs: any[]): any[] {
		if (!Array.isArray(extraArgs)) {
			throw new ExpressionError('arguments must be passed to pluck');
		}
		const fieldsToPluck = extraArgs;
		return value.map((element: object) => {
			const entries = Object.entries(element);
			return entries.reduce((p, c) => {
				const [key, val] = c as [string, Date | string | number];
				if (fieldsToPluck.includes(key)) {
					Object.assign(p, { [key]: val });
				}
				return p;
			}, {});
		});
	}

	random(value: any[]): any {
		const length = value == null ? 0 : value.length;
		return length ? value[Math.floor(Math.random() * length)] : undefined;
	}

	unique(value: any[]): any[] {
		return Array.from(new Set(value));
	}
}
