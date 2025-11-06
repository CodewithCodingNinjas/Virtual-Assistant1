import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary =async (filePath)=>{
        cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_CLOUD_KEY, 
        api_secret: process.env.CLOUDINARY_CLOUD_SECRET
    });
    try {
        const uploadResult = await cloudinary.uploader
       .upload(filePath)
       fs.unlinkSync(filePath)
       return uploadResult.secure_url
    } catch (error) {
        fs.unlinkSync(filePath)
       return { message: "cloudinary error" };

    }
}
export default uploadOnCloudinary
