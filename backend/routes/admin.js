const express = require("express");
const User = require("../models/User");
const Donor = require("../models/Donor");
const BloodRequest = require("../models/BloodRequest");
const DonationMatch = require("../models/DonationMatch");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
    syncDonorAvailability,
    refreshAllDonorAvailability
} = require("../utils/donorAvailability");

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

async function getMatchesForRequests(requestIds) {
    if (!requestIds.length) return new Map();

    const matches = await DonationMatch.find({
        bloodRequest: { $in: requestIds },
        status: { $ne: "Cancelled" }
    })
        .populate({
            path: "donor",
            select: "user bloodGroup city available lastDonationDate",
            populate: {
                path: "user",
                select: "name email phone status"
            }
        })
        .populate("matchedBy", "name email")
        .sort({ createdAt: 1 });

    const grouped = new Map();
    for (const match of matches) {
        const key = match.bloodRequest.toString();
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(match);
    }
    return grouped;
}

async function recomputeRequestStatus(requestId) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.status === "Cancelled") return request;

    const matches = await DonationMatch.find({
        bloodRequest: requestId,
        status: { $in: ["Matched", "Donated"] }
    });

    const donatedUnits = matches
        .filter((match) => match.status === "Donated")
        .reduce((sum, match) => sum + match.units, 0);

    if (donatedUnits >= request.unitsRequired) {
        request.status = "Fulfilled";
        request.fulfilledAt = request.fulfilledAt || new Date();
    } else if (matches.length > 0) {
        request.status = "Matched";
        request.fulfilledAt = null;
    } else {
        request.status = "Pending";
        request.fulfilledAt = null;
    }

    await request.save();
    return request;
}

router.get("/stats", async (req, res) => {
    try {
        await refreshAllDonorAvailability();

        const approvedDonorUserIds = await User.find({
            role: "Donor",
            status: "Approved"
        }).distinct("_id");

        const [
            totalUsers,
            totalDonors,
            availableDonors,
            pendingRequests,
            matchedRequests,
            fulfilledRequests,
            emergencyRequests
        ] = await Promise.all([
            User.countDocuments(),
            Donor.countDocuments(),
            Donor.countDocuments({
                available: true,
                user: { $in: approvedDonorUserIds }
            }),
            BloodRequest.countDocuments({ status: "Pending" }),
            BloodRequest.countDocuments({ status: "Matched" }),
            BloodRequest.countDocuments({ status: "Fulfilled" }),
            BloodRequest.countDocuments({
                status: { $in: ["Pending", "Matched"] },
                urgency: "Critical"
            })
        ]);

        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalDonors,
                availableDonors,
                pendingRequests,
                matchedRequests,
                fulfilledRequests,
                emergencyRequests
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving statistics"
        });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await User.find()
            .select("-passwordHash")
            .sort({ createdAt: -1 });

        return res.json({ success: true, count: users.length, users });
    } catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving users"
        });
    }
});

router.put("/users/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["Pending", "Approved", "Rejected"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid user status" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own account status"
            });
        }

        user.status = status;
        await user.save();

        const donor = await Donor.findOne({ user: user._id });
        if (donor) {
            await syncDonorAvailability(donor, { userStatus: user.status });
        }

        return res.json({
            success: true,
            message: "User status updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Update user status error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating user status"
        });
    }
});

router.delete("/users/:id", async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own admin account"
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const donorDocs = await Donor.find({ user: user._id }).select("_id");
        const requestDocs = await BloodRequest.find({ requester: user._id }).select("_id");
        const donorIds = donorDocs.map((doc) => doc._id);
        const requestIds = requestDocs.map((doc) => doc._id);

        await Promise.all([
            DonationMatch.deleteMany({
                $or: [
                    { donor: { $in: donorIds } },
                    { bloodRequest: { $in: requestIds } }
                ]
            }),
            Donor.deleteMany({ user: user._id }),
            BloodRequest.deleteMany({ requester: user._id })
        ]);
        await user.deleteOne();

        return res.json({
            success: true,
            message: "User and related records deleted successfully"
        });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ success: false, message: "Server error while deleting user" });
    }
});

