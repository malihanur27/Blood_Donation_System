const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_NAME = "lifedrop_token";

const authenticate = async (req, res, next) => {
    try {
        const token =
            req.cookies &&
            req.cookies[COOKIE_NAME];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(
            decoded.id
        ).select(
            "name email phone role status"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (user.status !== "Approved") {
            return res.status(403).json({
                success: false,
                message: "Account is not approved"
            });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            status: user.status
        };

        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired session"
        });
    }
};

const requireAdmin = (
    req,
    res,
    next
) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== "Admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

module.exports = {
    authenticate,
    requireAdmin
};