const asyncHandler = (requestHandler) => async (req, res, next) => Promise.resolve(requestHandler(req, res)).catch(next); 

export {asyncHandler};