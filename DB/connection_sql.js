const mysql = require('mysql')

//create connection
var conSql = mysql.createPool({
    host: 'freedb.tech',
    user: process.env.USERNAME_SQL, 
    password: process.env.PASSWORD_SQL,
    database:'freedbtech_projectdbandi' 
});

module.exports = conSql;