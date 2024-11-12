import {asyncHandler} from '../utils/asyncHandler.js';
import {validationResult} from 'express-validator';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {uploadToCloudinary} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import {isValidObjectId, Types} from 'mongoose';



const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax'
}; 

const accessTokenMaxAge = 30 * 60 * 1000;
const refreshTokenMaxAge = 3 * 24 * 60 * 1000;

    
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
        }
        catch(error){
            throw new ApiError(400, "Error uploading the avatar!");
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
    
    res.status(201)
    .cookie('accessToken', accessToken, {...cookieOptions, maxAge: accessTokenMaxAge})
    .cookie('refreshToken', refreshToken, {...cookieOptions, maxAge: refreshTokenMaxAge})
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
        if(process.env.NODE_ENV !== 'production') console.log("Error generating access token!");
        throw new ApiError(500, "Error logging in!");
    }

    const refreshToken = user.generateRefreshToken();
    if(!refreshToken){
        if(process.env.NODE_ENV !== 'production') console.log("Error generating refresh token!");
        throw new ApiError(500, "Error logging in!");
    }
    
    user.refreshToken = refreshToken;
    const updatedUser = await user.save();
    if(!updatedUser){
        if(process.env.NODE_ENV !== 'production') console.log("Error saving the refresh token!");
        throw new ApiError(500, "Error logging in!");
    }
    
    delete updatedUser._doc.__v; 
    delete updatedUser._doc.password; 
    delete updatedUser._doc.refreshToken;
    delete updatedUser._doc.createdAt; 
    delete updatedUser._doc.updatedAt; 
    
    res.status(200)
    .cookie('accessToken', accessToken, {...cookieOptions, maxAge: accessTokenMaxAge})
    .cookie('refreshToken', refreshToken, {...cookieOptions, maxAge: refreshTokenMaxAge})
    .json(new ApiResponse(200, "User logged in sucessfully!", {user: updatedUser, accessToken, refreshToken}));
});


const logoutUser = asyncHandler(async (req, res) => {
    const result = await User.updateOne({_id: req.user}, {$unset: {refreshToken: ''}}).lean();
    if(result.matchedCount === 0){
        throw new ApiError(404, 'Invalid request!');
    }

    if(result.modifiedCount === 0){
        throw new ApiError(400, 'Error logging out!');
    }
    
    res.status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully!"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!oldRefreshToken){
        throw new ApiError(400, "Invalid refresh token!");
    }

    let decodedRefreshToken;
    try{
        decodedRefreshToken = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        if(!decodedRefreshToken){
            throw new ApiError(400, "Invalid refresh token!");
        }
    }
    catch(error){
        if(error instanceof jwt.JsonWebTokenError) console.log('Refresh token is incorrect!\n', error);
        if(error instanceof jwt.TokenExpiredError) console.log('Refresh token expired!\n', error);
        
        throw new ApiError(400, 'Invalid refresh token!');
    }
    
    const user = await User.findOne({_id: decodedRefreshToken._id}).select('refreshToken');
    if(!user){
        throw new ApiError(400, "Invalid refresh token!");
    }
    
    if(user.refreshToken !== oldRefreshToken){
        throw new ApiError(400, "Invalid refresh token!");
    }
    
    const newAccessToken = user.generateAccessToken();
    if(!newAccessToken){
        if(process.env.NODE_ENV !== 'production') console.log('Error generating new access token!');
        throw new ApiError(400, "Error refreshing access token!"); 
    }

    const newRefreshToken = user.generateRefreshToken();
    if(!newRefreshToken){
        if(process.env.NODE_ENV !== 'production') console.log('Error generating new refresh token!');
        throw new ApiError(400, "Error refreshing access token!"); 
    }
    
    user.refreshToken = newRefreshToken;
    const updatedUser = await user.save();
    if(!updatedUser){
        if(process.env.NODE_ENV !== 'production') console.log('Error saving new refresh token!');
        throw new ApiError(400, "Error refreshing access token!"); 
    }
    
    res.status(200)
    .cookie('accessToken', newAccessToken, {...cookieOptions, maxAge: accessTokenMaxAge})
    .cookie('refreshToken', newRefreshToken, {...cookieOptions, maxAge: refreshTokenMaxAge})
    .json(new ApiResponse(200, "Access token refreshed successfully!"));
});


const getMyProfile = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user,
            }
        },
        {
            $lookup: {
                from: 'blogs',
                localField: '_id',
                foreignField: 'writer',
                as: 'blogs',
                pipeline: [
                    {
                        $group: {
                            _id: "$status",
                            count: {$sum: 1}
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                 publicBlogCount: {
                    $let: {
                        vars: {
                            publicStatus: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$blogs",
                                            as: "status",
                                            cond: {$eq: ["$$status._id", "public"]}
                                        }
                                    },
                                    0
                                ]
                            }
                        },
                        in: {$ifNull: ["$$publicStatus.count", 0]}
                    }
                },
                privateBlogCount: {
                    $let: {
                        vars: {
                            privateStatus: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$blogs",
                                            as: "status",
                                            cond: {$eq: ["$$status._id", "private"]}
                                        }
                                    },
                                    0
                                ]
                            }
                        },
                        in: {$ifNull: ["$$privateStatus.count", 0]}
                    }
                },
               
            }
        },
        {
            $project: {
                _id: 1,
                firstname: 1,
                lastname: 1,
                email: 1,
                avatar: 1,
                createdAt: 1,
                updatedAt: 1,
                publicBlogCount: 1,
                privateBlogCount: 1,
                totalBlogCount: {
                    $add: ["$publicBlogCount", "$privateBlogCount"]
                }
            }

        }
    ]);

    if(!user){
        throw new ApiError(400, "Error fetching your profile!");
    }
    
    res.status(200).json(new ApiResponse(200, "Your profile fetched successfully!", user));
});


const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.params?.userId;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400, "User not found!");
    }

    const user = await User.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'blogs',
                localField: '_id',
                foreignField: 'writer',
                as: 'blogs',
                pipeline: [
                    {
                        $match: {
                            status: 'public'
                        }
                    },
                    {
                        $count: 'count'
                    }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                firstname: 1,
                lastname: 1,
                avatar: 1,
                createdAt: 1,
                blogCount: {$ifNull: [{$arrayElemAt: ["$blogs.count", 0]}, 0]}
            }
        }
    ]);
    
    if(!user){
        throw new ApiError(404, "Error fetching user profile!");
    }

    res.status(200).json(new ApiResponse(200, "User profile fetched successfully!", user));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getMyProfile,
    getUserProfile
}