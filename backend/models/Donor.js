const mongoose = require("mongoose");
const donorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        bloodGroup: {
            type: String,
            required: true,
            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-"
            ]
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        lastDonationDate: {
            type: Date,
            default: null
        },
        // What the donor selected in the profile form. This is kept separate
        // from the effective `available` flag so the donor can automatically
        // become available after the 90-day waiting period.
        availabilityRequested: {
            type: Boolean,
            default: null
        },
        available: {
            type: Boolean,
            default: true
        },
        verified: {
            type: Boolean,
            default: false
        }
    },

    {
        timestamps: true
    }
);

// FIX: compound index matching the /api/donors search filter
// (available + bloodGroup + city).
donorSchema.index({ available: 1, bloodGroup: 1, city: 1 });

module.exports = mongoose.model("Donor", donorSchema);