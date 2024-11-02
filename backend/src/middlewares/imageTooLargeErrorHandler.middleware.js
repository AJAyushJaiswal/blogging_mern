const imageTooLargeErrorHandler = (err, req, res, next) => {
    if(err.code === 'LIMIT_FILE_SIZE'){
        return res.status(400).json({
            statusCode: 400,
            message: "Image must not be larger than 1 MB!",
            data: null,
            errors: [],
            success: false
        });
    }

    next();
}


export {imageTooLargeErrorHandler};