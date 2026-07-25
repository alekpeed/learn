/**
 * Installed course modules (Phase 18).
 *
 * Curriculum is content, not learner state, so it deliberately does NOT live in
 * the append-only event log: installing a course is not something that should
 * replay into progress, and a module is far too large to belong in a progress
 * export. It gets its own store behind the same kind of interface the event
 * store uses, with an in-memory reference implementation for tests.
 *
 * The browser adapter uses a SEPARATE IndexedDB database rather than a new
 * object store in the events database. Adding a store there would mean bumping
 * that database's version, and a failed upgrade would put existing learner
 * progress at risk for no benefit - these two things have no transactional
 * relationship.
 */

export interface InstalledModule {
  module_id: string;
  name: string;
  installed_at: string;
  /** The module file exactly as imported, so it can be re-exported unchanged. */
  json: string;
}

export interface ModuleStore {
  list(): Promise<InstalledModule[]>;
  install(module: InstalledModule): Promise<void>;
  remove(moduleId: string): Promise<void>;
  /** The module the app should teach from, or null to use the bundled content. */
  getActiveId(): Promise<string | null>;
  setActiveId(moduleId: string | null): Promise<void>;
}

export class InMemoryModuleStore implements ModuleStore {
  private readonly modules = new Map<string, InstalledModule>();
  private activeId: string | null = null;

  async list(): Promise<InstalledModule[]> {
    return [...this.modules.values()].sort((a, b) => a.installed_at.localeCompare(b.installed_at));
  }

  async install(module: InstalledModule): Promise<void> {
    this.modules.set(module.module_id, module);
  }

  async remove(moduleId: string): Promise<void> {
    this.modules.delete(moduleId);
    // Removing the active module falls back to the bundled curriculum rather
    // than leaving the app pointing at something that is no longer there.
    if (this.activeId === moduleId) this.activeId = null;
  }

  async getActiveId(): Promise<string | null> {
    return this.activeId;
  }

  async setActiveId(moduleId: string | null): Promise<void> {
    if (moduleId !== null && !this.modules.has(moduleId)) {
      throw new Error(`cannot activate unknown module ${moduleId}`);
    }
    this.activeId = moduleId;
  }
}

const DB_NAME = 'learn-modules';
const MODULES = 'modules';
const SETTINGS = 'settings';
const DB_VERSION = 1;
const ACTIVE_KEY = 'active_module_id';

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbModuleStore implements ModuleStore {
  private dbPromise: Promise<IDBDatabase> | undefined;

  constructor(private readonly factory: IDBFactory = globalThis.indexedDB) {}

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = this.factory.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(MODULES)) {
            db.createObjectStore(MODULES, { keyPath: 'module_id' });
          }
          if (!db.objectStoreNames.contains(SETTINGS)) {
            db.createObjectStore(SETTINGS);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  private async store(name: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(name, mode).objectStore(name);
  }

  async list(): Promise<InstalledModule[]> {
    const store = await this.store(MODULES, 'readonly');
    const all = await promisify(store.getAll());
    return (all as InstalledModule[]).sort((a, b) => a.installed_at.localeCompare(b.installed_at));
  }

  async install(module: InstalledModule): Promise<void> {
    const store = await this.store(MODULES, 'readwrite');
    await promisify(store.put(module));
  }

  async remove(moduleId: string): Promise<void> {
    const store = await this.store(MODULES, 'readwrite');
    await promisify(store.delete(moduleId));
    if ((await this.getActiveId()) === moduleId) await this.setActiveId(null);
  }

  async getActiveId(): Promise<string | null> {
    const store = await this.store(SETTINGS, 'readonly');
    const value = await promisify(store.get(ACTIVE_KEY));
    return typeof value === 'string' ? value : null;
  }

  async setActiveId(moduleId: string | null): Promise<void> {
    const store = await this.store(SETTINGS, 'readwrite');
    if (moduleId === null) {
      await promisify(store.delete(ACTIVE_KEY));
    } else {
      await promisify(store.put(moduleId, ACTIVE_KEY));
    }
  }
}
