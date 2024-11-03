import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    try{
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        if(!accessToken){
            throw new ApiError(401, "Unauthorised request!");
        }
        
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if(!decodedToken){
            throw new ApiError(401, "Unauthorised request!");
        }
        
        const user = await User.findOne({_id: decodedToken._id, email: decodedToken.email}, {_id: 1}).lean();
        if(!user){
            throw new ApiError(401, "Unauthorised request!");
        }
        
        req.user = user._id;
        next();
    }
    catch(error){
        if(process.env.NODE_ENV !== 'production') console.log(error);

        if(error instanceof jwt.JsonWebTokenError){
            if(process.env.NODE_ENV !== 'production') console.log('Invalid access token!');
        }
        else if(error instanceof jwt.TokenExpiredError){
            if(process.env.NODE_ENV !== 'production') console.log('Access token expired!');
        }
        throw new ApiError(401, 'Unauthorised request!');
    }
});