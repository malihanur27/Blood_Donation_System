require("dotenv").config();

["MONGO_URI", "JWT_SECRET"].forEach((key) => {
    if (!process.env[key]) {
        console.error(
            `Missing required environment variable: ${key}. Create backend/.env from .env.example before starting the server.`
        );
        process.exit(1);
    }
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const donorRoutes = require("./routes/donors");
const requestRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");
const { authenticate } = require("./middleware/auth");
const { refreshAllDonorAvailability } = require("./utils/donorAvailability");

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5500")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        credentials: true,
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        }
    })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);

const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Blood Donation System backend is running"
    });
});

app.get("/api/protected", authenticate, (req, res) => {
    res.json({
        success: true,
        message: "You have access to the protected route",
        user: req.user
    });
});

app.use((err, req, res, next) => {
    if (err && err.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "This website origin is not allowed to access the API"
        });
    }
    return next(err);
});

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected successfully");

        try {
            await refreshAllDonorAvailability();
        } catch (error) {
            console.error("Initial donor availability refresh failed:", error.message);
        }

        const availabilityRefreshTimer = setInterval(() => {
            refreshAllDonorAvailability().catch((error) => {
                console.error("Scheduled donor availability refresh failed:", error.message);
            });
        }, 60 * 60 * 1000);

        availabilityRefreshTimer.unref();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Allowed frontend origin(s): ${allowedOrigins.join(", ")}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
