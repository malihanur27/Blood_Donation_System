const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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

const PORT = 5000;
app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});