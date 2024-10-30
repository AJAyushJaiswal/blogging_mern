import {ApiError} from "../utils/ApiError";

const globalErrorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') console.log(err);

    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            data: err.data,
            errors: err.errors,
            success: err.success
        });
    }
    else{
        return res.status(statusCode).json({
            statusCode: 500,
            message: 'Internal Server Error!',
            data: null,
            errors: [],
            success: false
        });
    }
};

export {globalErrorHandler};