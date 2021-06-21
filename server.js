const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv/config');

//for dot env file
require('dotenv/config');

//Mongodb connection file
const connectDB = require('./DB/connection_mongodb');
connectDB();

//user router
const user = require('./router/user');

//port
const port = process.env.PORT || 5000;

//middleware
app.use(cors( {origin: ['http://localhost:5000', 'https://cryptyy.herokuapp.com', 'http://localhost:8080'], credentials: true }));
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cookieParser(process.env.key_secret))

//always last
app.use(user);

app.listen(port, (err)=>{
    if(err) 
        console.log(err);
    else {
        console.log(`listen at ${port}`);
    }
})
