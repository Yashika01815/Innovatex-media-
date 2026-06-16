import { Router } from 'express';
import { withContext } from '../../shared/helpers/lead.helpers.js';

import inboxRoutes from './submodules/inbox/inbox.routes.js';
import conversationRoutes from './conversations/conversation.routes.js';
import messageRoutes from './messages/message.routes.js';
import contactsRoutes from './submodules/contacts/contacts.routes.js';

const whatsappRouter = Router();

whatsappRouter.use(withContext);

whatsappRouter.use('/inbox', inboxRoutes);
whatsappRouter.use('/conversations', conversationRoutes);
whatsappRouter.use('/messages', messageRoutes);
whatsappRouter.use('/contacts', contactsRoutes);

export default whatsappRouter;