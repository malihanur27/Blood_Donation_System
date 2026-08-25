const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const {
    authenticate
} = require("../middleware/auth");
const router = express.Router();

router.post("/", authenticate, async (req, res) => {

    try {
        const {
            patientName,
            bloodGroup,
            unitsRequired,
            hospitalName,
            hospitalAddress,
            city,
            requiredDate,
            urgency,
            reason
        } = req.body;

        if (
            !patientName ||
            !bloodGroup ||
            !unitsRequired ||
            !hospitalName ||
            !hospitalAddress ||
            !city ||
            !requiredDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All required blood request information must be provided"
            });

        }

        if (
            !Number.isInteger(Number(unitsRequired)) ||
            Number(unitsRequired) < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Units required must be at least 1"
            });
        }
        const user = await User.findById(
            req.user.id
        );
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const bloodRequest =
            await BloodRequest.create({
                requester: req.user.id,
                patientName:
                    patientName.trim(),
                bloodGroup,
                unitsRequired:
                    Number(unitsRequired),
                hospitalName:
                    hospitalName.trim(),
                hospitalAddress:
                    hospitalAddress.trim(),
                city:
                    city.trim(),
                requiredDate,
                urgency:
                    urgency || "Normal",
                reason:
                    reason ? reason.trim() : ""
            });
        res.status(201).json({
            success: true,
            message: "Blood request created successfully",
            request: bloodRequest
        });

    } catch (error) {

        console.error(
            "Create blood request error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while creating blood request"
        });
    }
});

router.get("/", async (req, res) => {
    try {

        const {
            bloodGroup,
            city,
            urgency,
            status
        } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        } else {
            filter.status = "Pending";

        }
        if (bloodGroup) {
            filter.bloodGroup =
                bloodGroup;

        }

        if (city) {
            filter.city = {
                $regex: city,
                $options: "i"
            };

        }
        if (urgency) {

            filter.urgency =
                urgency;

        }
        const requests =
            await BloodRequest
                .find(filter)
                .populate(
                    "requester",
                    "name email phone role"
                )
                .sort({
                    urgency: -1,
                    createdAt: -1
                });
        res.json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error(
            "Get blood requests error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while retrieving blood requests"
        });
    }
});

router.get(
    "/me",
    authenticate,
    async (req, res) => {
        try {
            const requests =
                await BloodRequest
                    .find({
                        requester: req.user.id
                    })
                    .sort({
                        createdAt: -1
                    });
            res.json({
                success: true,
                count: requests.length,
                requests
            });
        } catch (error) {
            console.error(
                "Get my requests error:",
                error
            );
            res.status(500).json({
                success: false,
                message: "Server error while retrieving your requests"
            });
        }
    }
);

router.put(
    "/:id",
    authenticate,
    async (req, res) => {
        try {
            const request =
                await BloodRequest.findById(
                    req.params.id
                );
            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Blood request not found"
                });
            }
            if (
                request.requester.toString() !==
                req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own requests"
                });
            }
            if (
                request.status === "Cancelled"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Cancelled requests cannot be updated"
                });
            }
            const allowedFields = [
                "patientName",
                "bloodGroup",
                "unitsRequired",
                "hospitalName",
                "hospitalAddress",
                "city",
                "requiredDate",
                "urgency",
                "reason"
            ];
            allowedFields.forEach(
                (field) => {
                    if (
                        req.body[field] !==
                        undefined
                    ) {
                        request[field] =
                            req.body[field];
                    }
                }
            );
            await request.save();
            res.json({
                success: true,
                message: "Blood request updated successfully",
                request
            });
        } catch (error) {
            console.error(
                "Update blood request error:",
                error
            );
            res.status(500).json({
                success: false,
                message: "Server error while updating blood request"
            });
        }
    }
);

router.delete(
    "/:id",
    authenticate,
    async (req, res) => {
        try {
            const request =
                await BloodRequest.findById(
                    req.params.id
                );
            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Blood request not found"
                });
            }
            if (
                request.requester.toString() !==
                req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You can only cancel your own requests"
                });

            }
            request.status =
                "Cancelled";
            await request.save();
            res.json({
                success: true,
                message: "Blood request cancelled successfully"
            });
        } catch (error) {
            console.error(
                "Cancel blood request error:",
                error
            );
            res.status(500).json({
                success: false,
                message: "Server error while cancelling blood request"
            });
        }
    }
);
module.exports = router;