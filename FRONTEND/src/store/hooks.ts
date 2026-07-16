import { useStore } from '@/store/store';
import type { Database } from '@/data/seedData';

/** Returns the full DB and the active tenant id. */
export function useDb() {
  const db = useStore((s) => s.db);
  const tenantId = useStore((s) => s.activeTenantId);
  return { db, tenantId };
}

/** Returns a tenant-scoped array from a DB collection. */
export function useTenant<K extends keyof Database>(key: K): Database[K] {
  const db = useStore((s) => s.db);
  const tenantId = useStore((s) => s.activeTenantId);
  const arr = db[key] as unknown as { tenant_id?: string }[];
  if (Array.isArray(arr)) {
    return arr.filter((x) => x.tenant_id === tenantId) as unknown as Database[K];
  }
  return db[key];
}

export function useSettings() {
  const db = useStore((s) => s.db);
  const tenantId = useStore((s) => s.activeTenantId);
  return db.settings[tenantId] ?? db.settings['tenant_alpha'];
}

export function useUsers() {
  const db = useStore((s) => s.db);
  const tenantId = useStore((s) => s.activeTenantId);
  return db.users.filter((u) => u.tenant_id === tenantId || u.role === 'Super Admin');
}

export function userName(db: Database, id: string | null): string {
  if (!id) return 'Unassigned';
  return db.users.find((u) => u.id === id)?.name ?? 'Unassigned';
}
