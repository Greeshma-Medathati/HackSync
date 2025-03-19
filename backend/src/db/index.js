import mongoose from 'mongoose';


const connectDB=async()=>{
    try {
        const response=await mongoose.connect("mongodb+srv://Hack:admin123@cluster0.grp2q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        console.log("Connected to DB ",response.connection.host)
    } catch (error) {
        console.log("Error connecting to DB",error.message)
        
    }
}

export default connectDB;