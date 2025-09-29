/**
 * 日志工具
 * 使用winston进行日志管理
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 确保日志目录存在
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return log;
    })
);

// 控制台格式
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;

        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        return log;
    })
);

// 创建logger实例
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: 'campus-animal-care-api'
    },
    transports: [
        // 文件传输
        new winston.transports.File({
            filename: config.logging.file,
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            format: logFormat
        }),
        // 错误日志文件
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            format: logFormat
        })
    ]
});

// 开发环境添加控制台输出
if (config.server.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// 添加自定义方法
logger.request = (req, message = '') => {
    logger.info(`[REQUEST] ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        message
    });
};

logger.response = (req, res, message = '') => {
    logger.info(`[RESPONSE] ${req.method} ${req.originalUrl} ${res.statusCode}`, {
        ip: req.ip,
        statusCode: res.statusCode,
        responseTime: res.get('X-Response-Time'),
        message
    });
};

logger.database = (operation, table, message = '') => {
    logger.info(`[DATABASE] ${operation} ${table}`, {
        operation,
        table,
        message
    });
};

logger.security = (event, message = '') => {
    logger.warn(`[SECURITY] ${event}`, {
        event,
        message,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;

