const mongoose = require("mongoose");

const donationMatchSchema = new mongoose.Schema(
    {
        bloodRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BloodRequest",
            required: true,
            index: true
        },
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donor",
            required: true,
            index: true
        },
        matchedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        units: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        status: {
            type: String,
            enum: ["Matched", "Donated", "Cancelled"],
            default: "Matched"
        },
        donatedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

donationMatchSchema.index(
    { bloodRequest: 1, donor: 1 },
    { unique: true }
);

donationMatchSchema.index({ donor: 1, status: 1, donatedAt: -1 });

module.exports = mongoose.model("DonationMatch", donationMatchSchema);
