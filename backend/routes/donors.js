const express = require("express");
const Donor = require("../models/Donor");
const User = require("../models/User");
const DonationMatch = require("../models/DonationMatch");
const { authenticate } = require("../middleware/auth");
const {
    MIN_DAYS_SINCE_LAST_DONATION,
    daysSince,
    isDonationIntervalEligible,
    buildAvailabilityStatus,
    syncDonorAvailability,
    refreshAllDonorAvailability
} = require("../utils/donorAvailability");

const router = express.Router();
const MIN_DONOR_AGE_YEARS = 18;
const MAX_DONOR_AGE_YEARS = 65;

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function ageInYears(dateOfBirth) {
    const dob = parseDate(dateOfBirth);
    if (!dob) return null;

    const today = new Date();
    if (dob > today) return -1;

    let age = today.getUTCFullYear() - dob.getUTCFullYear();
    const monthDifference = today.getUTCMonth() - dob.getUTCMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getUTCDate() < dob.getUTCDate())
    ) {
        age -= 1;
    }

    return age;
}

function validateDateOfBirth(dateOfBirth) {
    const age = ageInYears(dateOfBirth);

    if (age === null) {
        return "Please provide a valid date of birth";
    }

    if (age < 0) {
        return "Date of birth cannot be in the future";
    }

    if (age < MIN_DONOR_AGE_YEARS || age > MAX_DONOR_AGE_YEARS) {
        return `Donor age must be between ${MIN_DONOR_AGE_YEARS} and ${MAX_DONOR_AGE_YEARS} years`;
    }

    return null;
}

function validateLastDonationDate(lastDonationDate) {
    if (!lastDonationDate) return null;

    const days = daysSince(lastDonationDate);
    if (days === null) {
        return "Please provide a valid last donation date";
    }

    if (days < 0) {
        return "Last donation date cannot be in the future";
    }

    return null;
}

router.post("/", authenticate, async (req, res) => {
    try {
        const {
            bloodGroup,
            dateOfBirth,
            gender,
            address,
            city,
            lastDonationDate,
            available,
            availabilityRequested
        } = req.body;

        if (!bloodGroup || !dateOfBirth || !gender || !address || !city) {
            return res.status(400).json({
                success: false,
                message: "All required donor information must be provided"
            });
        }

        const dobError = validateDateOfBirth(dateOfBirth);
        if (dobError) {
            return res.status(400).json({ success: false, message: dobError });
        }

        const donationDateError = validateLastDonationDate(lastDonationDate);
        if (donationDateError) {
            return res.status(400).json({
                success: false,
                message: donationDateError
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "Donor") {
            return res.status(403).json({
                success: false,
                message: "Only donor accounts can create donor profiles"
            });
        }

        const existingDonor = await Donor.findOne({ user: req.user.id });
        if (existingDonor) {
            return res.status(409).json({
                success: false,
                message: "Donor profile already exists"
            });
        }

        const eligibleByInterval = isDonationIntervalEligible(lastDonationDate);
        const requestedAvailability = availabilityRequested !== undefined
            ? Boolean(availabilityRequested)
            : available !== false;

        const donor = await Donor.create({
            user: req.user.id,
            bloodGroup,
            dateOfBirth,
            gender,
            address: address.trim(),
            city: city.trim(),
            lastDonationDate: lastDonationDate || null,
            availabilityRequested: requestedAvailability,
            available: requestedAvailability && eligibleByInterval
        });

        const availabilityStatus = buildAvailabilityStatus(donor, false);

        return res.status(201).json({
            success: true,
            message: requestedAvailability && !eligibleByInterval
                ? `Donor profile saved successfully. You are unavailable until ${MIN_DAYS_SINCE_LAST_DONATION} days have passed since your last donation.`
                : "Donor profile created successfully",
            donor,
            availabilityStatus
        });
    } catch (error) {
        console.error("Create donor error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating donor profile"
        });
    }
});

router.get("/me", authenticate, async (req, res) => {
    try {
        const donor = await Donor.findOne({ user: req.user.id }).populate(
            "user",
            "name email phone role"
        );

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor profile not found"
            });
        }

        const availabilityStatus = await syncDonorAvailability(donor, {
            userStatus: req.user.status
        });

        return res.json({ success: true, donor, availabilityStatus });
    } catch (error) {
        console.error("Get donor profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving donor profile"
        });
    }
});


