1) WORKING ON LEAD

Create Lead ✅
Get All Leads ✅
Get Lead By Id ✅
Update Lead
Archive Lead
Validation
Duplicate Detection







## B3. Leads
- Fields: name, email, phone, whatsapp_number, company, source, medium, campaign, utm_source/medium/
  campaign/content/term, status, qualification_score, lead_temperature, assigned_user_id, segment,
  notes, consent_status, opt_out_status, value, created_at, last_contacted_at.

- List + search + filters (status, temperature, source); add/edit modal; archive; CSV export.

- **Duplicate detection** by email/phone.

- **Lead detail drawer:** profile, score, temperature, source/UTM, owner, **recommended next
  action (AI)**, 

  * quick actions (WhatsApp/Qualify/Book/Payment),

  * linked counts (deals/bookings/calls/payments),

  * WhatsApp message preview, notes (add), **full activity timeline**.

- **Public capture form** with UTM capture from URL + `Lead Created` tracking event.

- **Statuses:** New, Contacted, Qualified, Booked, Call Completed, Proposal Sent, Won, Lost, Nurture, Ghosted.


✅ Health Check
✅ Get Constants
✅ Create Lead
✅ Get All Leads
✅ Get Lead By ID

✅ Create Lead Validation
✅ Update Lead Validation
✅ Email Validation
✅ Status Validation
✅ Temperature Validation
✅ Qualification Score Validation
✅ Unknown Field Validation

✅ Lead Details API

✅ POST /api/leads/:id/notes

✅ GET /api/leads/:id/notes

✅ Lead Created
✅ Lead Updated
✅ Lead Archived
✅ Note Added