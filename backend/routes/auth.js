const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const COOKIE_NAME = "lifedrop_token";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again later."
    }
});

function createToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

function cookieOptions() {
    const production =
        process.env.NODE_ENV === "production" ||
        Boolean(process.env.RENDER_EXTERNAL_URL);

    return {
        httpOnly: true,
        secure: production,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

router.post(
    "/register",
    registerLimiter,
    async (req, res) => {
        try {
            const {
                name,
                email,
                phone,
                password
            } = req.body;

            if (!name || !email || !phone || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, phone and password are required"
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            const normalizedEmail =
                email.toLowerCase().trim();

            const existingUser =
                await User.findOne({
                    email: normalizedEmail
                });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }

            const passwordHash =
                await bcrypt.hash(password, 12);

            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                role: "Donor",
                passwordHash,
                status: "Pending"
            });

            return res.status(201).json({
                success: true,
                message: "Account created. Waiting for admin approval.",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Server error during registration"
            });
        }
    }
);

router.post(
    "/login",
    loginLimiter,
    async (req, res) => {
        try {
            const {
                email,
                password
            } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required"
                });
            }

            const user =
                await User.findOne({
                    email:
                        email.toLowerCase().trim()
                });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.passwordHash
                );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            if (user.status === "Rejected") {
                return res.status(403).json({
                    success: false,
                    message: "This account has been rejected"
                });
            }

            if (user.status === "Pending") {
                return res.status(403).json({
                    success: false,
                    message: "Account waiting for admin approval"
                });
            }

            const token =
                createToken(user);

            res.cookie(
                COOKIE_NAME,
                token,
                cookieOptions()
            );

            return res.json({
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Server error during login"
            });
        }
    }
);

router.post(
    "/logout",
    (req, res) => {
        const options =
            cookieOptions();

        delete options.maxAge;

        res.clearCookie(
            COOKIE_NAME,
            options
        );

        return res.json({
            success: true,
            message: "Logged out successfully"
        });
    }
);

router.put(
    "/me",
    authenticate,
    async (req, res) => {
        try {
            const {
                name,
                phone
            } = req.body;

            if (
                !name ||
                name.trim().length < 3
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid name"
                });
            }

            if (
                !phone ||
                !/^[0-9+\-\s]{7,15}$/.test(
                    phone.trim()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid phone number"
                });
            }

            const user =
                await User.findById(
                    req.user.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            user.name =
                name.trim();

            user.phone =
                phone.trim();

            await user.save();

            return res.json({
                success: true,
                message: "Profile updated successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(
                "Update profile error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Server error while updating profile"
            });
        }
    }
);

router.put(
    "/change-password",
    authenticate,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword
            } = req.body;

            if (
                !currentPassword ||
                !newPassword
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Current and new passwords are required"
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters"
                });
            }

            const user =
                await User.findById(
                    req.user.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const match =
                await bcrypt.compare(
                    currentPassword,
                    user.passwordHash
                );

            if (!match) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect"
                });
            }

            user.passwordHash =
                await bcrypt.hash(
                    newPassword,
                    12
                );

            await user.save();

            return res.json({
                success: true,
                message: "Password changed successfully"
            });

        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Server error while changing password"
            });
        }
    }
);

module.exports = router;