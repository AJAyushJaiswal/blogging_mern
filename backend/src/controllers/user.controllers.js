import {asyncHandler} from '../utils/asyncHandler.js';
import {validationResult} from 'express-validator';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {uploadToCloudinary} from '../utils/cloudinary.js';


const registerUser = asyncHandler(async(req, res)=>{
    const valRes = validationResult(req);
    if(!valRes.isEmpty()){
        throw new ApiError(400, "Invalid user data!", null, valRes.errors);
    }
    
    const {firstname, lastname, email, password} = req.body;
    const image = req.file;

    const userAlreadyExists = await User.exists({email}).lean();
    if(userAlreadyExists){
        throw new ApiError(400, "User with this email already exists!");
    }

    let avatar = null;
    if(image){
        try{
            avatar = await uploadToCloudinary(image);
            if(!avatar){
                throw new ApiError(400, "Error uploading the image!");
            }
        }
        catch(error){
            throw new ApiError(400, "Error uploading the image!");
        }
    }
    
    const user = await User.create({firstname, lastname, email, password, avatar});
    if(!user){
        throw new ApiError(400, "Error registering the user!");
    }
    
    const accessToken = user.generateAccessToken();
    if(!accessToken){
        if(process.env.NODE_ENV !== 'production') console.log("Error generating the access token!");
        throw new ApiError(500, "Error registering the user!");
    }

    const refreshToken = user.generateRefreshToken();
    if(!refreshToken){
        if(process.env.NODE_ENV !== 'production') console.log("Error generating the refresh token!");
        throw new ApiError(500, "Error registering the user!");
    }
    
    user.refreshToken = refreshToken;
    const updatedUser = await user.save();
    if(!updatedUser){
        if(process.env.NODE_ENV !== 'production') console.log("Error saving the refresh token!");
        throw new ApiError(500, "Error registering the user!");
    }
    
    delete updatedUser._doc.__v; 
    delete updatedUser._doc.password; 
    delete updatedUser._doc.refreshToken;
    delete updatedUser._doc.createdAt; 
    delete updatedUser._doc.updatedAt; 
    
    const options = {
        httpOnly: true,
        secure: true,
    }
    
    const accessMaxAge = 30 * 60 * 60;
    const refreshMaxAge = 3 * 24 * 60 * 60;
    
    res.status(201)
    .cookie('accessToken', accessToken, {...options, accessMaxAge})
    .cookie('refreshToken', refreshToken, {...options, refreshMaxAge})
    .json(new ApiResponse(201, "User registered successfully!", {user, accessToken, refreshToken}));
});


const loginUser = asyncHandler(async (req, res) => {
    const valRes = validationResult(req);
    if(!valRes || !valRes.isEmpty()){
        throw new ApiError(400, "Invalid credentials!");
    }
    
    const {email, password} = req.body;
    
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(400, "Invalid credentials!");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid credentials!");
    }
    
    const accessToken = user.generateAccessToken();
    if(!accessToken){
        if(process.env.NODE_ENV) console.log("Error generating access token!");
        throw new ApiError(500, "Error logging in!");
    }

    const refreshToken = user.generateRefreshToken();
    if(!refreshToken){
        if(process.env.NODE_ENV) console.log("Error generating refresh token!");
        throw new ApiError(500, "Error logging in!");
    }
    
    user.refreshToken = refreshToken;
    const updatedUser = await user.save();
    if(!updatedUser){
        if(process.env.NODE_ENV) console.log("Error saving the refresh token!");
        throw new ApiError(500, "Error logging in!");
    }
    
    delete updatedUser._doc.__v; 
    delete updatedUser._doc.password; 
    delete updatedUser._doc.refreshToken;
    delete updatedUser._doc.createdAt; 
    delete updatedUser._doc.updatedAt; 
    
    const options = {
        httpOnly: true,
        secure: true
    }; 
    
    const accessMaxAge = 30 * 60 * 60;
    const refreshMaxAge = 3 * 24 * 60 * 60;
    
    res.status(200)
    .cookie('accessToken', accessToken, {...options, accessMaxAge})
    .cookie('refreshToken', refreshToken, {...options, refreshMaxAge})
    .json(new ApiResponse(200, "User logged in sucessfully!", {user: updatedUser, accessToken, refreshToken}));
});


export {
    registerUser,
    loginUser
}