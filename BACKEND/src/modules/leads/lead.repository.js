import Lead from "./lead.model.js";

class LeadRepository {
  async create(data) {
    console.log("🔥 Repository Hit");

    const lead = await Lead.create(data);

    console.log("✅ Repository Saved Lead");

    return lead;
  }

  async findById(id) {
    return Lead.findById(id);
  }

  async findAll() {
    return Lead.find();
  }
}

export default new LeadRepository();