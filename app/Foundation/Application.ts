import type { Abstract } from './Abstract';
import type { ServiceProvider, ServiceProviderClass } from './ServiceProvider';

type Factory<T> = (app: Application) => T;

/**
 * Service container and provider lifecycle orchestrator.
 *
 * Bindings are lazy singletons keyed by class: the first make() runs the factory,
 * later calls return the same instance.
 */
export class Application {
  private readonly factories = new Map<Abstract<unknown>, Factory<unknown>>();
  private readonly instances = new Map<Abstract<unknown>, unknown>();
  private readonly providers: ServiceProvider[];
  private booted = false;

  constructor(providers: ServiceProviderClass[]) {
    this.providers = providers.map((Provider) => new Provider(this));
    this.providers.forEach((provider) => provider.register());
  }

  singleton<T>(abstract: Abstract<T>, factory: Factory<T>): void {
    this.factories.set(abstract, factory);
  }

  make<T>(abstract: Abstract<T>): T {
    if (this.instances.has(abstract)) return this.instances.get(abstract) as T;

    const factory = this.factories.get(abstract);
    if (!factory) throw new Error(`No binding registered for ${abstract.name}.`);

    const instance = factory(this);
    this.instances.set(abstract, instance);
    return instance as T;
  }

  /** Boots every provider once, in registration order. */
  boot(): void {
    if (this.booted) return;

    this.providers.forEach((provider) => provider.boot());
    this.booted = true;
  }

  /** Tears providers down in reverse order, so dependents stop before their dependencies. */
  terminate(): void {
    this.providers.toReversed().forEach((provider) => provider.terminate());
  }
}