router.get("/donors", async (req, res) => {
    try {
        await refreshAllDonorAvailability();

        const donors = await Donor.find()
            .populate("user", "name email phone role status")
            .sort({ available: -1, createdAt: -1 });

        const activeMatches = await DonationMatch.find({ status: "Matched" }).select("donor");
        const busyDonorIds = new Set(activeMatches.map((match) => match.donor.toString()));

        const donorData = donors.map((donor) => ({
            ...donor.toObject(),
            activelyMatched: busyDonorIds.has(donor._id.toString())
        }));

        return res.json({ success: true, count: donorData.length, donors: donorData });
    } catch (error) {
        console.error("Get donors error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving donors"
        });
    }
});

router.put("/donors/:id/verify", async (req, res) => {
    try {
        const { verified } = req.body;
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            return res.status(404).json({ success: false, message: "Donor not found" });
        }

        donor.verified = verified === true;
        await donor.save();

        return res.json({
            success: true,
            message: donor.verified
                ? "Donor verified successfully"
                : "Donor verification removed",
            donor
        });
    } catch (error) {
        console.error("Verify donor error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while verifying donor"
        });
    }
});

router.get("/requests", async (req, res) => {
    try {
        const requests = await BloodRequest.find()
            .populate("requester", "name email phone role")
            .sort({ createdAt: -1 });

        const groupedMatches = await getMatchesForRequests(
            requests.map((request) => request._id)
        );

        const requestData = requests.map((request) => {
            const matches = groupedMatches.get(request._id.toString()) || [];
            const donatedUnits = matches
                .filter((match) => match.status === "Donated")
                .reduce((sum, match) => sum + match.units, 0);
            const assignedUnits = matches
                .reduce((sum, match) => sum + match.units, 0);

            return {
                ...request.toObject(),
                matches,
                donatedUnits,
                assignedUnits,
                remainingUnits: Math.max(0, request.unitsRequired - assignedUnits)
            };
        });

        return res.json({ success: true, count: requestData.length, requests: requestData });
    } catch (error) {
        console.error("Admin requests error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving requests"
        });
    }
});

// Match one available donor to one unit of a request. The class-project
// workflow uses exact blood-group matching to avoid ambiguous compatibility rules.
router.post("/requests/:id/match", async (req, res) => {
    try {
        const { donorId } = req.body;
        if (!donorId) {
            return res.status(400).json({ success: false, message: "Please select a donor" });
        }

        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Blood request not found" });
        }
        if (["Cancelled", "Fulfilled"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: `A ${request.status.toLowerCase()} request cannot be matched`
            });
        }

        const donor = await Donor.findById(donorId).populate("user", "name status phone");
        if (!donor || !donor.user) {
            return res.status(404).json({ success: false, message: "Donor not found" });
        }
        if (donor.user.status !== "Approved") {
            return res.status(400).json({ success: false, message: "Donor account is not approved" });
        }

        const availabilityStatus = await syncDonorAvailability(donor, {
            userStatus: donor.user.status
        });

        if (!availabilityStatus.available) {
            return res.status(400).json({ success: false, message: "This donor is not currently available" });
        }
        if (donor.bloodGroup !== request.bloodGroup) {
            return res.status(400).json({
                success: false,
                message: "For this project, the donor blood group must exactly match the requested group"
            });
        }

        const donorBusy = await DonationMatch.findOne({ donor: donor._id, status: "Matched" });
        if (donorBusy) {
            return res.status(409).json({
                success: false,
                message: "This donor is already matched to another active request"
            });
        }

        const activeMatches = await DonationMatch.find({
            bloodRequest: request._id,
            status: { $in: ["Matched", "Donated"] }
        });
        const assignedUnits = activeMatches.reduce((sum, match) => sum + match.units, 0);
        if (assignedUnits >= request.unitsRequired) {
            return res.status(400).json({
                success: false,
                message: "All requested units are already assigned"
            });
        }

        const existing = await DonationMatch.findOne({
            bloodRequest: request._id,
            donor: donor._id
        });

        let match;
        if (existing && existing.status === "Cancelled") {
            existing.status = "Matched";
            existing.matchedBy = req.user.id;
            existing.units = 1;
            existing.donatedAt = null;
            match = await existing.save();
        } else if (existing) {
            return res.status(409).json({
                success: false,
                message: "This donor has already been used for this request"
            });
        } else {
            match = await DonationMatch.create({
                bloodRequest: request._id,
                donor: donor._id,
                matchedBy: req.user.id,
                units: 1,
                status: "Matched"
            });
        }

        // Reserve the donor so they disappear from available-search lists until
        // the match is cancelled or the donation is completed.
        donor.available = false;
        await donor.save();

        request.status = "Matched";
        await request.save();

        await match.populate({
            path: "donor",
            populate: { path: "user", select: "name email phone" }
        });

        return res.status(201).json({
            success: true,
            message: `${donor.user.name} matched to the request`,
            match
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This donor is already linked to this request"
            });
        }
        console.error("Match donor error:", error);
        return res.status(500).json({ success: false, message: "Server error while matching donor" });
    }
});

