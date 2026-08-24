const express = require("express");
const Donor = require("../models/Donor");
const User = require("../models/User");
const {
    authenticate
} = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res) => {

    try {
        const {
            bloodGroup,
            dateOfBirth,
            gender,
            address,
            city,
            lastDonationDate
        } = req.body;
        if (
            !bloodGroup ||
            !dateOfBirth ||
            !gender ||
            !address ||
            !city
        ) {
            return res.status(400).json({
                success: false,
                message: "All required donor information must be provided"
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
        const existingDonor = await Donor.findOne({
            user: req.user.id
        });
        if (existingDonor) {
            return res.status(409).json({
                success: false,
                message: "Donor profile already exists"
            });
        }

        const donor = await Donor.create({
            user: req.user.id,
            bloodGroup,
            dateOfBirth,
            gender,
            address,
            city,
            lastDonationDate:
                lastDonationDate || null
        });

        res.status(201).json({
            success: true,
            message: "Donor profile created successfully",
            donor
        });

    } catch (error) {
        console.error(
            "Create donor error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while creating donor profile"
        });
    }
});

router.get("/me", authenticate, async (req, res) => {
    try {
        const donor = await Donor
            .findOne({
                user: req.user.id
            })
            .populate(
                "user",
                "name email phone role"
            );

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor profile not found"
            });
        }
        res.json({
            success: true,
            donor
        });

    } catch (error) {
        console.error(
            "Get donor profile error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while retrieving donor profile"
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
            available
        } = req.body;
        const donor = await Donor.findOne({
            user: req.user.id
        });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor profile not found"
            });

        }
        if (bloodGroup !== undefined) {
            donor.bloodGroup = bloodGroup;
        }
        if (dateOfBirth !== undefined) {
            donor.dateOfBirth = dateOfBirth;
        }
        if (gender !== undefined) {
            donor.gender = gender;
        }
        if (address !== undefined) {
            donor.address = address;
        }
        if (city !== undefined) {
            donor.city = city;
        }
        if (lastDonationDate !== undefined) {
            donor.lastDonationDate = lastDonationDate;
        }
        if (available !== undefined) {
            donor.available = available;
        }

        await donor.save();
        res.json({

            success: true,
            message: "Donor profile updated successfully",
            donor
        });


    } catch (error) {
        console.error(
            "Update donor error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while updating donor profile"
        });

    }

});
router.get("/", async (req, res) => {
    try {
        const {
            bloodGroup,
            city
        } = req.query;

        const filter = {
            available: true
        };
        if (bloodGroup) {

            filter.bloodGroup = bloodGroup;

        }

        if (city) {

            filter.city = {
                $regex: city,
                $options: "i"
            };

        }
        const donors = await Donor
            .find(filter)
            .populate(
                "user",
                "name phone email"
            )
            .select(
                "-__v"
            );
        res.json({
            success: true,
            count: donors.length,
            donors
        });

    } catch (error) {

        console.error(
            "Search donors error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error while searching donors"
        });

    }

});
module.exports = router;