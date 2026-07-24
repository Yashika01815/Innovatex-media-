import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types/whatsapp';
import type { WhatsAppTemplate } from '@/types/whatsappTemplate';
import type { DeliveryLog } from '@/types/whatsappDeliveryLog';

interface UseWhatsAppRealtimeOptions {
  onMessage?: (payload: { conversationId: string; message: Message }) => void;
  onConversation?: (payload: { conversation: Conversation }) => void;
  /**
   * Fires on 'whatsapp:template' -- emitted by templateApproval.service.js's
   * providerApproved/providerRejected/providerPaused/providerDisabled, i.e.
   * whenever Meta's real webhook changes a template's approvalStatus. Used
   * by ApprovalTab to refetch without a manual page reload.
   */
  onTemplate?: (payload: { templateId: string; template: WhatsAppTemplate }) => void;
  /**
   * Fires on 'whatsapp:deliveryLog' -- emitted by deliveryLogs.service.js's
   * processWebhook() (Meta delivery/read/failed status updates) and also
   * updateStatus()/retry() (manual actions), so any open Delivery Logs tab
   * for the tenant reflects changes made from elsewhere too.
   */
  onDeliveryLog?: (payload: { deliveryLogId: string; deliveryLog: DeliveryLog }) => void;
}

/**
 * useWhatsAppRealtime -- subscribes to the 'whatsapp:message',
 * 'whatsapp:conversation', 'whatsapp:template', and 'whatsapp:deliveryLog'
 * events emitted by message.service.js / conversation.service.js /
 * tag.service.js / templateApproval.service.js / deliveryLogs.service.js
 * (see src/realtime/socket.js). The socket itself is a tenant-scoped
 * singleton connected once at login (authStore.ts) -- this hook only
 * attaches/detaches listeners, it doesn't manage the connection itself.
 */
export function useWhatsAppRealtime({ onMessage, onConversation, onTemplate, onDeliveryLog }: UseWhatsAppRealtimeOptions): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (payload: { conversationId: string; message: Message }) => onMessage?.(payload);
    const handleConversation = (payload: { conversation: Conversation }) => onConversation?.(payload);
    const handleTemplate = (payload: { templateId: string; template: WhatsAppTemplate }) => onTemplate?.(payload);
    const handleDeliveryLog = (payload: { deliveryLogId: string; deliveryLog: DeliveryLog }) => onDeliveryLog?.(payload);

    if (onMessage) socket.on('whatsapp:message', handleMessage);
    if (onConversation) socket.on('whatsapp:conversation', handleConversation);
    if (onTemplate) socket.on('whatsapp:template', handleTemplate);
    if (onDeliveryLog) socket.on('whatsapp:deliveryLog', handleDeliveryLog);

    return () => {
      socket.off('whatsapp:message', handleMessage);
      socket.off('whatsapp:conversation', handleConversation);
      socket.off('whatsapp:template', handleTemplate);
      socket.off('whatsapp:deliveryLog', handleDeliveryLog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMessage, onConversation, onTemplate, onDeliveryLog]);
}