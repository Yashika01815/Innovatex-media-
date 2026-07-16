let counter = 1000;

export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}
