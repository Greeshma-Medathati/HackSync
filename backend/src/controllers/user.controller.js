import User from "../model/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import PS from '../model/ps.model.js';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken'; // Importing jsonwebtoken for token creation
import bcrypt from 'bcryptjs'; // Importing bcrypt for password comparison

// Helper method to generate token with expiration time
const generateAccessToken = (user) => {
    // Set the token expiration time (e.g., 1 hour)
    return jwt.sign(
        { userId: user._id, role: user.role }, // Payload data
        process.env.JWT_SECRET, // Secret key from your environment variables
        { expiresIn: '1h' } // Token expiration time (1 hour)
    );
};

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('name email role password team');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Use bcrypt to compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new ApiError(400, "Invalid credentials");
    }

    // Now using the updated generateAccessToken function
    const token = generateAccessToken(user);

    return res
        .status(200)
        .json(new ApiResponse(200, 'Login successful', {
            user,
            token
        }));
});

const logout = asyncHandler(async (req, res) => {
    res
        .status(200)
        .clearCookie('token')
        .json(new ApiResponse(200, 'Logout successful'));
});

const viewPS = asyncHandler(async (req, res) => {
    const user = req.user;
    const ps = await PS.find({});

    return res
        .status(200)
        .json(new ApiResponse(200, 'All PS', ps));
});

const participantInfoQR = asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.role == 'participant' && user.checkIn == false) {
        try {
            var options = {
                errorCorrectionLevel: 'H',
                type: 'image/jpeg',
                quality: 0.3,
                margin: 1,
                color: {
                    dark: "#0C195F",
                    light: "#D2FDFE"
                },
                width: 300,
            };
            const qr = await qrcode.toDataURL(user._id.toString(), options);
            user.qr = qr;
            await user.save();
            return res.status(200).json(new ApiResponse(200, 'QR generated successfully', qr));
        } catch (error) {
            return res.status(500).json(new ApiResponse(500, error.message));
        }
    } else {
        return res.status(200).json(new ApiResponse(200, 'QR already generated', user.qr));
    }
});

const getInfo = asyncHandler(async (req, res) => {
    let user = req.user;
    user = {
        name: user.name,
        email: user.email,
        role: user.role,
        workplace: user.workplace,
        checkIn: user.checkIn,
        qr: user.qr
    }
    return res.status(200).json(new ApiResponse(200, 'User info', user));
});

const qrForFood = asyncHandler(async (req, res) => {
    const user = req.user;
    const food = req.body.food;
    console.log("Received food:", food);
    console.log("Type of food:", typeof food);
    const validFoods = ["breakfast", "lunch", "dinner", "snacks"];
    if (!validFoods.includes(food)) {
        return res.status(400).json(new ApiResponse(400, 'Invalid food type'));
    }
   
    try {
        var options = {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            quality: 0.3,
            margin: 1,
            color: {
                dark: "#0C195F",
                light: "#D2FDFE"
            },
            width: 300,
        };
        const dataToEncode = JSON.stringify({
            _id: user._id,
            food: food
        });
        const qr = await qrcode.toDataURL(dataToEncode, options);
        return res.status(200).json(new ApiResponse(200, 'QR generated successfully', qr));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, error.message));
    }
});

export { login, logout, viewPS, participantInfoQR, qrForFood, getInfo };
