import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types/whatsapp';

interface UseWhatsAppRealtimeOptions {
  onMessage?: (payload: { conversationId: string; message: Message }) => void;
  onConversation?: (payload: { conversation: Conversation }) => void;
}

/**
 * useWhatsAppRealtime -- subscribes to the 'whatsapp:message' and
 * 'whatsapp:conversation' events emitted by message.service.js /
 * conversation.service.js / tag.service.js (see src/realtime/socket.js).
 * The socket itself is a tenant-scoped singleton connected once at login
 * (authStore.ts) -- this hook only attaches/detaches listeners, it doesn't
 * manage the connection itself.
 */
export function useWhatsAppRealtime({ onMessage, onConversation }: UseWhatsAppRealtimeOptions): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (payload: { conversationId: string; message: Message }) => onMessage?.(payload);
    const handleConversation = (payload: { conversation: Conversation }) => onConversation?.(payload);

    if (onMessage) socket.on('whatsapp:message', handleMessage);
    if (onConversation) socket.on('whatsapp:conversation', handleConversation);

    return () => {
      socket.off('whatsapp:message', handleMessage);
      socket.off('whatsapp:conversation', handleConversation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMessage, onConversation]);
}