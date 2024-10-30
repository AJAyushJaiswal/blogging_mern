import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const connectToDB = async () => {
    try{
        const result = await mongoose.connect(`${process.env.DB_CONNECTION_STRING}/${DB_NAME}`);
        if (process.env.NODE_ENV !== 'production') console.log(result.connection.host);
    }
    catch(error){
        console.log('Error connecting to the database!');
        if (process.env.NODE_ENV !== 'production') {
            console.log('ERROR: ', error);
        }
        process.exit(1);
    }
};

export {connectToDB};