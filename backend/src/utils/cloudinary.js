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
        if (process.env.NODE_ENV !== 'production') console.log('Image is required!');
        throw new ApiError(500, "Image is required!");
    }

    if(!Buffer.isBuffer(image.buffer)){
        if (process.env.NODE_ENV !== 'production') console.log('Image is required!');
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


export {
    uploadToCloudinary
}