const mysql = require('mysql')

//create connection
var conSql = mysql.createPool({
    host: 'remotemysql.com',
    user: process.env.USERNAME_SQL, 
    password: process.env.PASSWORD_SQL,
    database:'IEySPYTWPk' 
});

module.exports = conSql;