require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const donorRoutes = require("./routes/donors");
const requestRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");

const {
    authenticate
} = require("./middleware/auth");


const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);



app.get("/", (req, res) => {

    res.send(
        "Blood Donation System Backend is running"
    );

});



app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        message:
            "Blood Donation System backend is running"

    });

});



app.get(
    "/api/protected",
    authenticate,
    (req, res) => {

        res.json({

            success: true,

            message:
                "You have access to the protected route",

            user: req.user

        });

    }
);



const PORT = process.env.PORT || 5000;



mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );


        app.listen(PORT, () => {

            console.log(
                `Server running at http://localhost:${PORT}`
            );

        });


    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);

    });
