/**
 * 应用配置文件
 * 统一管理所有配置项
 */

require('dotenv').config();

const config = {
    // 服务器配置
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        env: process.env.NODE_ENV || 'development'
    },

    // 数据库配置
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'campus_animal_care',
        charset: process.env.DB_CHARSET || 'utf8mb4'
    },

    // JWT配置
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'campus-animal-care-api',
        audience: 'campus-animal-care-miniprogram'
    },

    // 文件上传配置
    upload: {
        path: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },

    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log',
        maxSize: '10m',
        maxFiles: 5
    },

    // 微信小程序配置
    wechat: {
        appId: process.env.WECHAT_APPID || '',
        secret: process.env.WECHAT_SECRET || '',
        apiUrl: 'https://api.weixin.qq.com'
    },

    // 安全配置
    security: {
        // 请求频率限制
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15分钟
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        },
        // CORS配置
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
            optionsSuccessStatus: 200
        },
        // 密码加密
        bcrypt: {
            saltRounds: 12
        }
    },

    // API配置
    api: {
        version: 'v1',
        prefix: '/api',
        timeout: 30000, // 30秒
        retryAttempts: 3
    },

    // 分页配置
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100
    },

    // 缓存配置
    cache: {
        ttl: 300, // 5分钟
        maxKeys: 1000
    }
};

// 验证必需配置
function validateConfig() {
    const required = [
        'database.host',
        'database.user',
        'database.name',
        'jwt.secret'
    ];

    const missing = required.filter(key => {
        const value = key.split('.').reduce((obj, k) => obj?.[k], config);
        return !value;
    });

    if (missing.length > 0) {
        throw new Error(`缺少必需配置: ${missing.join(', ')}`);
    }
}

// 开发环境特殊配置
if (config.server.env === 'development') {
    config.logging.level = 'debug';
    config.security.cors.origin = '*';
}

// 生产环境特殊配置
if (config.server.env === 'production') {
    config.logging.level = 'warn';
    config.security.rateLimit.maxRequests = 50;
}

module.exports = {
    ...config,
    validateConfig
};

