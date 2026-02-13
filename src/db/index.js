import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connnected!");
  } catch (error) {
    console.error("Connection Error!", error);
    process.exit(1);
  }
};

export default connectDB;
