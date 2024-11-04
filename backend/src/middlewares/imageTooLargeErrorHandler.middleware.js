import {ApiError} from "../utils/ApiError.js";

const imageTooLargeErrorHandler = (err, req, res, next) => {
    if(err.code === 'LIMIT_FILE_SIZE'){
        throw new ApiError(400, "Image must not be larger than 1 MB!");
    }
    else if(err){
        throw err;
    }
}


export {imageTooLargeErrorHandler};