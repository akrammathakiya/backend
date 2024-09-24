import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import {uploadOnCloudinary} from"../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get details user from frontend
    // validation- any field no empty
    // user exited or not check through username or email
    // check images or avtar
    // upload on cloudinary after check avtar is upload on clodinary 
    // create user object entry in db
    // remove passwword and refrehToken
    // check user successfully created or not
    // return response

    const {fullName,email,username,password} = req.body
    console.log("email",email)

    if ([username,email,password,fullName].some((field)=>
    field?.trim()==="")) 
    {
        throw new ApiError(400,"all field are required")
    }

    const existedUser = User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"user alreay existed with this username or email")
    }

    const avtarLocalPath = req.files?.avtar?.[0].path;
    const coverImageLocalPath = req.files?.coverImage?.[0].path;

    if (!avtarLocalPath) {
        throw new ApiError(400,"avtar is required")        
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
   
    if(!avtar){
        throw new ApiError(400,"avtar is reqquired")
    }

    User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(User._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully.")
    )
})

export { registerUser };
