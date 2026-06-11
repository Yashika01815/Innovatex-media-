import leadService from "./lead.service.js";

class LeadController {
  async createLead(req, res) {
    try {
      console.log("🔥 Controller Hit");
      console.log("Body:", req.body);

      const lead = await leadService.createLead(req.body);

      console.log("✅ Lead Created:", lead);

      return res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLeads(req, res) {
    try {
      const leads = await leadService.getLeads();

      return res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new LeadController();