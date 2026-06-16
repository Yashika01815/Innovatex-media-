/**
 * Standard JSON response helpers.
 *
 * The Contacts module imports these as the project's existing response
 * helpers. If your repo already defines sendSuccess / sendCreated /
 * sendPaginated elsewhere, keep yours and delete this file (just make sure
 * the import path in contacts.controller.js points at the right place).
 */

export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendCreated(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

export function sendPaginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({ success: true, message, data, pagination });
}
