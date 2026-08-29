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

donorSchema.index({ available: 1, bloodGroup: 1, city: 1 });

module.exports = mongoose.model("Donor", donorSchema);