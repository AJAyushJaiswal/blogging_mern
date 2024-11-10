import {Router} from 'express';
import {verifyAccessToken} from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import {imageTooLargeErrorHandler} from '../middlewares/imageTooLargeErrorHandler.middleware.js';
import {body} from 'express-validator';
import {publishBlog, updateBlog, deleteBlog, getMyBlog, getAllMyBlogs, getBlog, getAllBlogs} from '../controllers/blog.controllers.js';


const router = Router();

router.route('/publish').post(
    verifyAccessToken,
    upload.single('featuredImageFile'),
    imageTooLargeErrorHandler,
    [
        body('title')
        .notEmpty().withMessage('Title is required!')
        .isString().withMessage('Title must be a string!')
        .isLength({min: 3, max: 50}).withMessage('Title must be at least 10 characters!'),

        body('content')
        .notEmpty().withMessage('Content is required!')
        .isString().withMessage('Content must be a string!')
        .isLength({min: 100, max: 1500}).withMessage('Content must be in the range of 100-1500 characters!'),
        
        body('status')
        .optional()
        .isIn(['private', 'public']).withMessage('Invalid status!')
    ],
    publishBlog
);

router.route('/blogger/:blogId')
.get(
    verifyAccessToken,
    getMyBlog
)
.post(
    verifyAccessToken,
    upload.single('featuredImageFile'),
    imageTooLargeErrorHandler,
    [
        body('title')
        .notEmpty().withMessage('Title is required!')
        .isString().withMessage('Title must be a string!')
        .isLength({min: 3, max: 50}).withMessage('Title must be at least 10 characters!'),

        body('content')
        .notEmpty().withMessage('Content is required!')
        .isString().withMessage('Content must be a string!')
        .isLength({min: 100, max: 1500}).withMessage('Content must be in the range of 100-1500 characters!'),
        
        body('status')
        .optional()
        .isIn(['private', 'public']).withMessage('Invalid status!')
    ],
    updateBlog
)
.delete(verifyAccessToken, deleteBlog);

router.route('/blogger/')
.get(verifyAccessToken, getAllMyBlogs);


router.route('/:blogId').get(getBlog);

router.route('/').get(getAllBlogs);


export default router;