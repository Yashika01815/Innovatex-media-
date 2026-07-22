import { metaWebhookService } from './metaWebhook.service.js';
import { whatsappSettingsService } from '../submodules/whatsappSettings/whatsappSettings.service.js';
import asyncHandler from '../../../utils/asyncHandler.js';

export const metaWebhookController = {
  /**
   * GET /api/whatsapp/webhooks/meta/:tenantId
   * Meta's one-time verification handshake. MUST respond with the raw
   * hub.challenge value as plain text -- not JSON, not wrapped -- or Meta
   * refuses to save the webhook URL in their dashboard.
   */
  verify: asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const result = await metaWebhookService.handleVerification(tenantId, req.query);
    res.status(200).type('text/plain').send(result.challenge);
  }),

  /**
   * POST /api/whatsapp/webhooks/meta/:tenantId
   * Real inbound messages + status updates. Deliberately unauthenticated
   * (Meta can't send a JWT) -- security comes from the HMAC signature
   * check instead, verified against THIS tenant's own appSecret.
   */
  receive: asyncHandler(async (req, res) => {
    const { tenantId } = req.params;

    const config = await whatsappSettingsService.getProviderConfig({ tenantId }).catch(() => null);
    const appSecret = config?.meta?.appSecret;

    const signature = req.headers['x-hub-signature-256'];
    const valid = metaWebhookService.verifySignature(req.rawBody, signature, appSecret);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Signature verification failed' });
    }

    await metaWebhookService.processPayload(tenantId, req.body);
    res.status(200).json({ success: true });
  }),
};