import { dealRepository } from '../deals/deal.repository.js';
import {
  DEAL_STAGE,
  STAGE_ORDER,
  STAGE_BOARD_KEY,
  CLOSED_STAGES,
} from '../deals/deal.constants.js';

/**
 * Pipeline analytics. Reads through the Deal repository only (repositories
 * remain the single MongoDB-access layer).
 */
export const analyticsService = {
  async getStats(ctx) {
    const breakdown = await dealRepository.stageBreakdown(ctx.tenantId);

    // Index breakdown by stage label.
    const byStage = {};
    for (const row of breakdown) {
      byStage[row._id] = { count: row.count, value: row.value };
    }

    // Per-stage totals keyed by board key (all 9 columns present).
    const stageTotals = {};
    let totalDeals = 0;
    let pipelineValue = 0;

    for (const stage of STAGE_ORDER) {
      const { count = 0, value = 0 } = byStage[stage] || {};
      stageTotals[STAGE_BOARD_KEY[stage]] = { count, value };
      totalDeals += count;
      if (!CLOSED_STAGES.includes(stage)) pipelineValue += value;
    }

    const won = byStage[DEAL_STAGE.WON] || { count: 0, value: 0 };
    const lost = byStage[DEAL_STAGE.LOST] || { count: 0, value: 0 };
    const closed = won.count + lost.count;
    const winRate = closed > 0 ? round(won.count / closed, 4) : 0;

    return {
      totalDeals,
      pipelineValue,
      wonValue: won.value,
      lostValue: lost.value,
      winRate, // ratio 0–1 (Won / (Won + Lost))
      stageTotals,
    };
  },
};

function round(n, dp) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}