const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


function createToken(user) {

    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || "development_secret",
        {
            expiresIn: "7d"
        }
    );

}



// REGISTER

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;


        if (!name || !email || !phone || !password) {

            return res.status(400).json({
                success:false,
                message:"Name, email, phone and password are required"
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success:false,
                message:"Password must be at least 6 characters"
            });

        }


        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {

            return res.status(409).json({
                success:false,
                message:"An account with this email already exists"
            });

        }


        const passwordHash =
            await bcrypt.hash(password, 12);



        const user = await User.create({

            name:name.trim(),

            email:email.toLowerCase().trim(),

            phone:phone.trim(),

            // User cannot choose Admin role
            role:"Donor",

            passwordHash,

            status:"Pending"

        });



        const token = createToken(user);


        res.status(201).json({

            success:true,

            message:"Account created. Waiting for admin approval.",

            token,

            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                role:user.role,
                status:user.status
            }

        });



    } catch(error) {

        console.error(
            "Registration error:",
            error
        );


        res.status(500).json({
            success:false,
            message:"Server error during registration"
        });

    }

});




// LOGIN

router.post("/login", async (req,res)=>{

    try{

        const {
            email,
            password
        } = req.body;


        if(!email || !password){

            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            });

        }



        const user = await User.findOne({
            email:email.toLowerCase().trim()
        });



        if(!user){

            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            });

        }



        const passwordMatch =
            await bcrypt.compare(
                password,
                user.passwordHash
            );



        if(!passwordMatch){

            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            });

        }



        if(user.status === "Rejected"){

            return res.status(403).json({
                success:false,
                message:"This account has been rejected"
            });

        }



        if(user.status === "Pending"){

            return res.status(403).json({
                success:false,
                message:"Account waiting for admin approval"
            });

        }



        const token = createToken(user);



        res.json({

            success:true,

            message:"Login successful",

            token,

            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                role:user.role,
                status:user.status
            }

        });



    }catch(error){

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({
            success:false,
            message:"Server error during login"
        });

    }

});



module.exports = router;
