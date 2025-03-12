const path = require('path');
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, '..', '..', '..', 'console', 'server.log') })
    ]
});

module.exports = logger;