router.get("/me/history", authenticate, async (req, res) => {
    try {
        const donor = await Donor.findOne({ user: req.user.id });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor profile not found"
            });
        }

        const donations = await DonationMatch.find({
            donor: donor._id,
            status: "Donated"
        })
            .populate(
                "bloodRequest",
                "patientName hospitalName city bloodGroup unitsRequired requiredDate"
            )
            .sort({ donatedAt: -1, updatedAt: -1 });

        return res.json({
            success: true,
            count: donations.length,
            donations
        });
    } catch (error) {
        console.error("Donation history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving donation history"
        });
    }
});

router.put("/me", authenticate, async (req, res) => {
    try {
        const {
            bloodGroup,
            dateOfBirth,
            gender,
            address,
            city,
            lastDonationDate,
            available,
            availabilityRequested
        } = req.body;

        const donor = await Donor.findOne({ user: req.user.id });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor profile not found"
            });
        }

        const effectiveDob =
            dateOfBirth !== undefined ? dateOfBirth : donor.dateOfBirth;
        const dobError = validateDateOfBirth(effectiveDob);
        if (dobError) {
            return res.status(400).json({ success: false, message: dobError });
        }

        const effectiveLastDonation =
            lastDonationDate !== undefined
                ? lastDonationDate || null
                : donor.lastDonationDate;
        const donationDateError = validateLastDonationDate(effectiveLastDonation);
        if (donationDateError) {
            return res.status(400).json({
                success: false,
                message: donationDateError
            });
        }

        const eligibleByInterval = isDonationIntervalEligible(
            effectiveLastDonation
        );

        const requestedAvailability = availabilityRequested !== undefined
            ? Boolean(availabilityRequested)
            : available !== undefined
                ? Boolean(available)
                : typeof donor.availabilityRequested === "boolean"
                    ? donor.availabilityRequested
                    : donor.available !== false;

        if (bloodGroup !== undefined) donor.bloodGroup = bloodGroup;
        if (dateOfBirth !== undefined) donor.dateOfBirth = dateOfBirth;
        if (gender !== undefined) donor.gender = gender;
        if (address !== undefined) donor.address = address.trim();
        if (city !== undefined) donor.city = city.trim();
        if (lastDonationDate !== undefined) {
            donor.lastDonationDate = lastDonationDate || null;
        }

        donor.availabilityRequested = requestedAvailability;

        const availabilityStatus = await syncDonorAvailability(donor, {
            userStatus: req.user.status
        });

        let message = "Donor profile updated successfully";

        if (requestedAvailability && !availabilityStatus.eligibleByInterval) {
            message = `Donor profile saved successfully. You are currently unavailable because ${MIN_DAYS_SINCE_LAST_DONATION} days have not passed since your last donation.`;
        } else if (requestedAvailability && availabilityStatus.activelyMatched) {
            message = "Donor profile saved successfully. You remain unavailable while matched to an active blood request.";
        }

        return res.json({
            success: true,
            message,
            donor,
            availabilityStatus
        });
    } catch (error) {
        console.error("Update donor error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating donor profile"
        });
    }
});

// Donor search now requires an Approved account. The response is intentionally
// limited: no DOB, street address, or donation history is exposed to searchers.
router.get("/", authenticate, async (req, res) => {
    try {
        // Recompute effective availability before search. This makes a donor
        // automatically become available on/after day 90 without editing the profile.
        await refreshAllDonorAvailability();

        const { bloodGroup, city } = req.query;
        const filter = { available: true };

        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (city) {
            filter.city = { $regex: city, $options: "i" };
        }

        let donors = await Donor.find(filter)
            .select("user bloodGroup city available verified")
            .populate({
                path: "user",
                match: { status: "Approved" },
                select: "name phone"
            });

        donors = donors.filter((donor) => donor.user);

        return res.json({
            success: true,
            count: donors.length,
            donors
        });
    } catch (error) {
        console.error("Search donors error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while searching donors"
        });
    }
});

module.exports = router;
