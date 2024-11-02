import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';


const registerUser = asyncHandler(async(req, res)=>{
    const valRes = validationResult(req);
    if(!valRes.empty()){
        throw new ApiError(400, "Invalid user data!", null, valRes.errors);
    }
    
    const {name, email, password} = req.body;

    const user = User.create({name, email, password});
    if(!user){
        throw new ApiError(400, "Error registering the user!");
    }

    const accessToken = user.generateAccessToken();
    if(!accessToken){
       throw new ApiError(400, "Error generating access token!"); 
    }

    const refreshToken = user.generateRefreshToken();
    if(!refreshToken){
       throw new ApiError(400, "Error generating refresh token!"); 
    }
    
    user.refreshToken = refreshToken;
    const updatedUser = await user.save();
    if(!updatedUser){
        throw new ApiError();
    }
    
    delete updatedUser._doc.__v; 
    delete updatedUser._doc.password; 
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
    .json(new ApiResponse(201, user, "User registered successfully!"));
});


export {
    registerUser
}