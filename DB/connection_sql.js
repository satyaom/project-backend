const mysql = require('mysql')

//create connection
var conSql = mysql.createPool({
    host: 'us-mm-auto-dca-04-a.cleardb.net',
    user: process.env.USERNAME_SQL, 
    password: process.env.PASSWORD_SQL,
    database:'heroku_0b096781cffa970' 
});

module.exports = conSql;