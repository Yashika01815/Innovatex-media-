
export const CALL_OUTCOME = Object.freeze({
  INTERESTED:        'Interested',
  NOT_INTERESTED:    'Not Interested',
  NEEDS_FOLLOW_UP:   'Needs Follow-Up',
  PROPOSAL_REQUESTED:'Proposal Requested',
  CLOSED_WON:        'Closed Won',
  CLOSED_LOST:       'Closed Lost',
  NO_SHOW:           'No Show',
});
export const CALL_OUTCOME_VALUES = Object.freeze(Object.values(CALL_OUTCOME));


export const PIPELINE_STAGE_ON_CALL = 'Call Completed';


export const LEAD_STATUS_ON_CALL = 'Call Completed';


export const TRACKING_EVENT_ON_CALL = 'Call Completed';


export const AI_API_KEY_ENV = 'AI_API_KEY';