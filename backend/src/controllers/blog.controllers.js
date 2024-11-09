import {asyncHandler} from '../utils/asyncHandler.js';
import {validationResult} from 'express-validator';
import {ApiError} from '../utils/ApiError.js';
import {uploadToCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';
import {Blog} from '../models/blog.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {isValidObjectId, Types} from 'mongoose';

const publishBlog = asyncHandler(async (req, res) => {
    const valRes = validationResult(req);
    if(!valRes?.isEmpty()){
        throw new ApiError(400, "Invalid input data!", null, valRes.errors);
    }
    
    const {title, content, status} = req.body;

    const featuredImageFile = req.file;
    if(!featuredImageFile){
        throw new ApiError(400, "Featured image is required!");
    }
    
    let featuredImageUrl;
    try{
        featuredImageUrl = await uploadToCloudinary(featuredImageFile);
    }
    catch(error){
        if(process.env.NODE_ENV !== 'production') console.log(error);
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


const updateBlog = asyncHandler(async (req, res) => {
    const blogId = req.params?.blogId;
    if(!blogId || !isValidObjectId(blogId)){
        throw new ApiError(400, "Invalid blog id!");
    }
    
    const blog = await Blog.findOne({_id: blogId, writer: req.user}).select('featuredImage').lean();
    if(!blog){
        throw new ApiError(400, "Invalid blog id!");
    }

    const {title, content, status} = req.body;
    const featuredImageFile = req.file;
    
    let featuredImageUrl;
    if(featuredImageFile){
        try{
            featuredImageUrl = await uploadToCloudinary(featuredImageFile);
            await deleteFromCloudinary(blog.featuredImage);
        }
        catch(error){
            if(process.env.NODE_ENV !== 'production') console.log(error); 
            throw new ApiError(500, "Error updating the blog!");
        }
    }
    
    const updateResult = await Blog.updateOne({_id: blogId, writer: req.user}, {$set: {title, content, status, featuredImage: featuredImageUrl}}).lean();
    if(updateResult.modifiedCount === 0){
        throw new ApiError(500, "Error updating the blog!");
    }
    
    res.status(200).json(new ApiResponse(200, "Blog updated successfully!"));
});


const deleteBlog = asyncHandler(async (req, res) => {
    const blogId = req.params?.blogId;

    if(!blogId || !isValidObjectId(blogId)){
        throw new ApiError(400, "Invalid blog id!");
    }
    
    const blog = await Blog.findOneAndDelete({_id: blogId, writer: req.user}).select('featuredImage').lean();
    if(!blog){
        throw new ApiError(400, "Error deleting the blog!");
    }
    
    try{
        await deleteFromCloudinary(blog.featuredImage);
    }
    catch(error){
        if(process.env.NODE_ENV !== 'production') console.log(error);
        throw new ApiError(400, "Error deleting the featured image!");
    }
    
    res.status(200).json(new ApiResponse(200, "Blog deleted successfully!"));
});


const getWriterBlog = asyncHandler(async (req, res) => {
    const blogId = req.params?.blogId;
    if(!blogId || !isValidObjectId(blogId)){
        throw new ApiError(400, "Invalid blog id!");
    }

    const blog = await Blog.findOne({_id: blogId, writer: req.user}).select('-__v -writer').lean();
    if(!blog){
        throw new ApiError(400, "Error fetching the blog!");
    }
    
    res.status(200).json(new ApiResponse(200, "Blog fetched successfully!", blog));
});


const getAllWriterBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({writer: req.user}).select('-__v -writer -content').lean();
    if(!blogs){
        throw new ApiError(400, "Error fetching your blogs!");
    }
    
    res.status(200).json(new ApiResponse(200, "Blogs fetched successfully!", blogs));
});


const getBlog = asyncHandler(async (req, res) => {
    const blogId = req.params?.blogId;
    if(!blogId || !isValidObjectId(blogId)){
        throw new ApiError(400, "Invalid blog id!");
    }
    
    const blog = await Blog.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(blogId),
                status: 'public'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'writer',
                foreignField: '_id',
                as: 'writer',
                pipeline: [
                    {
                        $project: {
                            "_id": 1,
                            "firstname": 1,
                            "lastname": 1,
                            "avatar": 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                "__v": 0
            }
        }
    ]);
    res.status(200).json(new ApiResponse(200, "Blog fetched successfully!", blog));
});


const getAllBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.aggregate([
        {
            $match: {
                status: 'private'    
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'writer',
                foreignField: '_id',
                as: 'writer',
                pipeline: [
                    {
                        $project: {
                            firstname: 1,
                            lastname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                "__v": 0,
                "status": 0
            }
        }
    ]);
    
    if(!blogs){
        throw new ApiError(400, 'Error fetching the blogs!');
    }
    
    res.status(200).json(new ApiResponse(200, "Blogs fetched successfully!", blogs));
});


export {
    publishBlog,
    updateBlog,
    deleteBlog,
    getWriterBlog,
    getAllWriterBlogs,
    getBlog,
    getAllBlogs
}