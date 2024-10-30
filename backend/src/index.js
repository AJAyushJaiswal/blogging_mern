import 'dotenv/config'; 
import {connectToDB} from './db.js';
import {app} from './app.js';

connectToDB().then(() => {
    try{
        const port = process.env.PORT || 7000;
        app.listen(port, () => {
            console.log(`Server started at PORT: ${port}!!`);
        });
    }
    catch(error){
        console.log('Error starting the server!');
        if(process.env.NODE_ENV !== 'production') console.log(error);
    }
});