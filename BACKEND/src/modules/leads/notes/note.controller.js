import { asyncHandler, AppError } from '../../../shared/helpers/lead.helpers.js';
import { noteService } from './note.service.js';

export const noteController = {
  // GET /api/leads/:id/notes
  list: asyncHandler(async (req, res) => {
    const notes = await noteService.getNotes(req.context, req.params.id);
    res.json(notes);
  }),

  // POST /api/leads/:id/notes
  create: asyncHandler(async (req, res) => {
    const text = (req.body?.text || '').trim();
    if (!text) throw AppError.badRequest('Validation failed', [
      { field: 'text', message: 'text is required' },
    ]);
    const note = await noteService.addNote(req.context, req.params.id, text);
    res.status(201).json(note);
  }),
};
