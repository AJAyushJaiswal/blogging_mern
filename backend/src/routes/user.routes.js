import {Router} from 'express';
import {body} from 'express-validator';
import {registerUser, loginUser, logoutUser} from '../controllers/user.controllers.js';
import {upload} from '../middlewares/multer.middleware.js';
import {imageTooLargeErrorHandler} from '../middlewares/imageTooLargeErrorHandler.middleware.js';
import {verifyAccessToken} from '../middlewares/auth.middleware.js';


const router = Router();

router.route('/register').post(
    upload.single('avatar'),
    imageTooLargeErrorHandler,
    [
        body('firstname')
        .notEmpty().withMessage('First name is required!')
        .isString().withMessage('First name must be a string!')
        .trim()
        .isLength({min: 2}).withMessage('First name must be at least 2 characters')
        .matches(/^[a-zA-Z]+$/).withMessage('First name must only contain uppercase or lowercase letters!'),

        body('lastname')
        .notEmpty().withMessage('Last name is required!')
        .isString().withMessage('Last name must be a string!')
        .trim()
        .isLength({min: 2}).withMessage('Last name must be at least 2 characters!')
        .matches(/^[a-zA-Z]+$/).withMessage('Last name must only contain uppercase or lowercase letters!'),
        
        body('email')
        .notEmpty().withMessage('Email is required!')
        .isString().withMessage('Email must be a string!')
        .trim()
        .isEmail().withMessage('Invalid email!'),

        body('password')
        .notEmpty().withMessage('Password is required!')
        .isString().withMessage('Password must be a string!')
        .trim()
        .isLength({min: 8}).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).*$/).withMessage('Password must contain at least an uppercase letter, a lowercase letter, a number, a special character and no spaces!')
    ],
    registerUser
);

router.route('/login')
.post(
    [
        body('email')
        .notEmpty().withMessage('Email is required!')
        .isString().withMessage('Email must be a string!')
        .trim()
        .isEmail().withMessage('Invalid email!'),

        body('password')
        .notEmpty().withMessage('Password is required!')
        .isString().withMessage('Password must be a string!')
        .trim()
        .isLength({min: 8}).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).*$/).withMessage('Password must contain at least an uppercase letter, a lowercase letter, a number, a special character and no spaces!')
    ],
    loginUser
);

router.route('/logout')
.post(
    verifyAccessToken,
    logoutUser
);


export default router;