import { Router } from 'express';

import { authenticate } from '../../shared/middlewares/auth.middleware.js';
import { resolveTenant } from '../../shared/middlewares/tenant.middleware.js';
import { withContext } from '../../shared/helpers/lead.helpers.js';

import inboxRoutes from './submodules/inbox/inbox.routes.js';
import conversationRoutes from './conversations/conversation.routes.js';
import messageRoutes from './messages/message.routes.js';
import contactsRoutes from './submodules/contacts/contacts.routes.js';
import templatesRoutes from './submodules/templates/templates.routes.js';
import {
  templateApprovalRoutes,
  templateApprovalWebhookRoutes,
} from './submodules/templateApproval/templateApproval.routes.js';
import campaignsRoutes from './submodules/campaigns/campaigns.routes.js';
import broadcastsRoutes from './submodules/broadcasts/broadcasts.routes.js';
import nurturesRoutes from './submodules/nurtures/nurtures.routes.js';
import aiReplyAssistantRoutes from './submodules/aiReplyAssistant/aiReplyAssistant.routes.js';
import automationRulesRoutes   from './submodules/automationRules/automationRules.routes.js';
import deliveryLogsRoutes      from './submodules/deliveryLogs/deliveryLogs.routes.js';
import consentRoutes           from './submodules/consent/consent.routes.js';

const whatsappRouter = Router();

/**
 * Authentication FIRST
 */
whatsappRouter.use(authenticate);

/**
 * Resolve tenant
 */
whatsappRouter.use(resolveTenant);

/**
 * Build request context from authenticated user
 */
whatsappRouter.use(withContext);

/**
 * Feature modules
 */
whatsappRouter.use('/inbox', inboxRoutes);
whatsappRouter.use('/conversations', conversationRoutes);
whatsappRouter.use('/messages', messageRoutes);
whatsappRouter.use('/contacts', contactsRoutes);

whatsappRouter.use('/templates', templatesRoutes);
whatsappRouter.use('/templates', templateApprovalRoutes);

whatsappRouter.use('/template-approval', templateApprovalWebhookRoutes);

whatsappRouter.use('/campaigns', campaignsRoutes);
whatsappRouter.use('/broadcasts', broadcastsRoutes);
whatsappRouter.use('/nurtures', nurturesRoutes);
whatsappRouter.use('/ai', aiReplyAssistantRoutes);
whatsappRouter.use('/automation-rules', automationRulesRoutes);
whatsappRouter.use('/delivery-logs', deliveryLogsRoutes);
whatsappRouter.use('/consent', consentRoutes);

export default whatsappRouter;