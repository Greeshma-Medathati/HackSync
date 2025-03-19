import mongoose from 'mongoose';
import User from '../backend/src/model/user.model.js'; // Adjust the path based on your file structure
import bcrypt from 'bcryptjs'; // To hash the password

// MongoDB connection string (replace with your own MongoDB URI)
const mongoURI = 'mongodb+srv://Hack:admin123@cluster0.grp2q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; 

// Function to connect to MongoDB
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB!');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};

// Function to insert a new admin user into the database
const createAdminUser = async () => {
    try {
        const adminData = {
            name: 'Admin User',
            email: 'admin3@example.com',
            password: 'pass123',  // Set a secure password here
            role: 'admin',
            team: null,  // No team for admin (set to null)
            workplace: 'Admin Workplace',
            checkIn: false,  // Default check-in status
        };

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        // Create a new admin user with the hashed password
        const newAdminUser = new User({
            ...adminData,
            password: hashedPassword,  // Store the hashed password in DB
            food: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },  // Default food options
            qr: null,  // No QR code for admin initially
        });

        // Save the new admin user to the database
        await newAdminUser.save();
        console.log('New admin user created:', newAdminUser);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close the MongoDB connection
        mongoose.connection.close();
    }
};

// Main function to run the script
const run = async () => {
    await connectToMongoDB();  // Connect to MongoDB
    await createAdminUser();  // Create the admin user
};

run();
