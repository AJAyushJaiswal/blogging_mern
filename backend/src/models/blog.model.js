import {Schema, model} from 'mongoose';


const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    featuredImage: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        trim: true
    },
    writer: {
       type: Schema.Types.ObjectId,
       ref: 'User',
       required: true
    }
}, {timestamps: true});


export const Blog = model('Blog', blogSchema);