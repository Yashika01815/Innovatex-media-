import { Router } from 'express';
import { templatesController } from './templates.controller.js';
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  validateListTemplates,
  validateIdParam,
  validatePreview,
} from './templates.validator.js';

/**
 * WhatsApp Templates routes.
 * Mount at: app.use('/api/whatsapp/templates', templatesRoutes)
 * (composed by whatsapp.routes.js). Auth middleware is expected upstream to
 * populate req.user (tenantId, id, name).
 *
 * Static collection routes are declared before "/:id" so they are not shadowed.
 */
const templateRoutes = Router();

templateRoutes.get('/categories', templatesController.categories);
templateRoutes.get('/languages', templatesController.languages);

templateRoutes.post('/', validateCreateTemplate, templatesController.create);
templateRoutes.get('/', validateListTemplates, templatesController.list);

templateRoutes.get('/:id', validateIdParam, templatesController.get);
templateRoutes.patch('/:id', validateUpdateTemplate, templatesController.update);
templateRoutes.delete('/:id', validateIdParam, templatesController.remove);

templateRoutes.post('/:id/duplicate', validateIdParam, templatesController.duplicate);
templateRoutes.post('/:id/activate', validateIdParam, templatesController.activate);
templateRoutes.post('/:id/pause', validateIdParam, templatesController.pause);
templateRoutes.post('/:id/archive', validateIdParam, templatesController.archive);
templateRoutes.post('/:id/sync', validateIdParam, templatesController.sync);
templateRoutes.post('/:id/preview', validatePreview, templatesController.preview);

export default templateRoutes;
