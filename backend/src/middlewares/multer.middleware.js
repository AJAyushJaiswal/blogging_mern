import multer, {memoryStorage} from 'multer';
import {allowedImageMimeTypes} from '../../constants.js';
import {ApiError} from '../utils/ApiError.js';


const storage = memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if(file && allowedImageMimeTypes.includes(file.mimetype)){
            cb(null, true);
        }
        else{
            cb(new ApiError(400, "Invalid file type!"), false);
        }
    }
});


export {upload};