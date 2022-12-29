import dotenv from 'dotenv';
import cloudinaryV2 from 'cloudinary';

dotenv.config();
export const cloudinary = cloudinaryV2.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


