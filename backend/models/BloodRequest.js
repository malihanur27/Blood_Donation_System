const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        patientName: {
            type: String,
            required: true,
            trim: true
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
        unitsRequired: {
            type: Number,
            required: true,
            min: 1
        },
        hospitalName: {
            type: String,
            required: true,
            trim: true
        },
        hospitalAddress: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        requiredDate: {
            type: Date,
            required: true
        },
        urgency: {
            type: String,
            enum: [
                "Normal",
                "Urgent",
                "Critical"
            ],
            default: "Normal"
        },
        reason: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: [
                "Pending",
                "Fulfilled",
                "Cancelled"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model(
    "BloodRequest",
    bloodRequestSchema
);