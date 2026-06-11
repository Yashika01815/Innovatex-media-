import express from "express";
import leadController from "./lead.controller.js";

const router = express.Router();

router.post(
  "/",
  leadController.createLead
);

router.get(
  "/",
  leadController.getLeads
);

export default router;