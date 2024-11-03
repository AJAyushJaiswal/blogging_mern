import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {globalErrorHandler} from './middlewares/globalErrorHandler.middleware.js';


const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.urlencoded({extended: true}));

app.use(express.json());

app.use(cookieParser());


// routes
import userRouter from '../src/routes/user.routes.js';
import blogRouter from '../src/routes/blog.routes.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/blogs', blogRouter);


app.use(globalErrorHandler);

export {app};