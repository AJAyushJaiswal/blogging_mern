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


app.use(globalErrorHandler);

export {app};