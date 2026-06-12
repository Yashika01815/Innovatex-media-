import { AppError } from '../../../shared/helpers/lead.helpers.js';
import { DEAL_STAGE_VALUES } from './deal.constants.js';

const ALLOWED_FIELDS = [
  'lead_id',
  'title',
  'description',
  'value',
  'probability',
  'stage',
  'source',
  'assigned_user_id',
  'expected_close_date',
  'currency',
];

const isString = (v) => typeof v === 'string';

function checkCommon(body, errors) {
  if (body.stage !== undefined && !DEAL_STAGE_VALUES.includes(body.stage)) {
    errors.push({ field: 'stage', message: 'Invalid stage value' });
  }
  if (body.value !== undefined) {
    const n = Number(body.value);
    if (Number.isNaN(n) || n < 0) {
      errors.push({ field: 'value', message: 'value must be >= 0' });
    }
  }
  if (body.probability !== undefined) {
    const n = Number(body.probability);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      errors.push({
        field: 'probability',
        message: 'probability must be between 0 and 100',
      });
    }
  }
  if (body.expected_close_date !== undefined) {
    const d = new Date(body.expected_close_date);
    if (Number.isNaN(d.getTime())) {
      errors.push({
        field: 'expected_close_date',
        message: 'expected_close_date must be a valid date',
      });
    }
  }
}

function rejectUnknown(body, errors) {
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(key)) {
      errors.push({ field: key, message: 'Unknown field' });
    }
  }
}

/** POST /api/deals — lead_id, title, stage required. */
export const validateCreateDeal = (req, _res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.lead_id || !isString(String(body.lead_id))) {
    errors.push({ field: 'lead_id', message: 'lead_id is required' });
  }
  if (!isString(body.title) || !body.title.trim()) {
    errors.push({ field: 'title', message: 'title is required' });
  }
  if (!body.stage) {
    errors.push({ field: 'stage', message: 'stage is required' });
  }
  checkCommon(body, errors);
  rejectUnknown(body, errors);

  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};

/** PATCH /api/deals/:id — all optional, reject invalid values + unknown fields. */
export const validateUpdateDeal = (req, _res, next) => {
  const body = req.body || {};
  const errors = [];

  if (Object.keys(body).length === 0) {
    errors.push({ field: 'body', message: 'At least one field is required' });
  }
  if (body.lead_id !== undefined) {
    errors.push({ field: 'lead_id', message: 'lead_id cannot be changed' });
  }
  if (body.title !== undefined && (!isString(body.title) || !body.title.trim())) {
    errors.push({ field: 'title', message: 'title cannot be empty' });
  }
  checkCommon(body, errors);
  rejectUnknown(body, errors);

  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};

/** PATCH /api/deals/:id/stage — stage required + valid. */
export const validateMoveStage = (req, _res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.stage) {
    errors.push({ field: 'stage', message: 'stage is required' });
  } else if (!DEAL_STAGE_VALUES.includes(body.stage)) {
    errors.push({ field: 'stage', message: 'Invalid stage value' });
  }

  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};