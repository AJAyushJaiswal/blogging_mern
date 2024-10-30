class ApiError extends Error{
    constructor(
        statusCode,
        message = 'Something went wrong!',
        data = null,
        errors = [],
        stack = ''
    ){
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.errors = errors;
        
        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};