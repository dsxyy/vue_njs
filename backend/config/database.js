const mysql = require('mysql2/promise');
//const ENV = 'local';
// const ENV = 'dev';
 const ENV = 'prod';

// 从独立配置文件引入IP等信息
const dbConfig = require('./dbConfig');

// 数据库连接池配置（保留原其他配置，仅替换host等）
const databaseConfig = {
    'local': {
        ...dbConfig.local,  // 继承提取的IP等信息
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
    },
    'dev': {
        ...dbConfig.dev,  // 继承提取的IP等信息
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
    },
    'prod': {
        ...dbConfig.prod,  // 继承提取的IP等信息
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
    }
}
const pool = mysql.createPool(databaseConfig[ENV]);

module.exports = pool;
