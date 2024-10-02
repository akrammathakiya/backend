import { config } from "dotenv";
config()
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"





cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

// cloudinary.config({
//     cloud_name: "dzi2gb5lw",
//     api_key: "282713433694213",
//     api_secret: "HHbfHUwK7z4igPP4ELZJHjgKmK8"
// });


const uploadOnCloudinary = async(localpath)=>{
    try {
        if(!localpath) return null
        const response = await cloudinary.uploader.upload(localpath,{resource_type:"auto"})

        // console.log("uploaded successfully",response.url);
        fs.unlinkSync(localpath)


        return response
    } catch (error) {
        fs.unlinkSync(localpath)
        console.log("error while uploading on cloudnary",error);
        return null
    }
}
export {uploadOnCloudinary}