router.put("/matches/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Donated", "Cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Match status must be Donated or Cancelled"
            });
        }

        const match = await DonationMatch.findById(req.params.id).populate({
            path: "donor",
            populate: { path: "user", select: "name status" }
        });
        if (!match) {
            return res.status(404).json({ success: false, message: "Donor match not found" });
        }
        if (match.status !== "Matched") {
            return res.status(400).json({
                success: false,
                message: `This match is already ${match.status.toLowerCase()}`
            });
        }

        const request = await BloodRequest.findById(match.bloodRequest);
        if (!request) {
            return res.status(404).json({ success: false, message: "Blood request not found" });
        }
        if (request.status === "Cancelled" && status === "Donated") {
            return res.status(400).json({
                success: false,
                message: "A cancelled request cannot record a new donation"
            });
        }

        const donor = match.donor;
        match.status = status;

        if (status === "Donated") {
            match.donatedAt = new Date();
            donor.lastDonationDate = match.donatedAt;
            donor.available = false;
            await Promise.all([match.save(), donor.save()]);
        } else {
            match.donatedAt = null;
            await match.save();
            await syncDonorAvailability(donor, {
                userStatus: donor.user ? donor.user.status : null,
                activelyMatched: false
            });
        }

        const updatedRequest = await recomputeRequestStatus(request._id);

        return res.json({
            success: true,
            message: status === "Donated"
                ? "Donation confirmed and request progress updated"
                : "Donor match cancelled",
            match,
            request: updatedRequest
        });
    } catch (error) {
        console.error("Update match status error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating donor match"
        });
    }
});

// Older project versions allowed an admin to click Fulfill without recording
// a donor. Those historical records cannot be reconstructed automatically.
// This endpoint lets the admin reopen only an untracked legacy fulfillment.
router.put("/requests/:id/reopen", async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Blood request not found" });
        }

        const donatedMatches = await DonationMatch.countDocuments({
            bloodRequest: request._id,
            status: "Donated"
        });

        if (request.status !== "Fulfilled" || donatedMatches > 0) {
            return res.status(400).json({
                success: false,
                message: "Only legacy fulfilled requests with no recorded donor can be reopened"
            });
        }

        request.status = "Pending";
        request.fulfilledAt = null;
        await request.save();

        return res.json({
            success: true,
            message: "Legacy request reopened. You can now match an available donor."
        });
    } catch (error) {
        console.error("Reopen request error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while reopening request"
        });
    }
});

// Admin may cancel a request, but Fulfilled is never set manually anymore.
// Fulfilled is computed only after enough matched donors are confirmed as donated.
router.put("/requests/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (status !== "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Requests can only be fulfilled by confirming matched donor donations"
            });
        }

        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Blood request not found" });
        }
        if (request.status === "Fulfilled") {
            return res.status(400).json({
                success: false,
                message: "A fulfilled request cannot be cancelled"
            });
        }

        const activeMatches = await DonationMatch.find({
            bloodRequest: request._id,
            status: "Matched"
        }).populate("donor");

        for (const match of activeMatches) {
            match.status = "Cancelled";
            await match.save();

            if (match.donor) {
                const donorUser = await User.findById(match.donor.user).select("status");
                await syncDonorAvailability(match.donor, {
                    userStatus: donorUser ? donorUser.status : null,
                    activelyMatched: false
                });
            }
        }

        request.status = "Cancelled";
        request.fulfilledAt = null;
        await request.save();

        return res.json({
            success: true,
            message: "Blood request cancelled successfully",
            request
        });
    } catch (error) {
        console.error("Update request status error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating request status"
        });
    }
});

module.exports = router;
