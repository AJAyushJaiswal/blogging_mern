import {v2 as cloudinary} from 'cloudinary';
import {ApiError} from './ApiError.js';
import {CLOUDINARY_MAIN_FOLDER} from '../../constants.js';


cloudinary.config({
       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (image) => {
    if(!image || !image.buffer || !Buffer.isBuffer(image.buffer)){
        throw new ApiError(500, "Image is required!");
    }

    if(!Buffer.isBuffer(image.buffer)){
        throw new ApiError(500, "Invalid file!");
    }

    const url = await new Promise((res, rej) => {
        const stream = cloudinary.uploader.upload_stream({
            resource_type: 'image',
            folder: `${CLOUDINARY_MAIN_FOLDER}/${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`
        }, (error, result) => {
            if(error || !result){
                if(process.env.NODE_ENV !== 'production') console.log(error);

                return rej(new ApiError(500, "Error uploading image!"));
            }

            return res(result.url);
        });

        stream.end(image.buffer);
    });

    return url;
}


const deleteFromCloudinary = async(imageUrl) => {
    if(!imageUrl){
        throw new ApiError(400, 'Image url is required!');
    }
    
    const imageUrlArray = imageUrl.split('/');
    const publicId = `${CLOUDINARY_MAIN_FOLDER}/${process.env.NODE_ENV === 'production' ? 'production' : 'development'}/${imageUrlArray[imageUrlArray.length - 1].split('.')[0]}`;
    if(!publicId){
        throw new ApiError(400, "Invalid image url!");
    }
   
    try{
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image'
        });
        if(response.result !== 'ok'){
            if(process.env.NODE_ENV !== 'production') console.log(response);
            throw new ApiError(400, "Error deleting image!");
        }
    }
    catch(error){
        if(process.env.NODE_ENV !== 'production') console.log(error);
        throw new ApiError(400, "Error deleting image!");
    }
};


export {
    uploadToCloudinary,
    deleteFromCloudinary
}