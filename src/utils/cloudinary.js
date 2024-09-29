import { config } from "dotenv";
config()
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

// cloudinary.config({
//     cloud_name: "himanshupadecha",
//     api_key: "187479743714649",
//     api_secret: "HKFj7pKq80MOWny682zvNoprmSc"
// });


export const uploadOnCloudinary = async(localpath)=>{
    console.log("api key :" , process.env.CLOUDINARY_API_KEY);
    console.log("cloud name :" , process.env.CLOUD_NAME);
    console.log("api secret :" , process.env.CLOUDINARY_API_SECRET);
    console.log(cloudinary.config());
    
    
    try {
        if(!localpath) return null
        const response = await cloudinary.uploader.upload(localpath,{resource_type:"auto"})

        console.log("uploaded successfully");

        fs.unlinkSync(localpath)

        return response
    } catch (error) {
        fs.unlinkSync(localpath)
        console.log("error while uploading on cloudnary",error);
        return null
    }
}