/**
 * 日志管理工具
 * 统一管理小程序中的日志输出，避免重复和性能问题
 */

const systemInfoManager = require('./systemInfo');

class Logger {
    constructor() {
        this.isDev = systemInfoManager.isDevTools();
        this.logCache = new Map();
        this.cacheTimeout = 1000; // 1秒内相同日志只输出一次
    }

    /**
     * 通用日志方法
     * @param {string} level 日志级别
     * @param {string} message 日志消息
     * @param {any} data 附加数据
     */
    log(level, message, data = null) {
        if (!this.isDev) return;

        const key = `${level}:${message}`;
        const now = Date.now();

        // 检查是否在缓存时间内
        if (this.logCache.has(key)) {
            const lastTime = this.logCache.get(key);
            if (now - lastTime < this.cacheTimeout) {
                return; // 跳过重复日志
            }
        }

        // 更新缓存
        this.logCache.set(key, now);

        // 输出日志
        const logData = data ? [message, data] : [message];
        console[level](...logData);
    }

    /**
     * 信息日志
     * @param {string} message 消息
     * @param {any} data 数据
     */
    info(message, data = null) {
        this.log('log', message, data);
    }

    /**
     * 警告日志
     * @param {string} message 消息
     * @param {any} data 数据
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * 错误日志
     * @param {string} message 消息
     * @param {any} data 数据
     */
    error(message, data = null) {
        this.log('error', message, data);
    }

    /**
     * 调试日志
     * @param {string} message 消息
     * @param {any} data 数据
     */
    debug(message, data = null) {
        this.log('log', `[DEBUG] ${message}`, data);
    }

    /**
     * 页面生命周期日志
     * @param {string} pageName 页面名称
     * @param {string} action 动作
     */
    pageLifecycle(pageName, action) {
        this.info(`${pageName} ${action}`);
    }

    /**
     * API请求日志
     * @param {string} method 请求方法
     * @param {string} url 请求URL
     * @param {any} data 请求数据
     */
    apiRequest(method, url, data = null) {
        this.debug(`API请求: ${method} ${url}`, data);
    }

    /**
     * API响应日志
     * @param {string} method 请求方法
     * @param {string} url 请求URL
     * @param {number} statusCode 状态码
     * @param {any} data 响应数据
     */
    apiResponse(method, url, statusCode, data = null) {
        const level = statusCode >= 400 ? 'error' : 'debug';
        this.log(level, `API响应: ${method} ${url} ${statusCode}`, data);
    }

    /**
     * 性能日志
     * @param {string} operation 操作名称
     * @param {number} duration 耗时（毫秒）
     */
    performance(operation, duration) {
        if (duration > 1000) {
            this.warn(`性能警告: ${operation} 耗时 ${duration}ms`);
        } else {
            this.debug(`性能: ${operation} 耗时 ${duration}ms`);
        }
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.logCache.clear();
    }
}

// 创建单例实例
const logger = new Logger();

module.exports = logger;
