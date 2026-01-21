/**
 * API配置文件
 * 统一管理API相关配置
 */

module.exports = {
    // API基础配置
    baseURL: 'http://127.0.0.1:3000/api',
    timeout: 30000, // 30秒超时
    retryAttempts: 3, // 重试次数

    // 数据源配置
    useLocalData: false,

    // 请求配置
    request: {
        header: {
            'Content-Type': 'application/json'
        }
    },

    // 响应配置
    response: {
        successCode: 200, // 成功状态码
        errorCodes: [400, 401, 403, 404, 500] // 错误状态码
    },

    // 缓存配置
    cache: {
        enabled: true, // 是否启用缓存
        ttl: 300000, // 缓存时间（5分钟）
        maxSize: 100 // 最大缓存条目数
    },

    // 分页配置
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100
    },

    // 环境配置
    environments: {
        development: {
            baseURL: 'http://localhost:3000/api',
            useLocalData: true,
            timeout: 10000
        },
        production: {
            baseURL: 'https://your-api-domain.com/api',
            useLocalData: false,
            timeout: 30000
        }
    }
};

