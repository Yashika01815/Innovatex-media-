import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { noteService } from './note.service.js';

export const noteController = {
  // POST /api/whatsapp/conversations/:id/notes
  create: asyncHandler(async (req, res) => {
    const note = await noteService.addNote(req.context, req.params.id, req.body.body);
    res.status(201).json(note);
  }),

  // GET /api/whatsapp/conversations/:id/notes
  list: asyncHandler(async (req, res) => {
    const notes = await noteService.getNotes(req.context, req.params.id);
    res.json(notes);
  }),
};
