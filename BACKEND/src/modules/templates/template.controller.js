/**
 * Generic Template controller - thin HTTP layer only.
 * No business logic. Pattern matches automation.controller.js.
 *
 * FILE: src/modules/templates/template.controller.js
 *
 * NOTE: unlike most controllers in this codebase, these pass req.user
 * (the whole object) into the service rather than tenantId alone - the
 * service's scope/visibility rules need role and sub throughout, not just
 * tenantId. See template.service.js for why.
 */

import * as templateService from './template.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getCounts = asyncHandler(async (req, res) => {
  const filter = { scope: req.query.scope, search: req.query.search };
  const counts = await templateService.getTypeCounts(req.user, filter);
  return sendSuccess(res, counts, 'Template counts fetched successfully');
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.user, req.body);
  return sendCreated(res, template, 'Template created successfully');
});

export const getTemplates = asyncHandler(async (req, res) => {
  const filter = {
    type: req.query.type,
    scope: req.query.scope,
    search: req.query.search,
  };
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await templateService.listTemplates(req.user, filter, options);
  return sendPaginated(res, result.templates, result.pagination, 'Templates fetched successfully');
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.user, req.params.id);
  return sendSuccess(res, template, 'Template fetched successfully');
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.user, req.params.id, req.body);
  return sendSuccess(res, template, 'Template updated successfully');
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.user, req.params.id);
  return sendSuccess(res, result, 'Template deleted successfully');
});

export const duplicateTemplate = asyncHandler(async (req, res) => {
  const copy = await templateService.duplicateTemplate(req.user, req.params.id);
  return sendCreated(res, copy, 'Template duplicated successfully');
});

export const getVersions = asyncHandler(async (req, res) => {
  const result = await templateService.getVersions(req.user, req.params.id);
  return sendSuccess(res, result, 'Template versions fetched successfully');
});
