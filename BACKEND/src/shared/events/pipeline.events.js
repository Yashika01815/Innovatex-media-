import { EventEmitter } from 'node:events';

/**
 * Pipeline domain event bus (mirrors the Lead module's event bus).
 * Other modules (attribution / tracking, dashboard, notifications) subscribe
 * here. The "tracking event" required on stage change is emitted as
 * `deal.stage_changed` for the Attribution module to persist.
 */
class PipelineEventBus extends EventEmitter {}

export const pipelineEventBus = new PipelineEventBus();
pipelineEventBus.setMaxListeners(50);

export const PIPELINE_EVENTS = Object.freeze({
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_ARCHIVED: 'deal.archived',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
});

export const pipelineEvents = {
  emit(event, payload) {
    pipelineEventBus.emit(event, {
      event,
      at: new Date().toISOString(),
      ...payload,
    });
  },
  created(payload) {
    this.emit(PIPELINE_EVENTS.DEAL_CREATED, payload);
  },
  updated(payload) {
    this.emit(PIPELINE_EVENTS.DEAL_UPDATED, payload);
  },
  archived(payload) {
    this.emit(PIPELINE_EVENTS.DEAL_ARCHIVED, payload);
  },
  stageChanged(payload) {
    this.emit(PIPELINE_EVENTS.DEAL_STAGE_CHANGED, payload);
  },
};

let registered = false;
export function registerPipelineEventHandlers() {
  if (registered) return;
  registered = true;
  for (const name of Object.values(PIPELINE_EVENTS)) {
    pipelineEventBus.on(name, (p) =>
      console.log(`[event] ${name} deal=${p.dealId} tenant=${p.tenantId}`),
    );
  }
}

registerPipelineEventHandlers();