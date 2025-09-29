/**
 * 全局错误处理中间件
 * 统一处理所有错误响应
 */

const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
    // 记录错误日志
    logger.error('服务器错误', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // 默认错误响应
    let statusCode = 500;
    let message = '服务器内部错误';
    let code = 500;

    // 处理不同类型的错误
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = '请求参数验证失败';
        code = 400;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = '未授权访问';
        code = 401;
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = '禁止访问';
        code = 403;
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = '资源不存在';
        code = 404;
    } else if (err.name === 'ConflictError') {
        statusCode = 409;
        message = '资源冲突';
        code = 409;
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = '数据已存在';
        code = 409;
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = '关联数据不存在';
        code = 400;
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 400;
        message = '数据正在被使用，无法删除';
        code = 400;
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = '数据库连接失败';
        code = 503;
    }

    // 构建错误响应
    const errorResponse = {
        code,
        message,
        timestamp: Date.now(),
        path: req.originalUrl,
        method: req.method
    };

    // 开发环境显示详细错误信息
    if (config.server.env === 'development') {
        errorResponse.error = {
            message: err.message,
            stack: err.stack
        };
    }

    // 发送错误响应
    res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;

