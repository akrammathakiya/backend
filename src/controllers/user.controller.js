import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        console.log("Tokens generated successfully:", { accessToken, refreshToken });
        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    // Check if any required field is empty
    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required for registration.");
    }

    // Check if the user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists with this email or username.");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // Ensure avatar is uploaded
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.");
    }

    // Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed.");
    }

    // Create the user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Remove sensitive fields from the user object
    const createdUser = user.toObject(); // Convert Mongoose object to plain JS object
    delete createdUser.password;
    delete createdUser.refreshToken;

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    );
});

const loginUser  = asyncHandler( async (req,res) => {
    const { email, password, username } = req.body

    if (!(email || username)) {
        throw new ApiError(400,"username or email required")
    }

    const user = await User.findOne({
        $or:[{ email },{ username }]
    })

    if (!user) {
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

      if (!isPasswordValid) {
        throw new ApiError(401,"password incorrect")
    }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
        200,
        {
        user: loggedInUser,accessToken,refreshToken
        },
        "user loggedIn successfully"
    )
   )
})

const logOutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
        
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
        
    )

    const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200, {}, "user loggedout successfully"))
})

export 
{
     registerUser,
     loginUser,
     logOutUser,
     

};
