import mongoose from "mongoose";

const connectDb = async () => {
    // Accept either name to stay compatible with existing .env files and the
    // deployment guide (which documents MONGODB_URI).
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
    if (!uri) {
        throw new Error("MONGODB_URI (or MONGODB_URL) is not set");
    }
    // Let connection errors propagate so the caller (index.js) can exit non-zero
    // instead of starting an app with no database.
    await mongoose.connect(uri);
    console.log("db connected");
};

export default connectDb;
