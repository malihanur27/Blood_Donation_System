const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const donorRoutes = require("./routes/donors");
const {
    authenticate,
    requireAdmin
} = require("./middleware/auth");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);

app.get("/", (req, res) => {

    res.send(
        "Blood Donation System Backend is running"
    );

});
app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Blood Donation System backend is running"
    });

});
app.get(
    "/api/protected",
    authenticate,
    (req, res) => {
        res.json({
            success: true,
            message: "You have access to the protected route",
            user: req.user
        });

    }
);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});