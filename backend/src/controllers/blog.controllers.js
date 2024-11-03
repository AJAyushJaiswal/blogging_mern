import {asyncHandler} from '../utils/asyncHandler.js';
import {validationResult} from 'express-validator';
import {uploadToCloudinary} from '../utils/cloudinary.js';
import {Blog} from '../models/blog.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const publishBlog = asyncHandler(async (req, res) => {
    const valRes = validationResult(req);
    if(!valRes?.isEmpty()){
        throw new ApiError(400, "Invalid input data!");
    }
    
    const {title, content, status} = req.body;

    const featuredImageFile = req.url;
    if(!featuredImageFile){
        throw new ApiError(400, "Featured image is required!");
    }
    
    let featuredImageUrl;
    try{
        featuredImageUrl = await uploadToCloudinary(featuredImageFile);
    }
    catch(error){
        throw new ApiError(500, "Error uploading the featured image!");        
    }
    
    const blog = await Blog.create({title, content, status, featuredImage: featuredImageUrl, writer: req.user});
    if(!blog){
        throw new ApiError(500, "Error publishing the blog!");
    }
    
    delete blog._doc.updatedAt;
    delete blog._doc.__v;
    
    res.status(201).json(new ApiResponse(201, "Blog published successfully!", blog));
});


export {
    publishBlog
}