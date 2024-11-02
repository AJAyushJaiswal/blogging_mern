import {v2 as cloudinary} from 'cloudinary';
import {ApiError} from './ApiError.js';
import {CLOUDINARY_MAIN_FOLDER} from '../../constants.js';


cloudinary.config({
       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (image) => {
    if(!image){
        if (process.env.NODE_ENV !== 'production') console.log('Image is required!');
        throw new ApiError(500, "Image is required!");
    }

    try{
        const result = await cloudinary.uploader.upload(image, {
            resource_type: 'image',
            folder: `${CLOUDINARY_MAIN_FOLDER}/${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`
        });
        if(result){
            throw new ApiError(500, "Error uploading image!");
        }
        
        return result.url;
    }
    catch(error){
        if(process.env.NODE_ENV !== 'production') console.log(error);
        
        if(error instanceof ApiError){
            throw new ApiError(error.statusCode, error.message);
        }
        
        throw new ApiError(500, "Error uploading image!");
    }
}


export {
    uploadToCloudinary
}