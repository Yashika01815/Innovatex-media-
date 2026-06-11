const express =
  require("express");

const router =
  express.Router();

const leadRoutes =
  require(
    "../modules/leads/lead.routes"
  );

router.use(
  "/leads",
  leadRoutes
);

module.exports =
  router;