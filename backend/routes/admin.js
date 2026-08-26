const express = require("express");
const User = require("../models/User");
const Donor = require("../models/Donor");
const BloodRequest = require("../models/BloodRequest");
const {
    authenticate,
    requireAdmin
} = require("../middleware/auth");
const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

router.get("/stats", async (req, res) => {

    try {
        const [
            totalUsers,
            totalDonors,
            totalRequests,
            pendingRequests,
            fulfilledRequests
        ] = await Promise.all([
            User.countDocuments(),
            Donor.countDocuments(),
            BloodRequest.countDocuments(),
            BloodRequest.countDocuments({
                status: "Pending"
            }),
            BloodRequest.countDocuments({
                status: "Fulfilled"
            })
        ]);
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalDonors,
                totalRequests,
                pendingRequests,
                fulfilledRequests
            }
        });
    } catch (error) {
        console.error(
            "Admin stats error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while retrieving statistics"
        });
    }
});
router.get("/users", async (req, res) => {
    try {
        const users = await User
            .find()
            .select("-passwordHash")
            .sort({
                createdAt: -1
            });
        res.json({
            success: true,
            count: users.length,
            users

        });
    } catch (error) {
        console.error(
            "Get users error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while retrieving users"
        });
    }
});

router.put(
    "/users/:id/status",
    async (req, res) => {
        try {
            const {
                status
            } = req.body;
            const allowedStatuses = [
                "Pending",
                "Approved",
                "Rejected"
            ];
            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid user status"
                });
            }
            const user =
                await User.findById(
                    req.params.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            if (
                user._id.toString() ===
                req.user.id
            ) {
                return res.status(400).json({

                    success: false,
                    message:
                        "You cannot change your own account status"
                });
            }
            user.status = status;
            await user.save();
            res.json({
                success: true,
                message:
                    "User status updated successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(
                "Update user status error:",
                error
            );
            res.status(500).json({
                success: false,
                message:
                    "Server error while updating user status"
            });
        }
    }
);

router.get("/donors", async (req, res) => {
    try {
        const donors = await Donor
            .find()
            .populate(
                "user",
                "name email phone role status"
            )
            .sort({
                createdAt: -1
            });
        res.json({
            success: true,
            count: donors.length,
            donors
        });

    } catch (error) {

        console.error(
            "Get donors error:",
            error
        );
        res.status(500).json({
            success: false,
            message:
                "Server error while retrieving donors"
        });
    }
});


router.put(
    "/donors/:id/verify",
    async (req, res) => {
        try {
            const {
                verified
            } = req.body;
            const donor =
                await Donor.findById(
                    req.params.id
                );

            if (!donor) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Donor not found"
                });

            }
            donor.verified =
                verified === true;
            await donor.save();
            res.json({
                success: true,
                message:
                    donor.verified
                        ? "Donor verified successfully"
                        : "Donor verification removed",
                donor
            });
        } catch (error) {
            console.error(
                "Verify donor error:",
                error
            );
            res.status(500).json({
                success: false,
                message:
                    "Server error while verifying donor"
            });
        }
    }
);

router.get("/requests", async (req, res) => {

    try {
        const requests =
            await BloodRequest
                .find()
                .populate(
                    "requester",
                    "name email phone role"
                )
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
            "Admin requests error:",
            error
        );
        res.status(500).json({
            success: false,
            message:
                "Server error while retrieving requests"

        });
    }
});

router.put(
    "/requests/:id/status",
    async (req, res) => {
        try {
            const {
                status
            } = req.body;

            const allowedStatuses = [
                "Pending",
                "Fulfilled",
                "Cancelled"
            ];
            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid request status"
                });

            }

            const request =
                await BloodRequest.findById(
                    req.params.id
                );
            if (!request) {

                return res.status(404).json({

                    success: false,
                    message:
                        "Blood request not found"
                });
            }
            request.status = status;
            await request.save();

            res.json({
                success: true,
                message:
                    "Blood request status updated successfully",
                request
            });
        } catch (error) {
            console.error(
                "Update request status error:",
                error
            );
            res.status(500).json({
                success: false,
                message:
                    "Server error while updating request status"
            });
        }
    }
);
module.exports = router;