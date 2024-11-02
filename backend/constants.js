const DB_NAME = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const CLOUDINARY_MAIN_FOLDER = 'blogging_mern';

export {
    DB_NAME,
    CLOUDINARY_MAIN_FOLDER
}