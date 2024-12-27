import 'reflect-metadata';

/**
 * Represents a class constructor type that can be instantiated with 'new'
 * @template T The type of instance the constructor creates
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructable<T = any> = new (...args: any[]) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AbstractConstructable<T = any> = abstract new (...args: any[]) => T;

interface Metadata<T = unknown> {
	instance?: T;
	factory?: () => T;
}

interface Options<T> {
	factory?: () => T;
}

const instances = new Map<Constructable | AbstractConstructable, Metadata>();

/**
 * Decorator that marks a class as available for dependency injection.
 * @param options Configuration options for the injectable class
 * @param options.factory Optional factory function to create instances of this class
 * @returns A class decorator to be applied to the target class
 */
export function Injectable<T>({ factory }: Options<T> = {}): ClassDecorator {
	return (target) => {
		instances.set(target as unknown as Constructable<T>, { factory });
		return target;
	};
}

class DIError extends Error {
	constructor(message: string) {
		super(`[DI] ${message}`);
	}
}

class ContainerClass {
	/** Stack to track types being resolved to detect circular dependencies */
	private readonly resolutionStack: Array<Constructable | AbstractConstructable> = [];

	/**
	 * Checks if a type is registered in the container
	 * @template T The type to check for
	 * @param type The constructor of the type to check
	 * @returns True if the type is registered (has metadata), false otherwise
	 */
	has<T>(type: Constructable<T> | AbstractConstructable<T>): boolean {
		return instances.has(type);
	}

	/**
	 * Retrieves or creates an instance of the specified type from the container
	 * @template T The type of instance to retrieve
	 * @param type The constructor of the type to retrieve
	 * @returns An instance of the specified type with all dependencies injected
	 * @throws {DIError} If circular dependencies are detected or if the type is not injectable
	 */
	get<T>(type: Constructable<T> | AbstractConstructable<T>): T {
		const { resolutionStack } = this;
		// Get metadata for the requested type, including any factory or existing instance
		const metadata = instances.get(type) as Metadata<T>;
		if (!metadata) {
			// Special case: Allow undefined returns for non-decorated constructor params
			// when resolving a dependency chain (i.e., resolutionStack not empty)
			if (resolutionStack.length) return undefined as T;
			throw new DIError(`${type.name} is not decorated with ${Injectable.name}`);
		}

		// Return cached instance if it exists
		if (metadata?.instance) return metadata.instance as T;

		// Check for circular dependencies before proceeding with instantiation
		if (resolutionStack.includes(type)) {
			throw new DIError(
				`Circular dependency detected. ${resolutionStack.map((t) => t.name).join(' -> ')}`,
			);
		}

		// Add current type to resolution stack before resolving dependencies
		resolutionStack.push(type);

		try {
			let instance: T;

			if (metadata?.factory) {
				instance = metadata.factory();
			} else {
				// Get constructor parameter types using reflect-metadata
				const paramTypes = (Reflect.getMetadata('design:paramtypes', type) ||
					[]) as Constructable[];
				// Recursively resolve all dependencies
				const dependencies = paramTypes.map(<P>(paramType: Constructable<P>) =>
					this.get(paramType),
				);
				// Create new instance with resolved dependencies
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
				instance = new (type as Constructable)(...dependencies);
			}

			// Cache the instance for future retrievals
			instances.set(type, { ...metadata, instance });
			return instance;
		} catch (error) {
			if (error instanceof TypeError && error.message.toLowerCase().includes('abstract')) {
				throw new DIError(`${type.name} is an abstract class, and cannot be instantiated`);
			}
			throw error;
		} finally {
			// Always remove type from stack, even if an error occurred
			resolutionStack.pop();
		}
	}

	/**
	 * Manually sets an instance for a specific type in the container
	 * @template T The type of instance being set
	 * @param type The constructor of the type to set. This can also be an abstract class
	 * @param instance The instance to store in the container
	 */
	set<T>(type: Constructable<T> | AbstractConstructable<T>, instance: T): void {
		// Preserve any existing metadata (like factory) when setting new instance
		const metadata = instances.get(type) ?? {};
		instances.set(type, { ...metadata, instance });
	}

	/** Clears all instantiated instances from the container while preserving type registrations */
	reset(): void {
		for (const metadata of instances.values()) {
			delete metadata.instance;
		}
	}
}

/** @deprecated Use Injectable decorator instead  */
export const Service = Injectable;

/**
 * Global dependency injection container instance
 * Used to retrieve and manage class instances and their dependencies
 */
export const Container = new ContainerClass();
