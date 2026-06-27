/**
 * =============================================================================
 * InnovateX Revenue OS — Express Application
 * =============================================================================
 *
 * FILE: src/app.js
 * =============================================================================
 */

import express     from 'express';
import helmet      from 'helmet';
import cors        from 'cors';
import compression from 'compression';
import morgan      from 'morgan';
import cookieParser from 'cookie-parser';

// ── Route Imports ─────────────────────────────────────────────────────────────
import authRoutes     from './modules/auth/routes/auth.routes.js';
import leadRoutes     from './modules/leads/lead/lead.routes.js';
import pipelineRouter from './modules/pipeline/pipeline.routes.js';
import whatsappRouter from './modules/whatsapp/whatsapp.routes.js';
import callRoutes          from './modules/calls/call.routes.js';
import qualificationRoutes from './modules/qualification/qualification.routes.js';
import attributionRoutes from './modules/attribution/attribution.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import contactsRoutes from './modules/whatsapp/submodules/contacts/contacts.routes.js';
import templatesRoutes from './modules/whatsapp/submodules/templates/templates.routes.js';
import { templateApprovalRoutes, templateApprovalWebhookRoutes } from './modules/whatsapp/submodules/templateApproval/templateApproval.routes.js';
import campaignsRoutes from './modules/whatsapp/submodules/campaigns/campaigns.routes.js';
import broadcastsRoutes  from './modules/whatsapp/submodules/broadcasts/broadcasts.routes.js';
import nurturesRoutes  from './modules/whatsapp/submodules/nurtures/nurtures.routes.js';
import aiReplyAssistantRoutes from './modules/whatsapp/submodules/aiReplyAssistant/aiReplyAssistant.routes.js';
import automationRulesRoutes   from './modules/whatsapp/submodules/automationRules/automationRules.routes.js';
import deliveryLogsRoutes      from './modules/whatsapp/submodules/deliveryLogs/deliveryLogs.routes.js';
import consentRoutes           from './modules/whatsapp/submodules/consent/consent.routes.js';


// ── Middleware Imports ────────────────────────────────────────────────────────
import { errorHandler, notFoundHandler } from './shared/middlewares/errorHandler.middleware.js';
import { generalApiRateLimit }           from './shared/middlewares/rateLimit.middleware.js';

const app = express();

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin:      process.env.CLIENT_URL || '*',
    credentials: true, // Required for HttpOnly cookies
  })
);

/*
|--------------------------------------------------------------------------
| Cookie Parser — Required for HttpOnly refresh token cookies
|--------------------------------------------------------------------------
*/
app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/*
|--------------------------------------------------------------------------
| Compression
|--------------------------------------------------------------------------
*/
app.use(compression());

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/*
|--------------------------------------------------------------------------
| Health Check (unauthenticated)
|--------------------------------------------------------------------------
*/
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'InnovateX Revenue OS API',
    version: '1.0.0',
    status:  'healthy',
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Rate Limiting (global)
|--------------------------------------------------------------------------
*/
app.use('/api', generalApiRateLimit);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/
app.use('/api/auth',      authRoutes);
app.use('/api/leads',     leadRoutes);
app.use('/api/pipeline',  pipelineRouter);
app.use('/api/whatsapp',  whatsappRouter);
app.use('/api/calls',          callRoutes);
app.use('/api/qualification', qualificationRoutes);
app.use('/api/attribution',  attributionRoutes);
app.use('/api/bookings',       bookingRoutes);
app.use('/api/whatsapp/contacts', contactsRoutes);
app.use('/api/whatsapp/templates', templatesRoutes);
// Template approval actions share the /api/whatsapp/templates/:id namespace.
// Declared AFTER templatesRoutes so static routes (/categories, /languages) win first.
app.use('/api/whatsapp/templates', templateApprovalRoutes);
// Provider webhooks: unauthenticated, verified by provider signature in production.
app.use('/api/whatsapp/template-approval', templateApprovalWebhookRoutes);
app.use('/api/whatsapp/campaigns', campaignsRoutes);
app.use('/api/whatsapp/broadcasts',  broadcastsRoutes);
app.use('/api/whatsapp/nurtures',  nurturesRoutes);
app.use('/api/whatsapp/ai', aiReplyAssistantRoutes);
app.use('/api/whatsapp/automationRules', automationRulesRoutes);
app.use('/api/whatsapp/deliveryLogs', deliveryLogsRoutes);
app.use('/api/whatsapp/consent', consentRoutes);
/*
|--------------------------------------------------------------------------
| 404 Handler — MUST come after all routes
|--------------------------------------------------------------------------
*/
app.use(notFoundHandler);

/*
|--------------------------------------------------------------------------
| Global Error Handler — MUST be last middleware (4 params)
|--------------------------------------------------------------------------
*/
app.use(errorHandler);

export default app;