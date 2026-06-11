import { LEAD_STATUS } from '../lead/lead.constants.js';

/**
 * Deterministic "recommended next action" for the lead detail drawer.
 * Mock AI — maps lifecycle state + signals to a concrete suggested step.
 * (Swap the body for a real model call later; keep the signature.)
 */
const STATUS_ACTION = {
  [LEAD_STATUS.NEW]: {
    action: 'Send a WhatsApp intro message',
    reason: 'Lead is brand new — open the conversation quickly.',
  },
  [LEAD_STATUS.CONTACTED]: {
    action: 'Run AI qualification',
    reason: 'Contact made; qualify fit before investing more time.',
  },
  [LEAD_STATUS.QUALIFIED]: {
    action: 'Book a discovery call',
    reason: 'Qualified lead — move to a booked call.',
  },
  [LEAD_STATUS.BOOKED]: {
    action: 'Send a booking reminder',
    reason: 'Reduce no-show risk before the meeting.',
  },
  [LEAD_STATUS.CALL_COMPLETED]: {
    action: 'Send a proposal',
    reason: 'Call done — capitalize on momentum with a proposal.',
  },
  [LEAD_STATUS.PROPOSAL_SENT]: {
    action: 'Send a payment link follow-up',
    reason: 'Proposal out — nudge toward payment.',
  },
  [LEAD_STATUS.NURTURE]: {
    action: 'Enroll in a nurture sequence',
    reason: 'Not ready yet — keep warm with automated touches.',
  },
  [LEAD_STATUS.GHOSTED]: {
    action: 'Trigger a re-engagement message',
    reason: 'Lead went quiet — attempt recovery.',
  },
  [LEAD_STATUS.WON]: {
    action: 'Request a referral / onboard',
    reason: 'Closed won — expand the relationship.',
  },
  [LEAD_STATUS.LOST]: {
    action: 'Add to long-term nurture',
    reason: 'Lost for now — revisit later.',
  },
};

export const nextActionService = {
  recommend(lead = {}) {
    const base =
      STATUS_ACTION[lead.status] || STATUS_ACTION[LEAD_STATUS.NEW];

    // Opt-out overrides everything.
    if (lead.opt_out_status) {
      return {
        action: 'Do not contact (opted out)',
        reason: 'Lead has opted out of messaging.',
      };
    }
    return { ...base };
  },
};
