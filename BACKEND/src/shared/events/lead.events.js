import { EventEmitter } from 'node:events';

/**
 * Phase 12 — in-process event bus for the modular monolith.
 * Feature modules emit; subscribers (notifications, attribution, dashboard
 * cache, …) react without the Lead module knowing about them.
 */
class LeadEventBus extends EventEmitter {}

export const leadEventBus = new LeadEventBus();
leadEventBus.setMaxListeners(50);

export const LEAD_EVENTS = Object.freeze({
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_UPDATED: 'LEAD_UPDATED',
  LEAD_ARCHIVED: 'LEAD_ARCHIVED',
  LEAD_ASSIGNED: 'LEAD_ASSIGNED',
  LEAD_CAPTURED: 'LEAD_CAPTURED',
});

export const leadEvents = {
  emit(event, payload) {
    leadEventBus.emit(event, { event, at: new Date().toISOString(), ...payload });
  },
  created(payload) {
    this.emit(LEAD_EVENTS.LEAD_CREATED, payload);
  },
  updated(payload) {
    this.emit(LEAD_EVENTS.LEAD_UPDATED, payload);
  },
  archived(payload) {
    this.emit(LEAD_EVENTS.LEAD_ARCHIVED, payload);
  },
  assigned(payload) {
    this.emit(LEAD_EVENTS.LEAD_ASSIGNED, payload);
  },
  captured(payload) {
    this.emit(LEAD_EVENTS.LEAD_CAPTURED, payload);
  },
};

// Default listeners (logging). Registered once on first import.
let registered = false;
export function registerLeadEventHandlers() {
  if (registered) return;
  registered = true;
  for (const name of Object.values(LEAD_EVENTS)) {
    leadEventBus.on(name, (p) =>
      console.log(`[event] ${name} lead=${p.leadId} tenant=${p.tenantId}`),
    );
  }
}

registerLeadEventHandlers();