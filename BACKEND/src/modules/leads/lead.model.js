import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    whatsappNumber: {
      type: String,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      default: "Direct",
    },

    medium: String,

    campaign: String,

    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmContent: String,
    utmTerm: String,

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Booked",
        "Call Completed",
        "Proposal Sent",
        "Negotiation",
        "Won",
        "Lost",
        "Nurture",
        "Ghosted"
      ],
      default: "New",
    },

    qualificationScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    leadTemperature: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Cold",
    },

    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    segment: String,

    notes: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    consentStatus: {
      type: String,
      enum: ["granted", "pending", "revoked"],
      default: "pending",
    },

    optOutStatus: {
      type: Boolean,
      default: false,
    },

    value: {
      type: Number,
      default: 0,
    },

    lastContactedAt: Date,

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;