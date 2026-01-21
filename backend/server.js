/**
 * 校园流浪动物守护小程序后端API服务器
 * 主服务器文件
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 导入配置和工具
const config = require('./config/config');
const logger = require('./utils/logger');
const { initDatabase, checkConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// 导入路由
const routes = require('./routes');

class Server {
    constructor() {
        this.app = express();
        this.port = config.server.port;
        this.host = config.server.host;

        this.init();
    }

    /**
     * 初始化服务器
     */
    async init() {
        try {
            // 验证配置
            config.validateConfig();

            // 初始化数据库
            await initDatabase();

            // 设置中间件
            this.setupMiddleware();

            // 设置路由
            this.setupRoutes();

            // 设置错误处理
            this.setupErrorHandling();

            logger.info('服务器初始化完成');
        } catch (error) {
            logger.error('服务器初始化失败', {
                error: error.message,
                stack: error.stack
            });
            process.exit(1);
        }
    }

    /**
     * 设置中间件
     */
    setupMiddleware() {
        // 安全中间件
        this.app.use(helmet({
            contentSecurityPolicy: false, // 小程序不需要CSP
            crossOriginEmbedderPolicy: false
        }));

        // CORS配置
        this.app.use(cors(config.security.cors));

        // 请求压缩
        this.app.use(compression());

        // 请求日志
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // 请求体解析
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 请求频率限制
        const limiter = rateLimit({
            windowMs: config.security.rateLimit.windowMs,
            max: config.security.rateLimit.maxRequests,
            message: {
                code: 429,
                message: '请求过于频繁，请稍后再试',
                timestamp: Date.now()
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api', limiter);

        // 请求时间记录
        this.app.use((req, res, next) => {
            const start = Date.now();
            const originalWriteHead = res.writeHead;
            res.writeHead = function (...args) {
                const duration = Date.now() - start;
                if (!res.headersSent && !res.getHeader('X-Response-Time')) {
                    res.setHeader('X-Response-Time', `${duration}ms`);
                }
                return originalWriteHead.apply(this, args);
            };
            res.on('finish', () => {
                logger.response(req, res);
            });
            next();
        });
    }

    /**
     * 设置路由
     */
    setupRoutes() {
        // 健康检查
        this.app.get('/health', async (req, res) => {
            try {
                const dbStatus = await checkConnection();
                res.json({
                    code: 200,
                    message: '服务正常',
                    data: {
                        status: 'healthy',
                        database: dbStatus ? 'connected' : 'disconnected',
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime()
                    }
                });
            } catch (error) {
                res.status(500).json({
                    code: 500,
                    message: '服务异常',
                    data: {
                        status: 'unhealthy',
                        error: error.message
                    }
                });
            }
        });

        // API路由
        this.app.use(config.api.prefix, routes);

        // 404处理
        this.app.use('*', (req, res) => {
            res.status(404).json({
                code: 404,
                message: '接口不存在',
                data: {
                    path: req.originalUrl,
                    method: req.method
                }
            });
        });
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    /**
     * 启动服务器
     */
    start() {
        this.server = this.app.listen(this.port, this.host, () => {
            logger.info(`服务器启动成功`, {
                host: this.host,
                port: this.port,
                env: config.server.env,
                pid: process.pid
            });
        });

        // 优雅关闭
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
    }

    /**
     * 关闭服务器
     */
    async shutdown(signal) {
        logger.info(`收到${signal}信号，开始优雅关闭服务器`);

        this.server.close(async () => {
            logger.info('HTTP服务器已关闭');

            try {
                const { closeDatabase } = require('./config/database');
                await closeDatabase();
                logger.info('数据库连接已关闭');
            } catch (error) {
                logger.error('关闭数据库连接时出错', { error: error.message });
            }

            logger.info('服务器已完全关闭');
            process.exit(0);
        });

        // 强制关闭超时
        setTimeout(() => {
            logger.error('强制关闭服务器');
            process.exit(1);
        }, 10000);
    }
}

// 启动服务器
const server = new Server();
server.start();

module.exports = server;

