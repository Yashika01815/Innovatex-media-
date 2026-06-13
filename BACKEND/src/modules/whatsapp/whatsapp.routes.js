import { Router } from 'express';
import { withContext } from '../../shared/helpers/lead.helpers.js';

import inboxRoutes from './inbox/inbox.routes.js';
import conversationRoutes from './conversations/conversation.routes.js';
import messageRoutes from './messages/message.routes.js';

const whatsappRouter = Router();

whatsappRouter.use(withContext);

whatsappRouter.use('/inbox', inboxRoutes);
whatsappRouter.use('/conversations', conversationRoutes);
whatsappRouter.use('/messages', messageRoutes);

export default whatsappRouter;