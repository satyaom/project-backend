const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(process.env.DB_CONNECTION, 
        {
            useUnifiedTopology:true,
            useNewUrlParser: true,
        },
        () => {
            console.log('connected to mongodb server');
        }
    );
}

module.exports = connectDB;