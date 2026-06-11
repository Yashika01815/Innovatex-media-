import leadRepository from "./lead.repository.js";

class LeadService {
  async createLead(data) {
    console.log("🔥 Service Hit");

    const lead = await leadRepository.create(data);

    console.log("✅ Service Created Lead");

    return lead;
  }

  async getLeads() {
    return leadRepository.findAll();
  }
}

export default new LeadService();