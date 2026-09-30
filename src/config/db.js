const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'voting_poll',
    port: '3307'
})

connection.connect((err) => {
    if(err){
        console.error('connection not established:', err)
        return;
    }
    console.log('connection established successfully')
})

module.exports = connection.promise();