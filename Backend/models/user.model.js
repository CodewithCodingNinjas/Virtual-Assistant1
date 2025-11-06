import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {                 // <-- Added to fix 500 error
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    assistantName: {
        type: String
    },
    assistantImage: {
        type: String
    },
    history: {
        type: [String], // array of strings
        default: []
}

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
