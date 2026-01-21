/**
 * API服务封装
 * 统一管理所有API调用，支持本地数据和远程API两种模式
 */

const config = require('../config/api');
const SecurityUtils = require('./security');
const ErrorHandler = require('./errorHandler');

class ApiService {
    constructor() {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.retryAttempts = config.retryAttempts;
        this.useLocalData = config.useLocalData; // 是否使用本地数据
    }

    buildQueryString(params = {}) {
        if (!params || typeof params !== 'object') return '';
        const parts = [];
        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    if (v === undefined || v === null || v === '') return;
                    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
                });
                return;
            }
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        });
        return parts.join('&');
    }

    /**
     * 通用HTTP请求方法
     * @param {Object} options 请求选项
     * @returns {Promise<any>} 响应数据
     */
    async request(options) {
        const {
            url,
            method = 'GET',
            data = null,
            header = {},
            retryCount = 0,
            silent = false
        } = options;

        // 如果使用本地数据，直接返回模拟数据
        if (this.useLocalData) {
            return this.getLocalData(url, method, data);
        }

        try {
            // 数据安全验证
            if (data) {
                const validationResult = this.validateRequestData(data, method, url);
                if (!validationResult.isValid) {
                    throw new Error(`数据验证失败: ${validationResult.message}`);
                }
            }

            const requestOptions = {
                url: `${this.baseURL}${url}`,
                method,
                data: data ? this.sanitizeData(data) : null,
                header: {
                    'Content-Type': 'application/json',
                    ...this.getSecurityHeaders(),
                    ...header
                },
                timeout: this.timeout
            };

            console.log(`[API请求] ${method} ${url}`, data);

            const response = await this.wxRequest(requestOptions);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                console.log(`[API响应] ${method} ${url}`, response.data);
                return response.data;
            } else {
                const error = new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`);
                error.statusCode = response.statusCode;
                error.data = response.data;
                throw error;
            }
        } catch (error) {
            console.error(`[API错误] ${method} ${url}`, error);

            // 使用错误处理器处理错误
            const errorInfo = ErrorHandler.handleApiError(error, {
                url,
                method,
                data,
                retryCount
            });

            // 重试逻辑
            if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
                console.log(`[API重试] ${method} ${url} 第${retryCount + 1}次重试`);
                await this.delay(1000 * (retryCount + 1)); // 递增延迟
                return this.request({ ...options, retryCount: retryCount + 1 });
            }

            // 显示错误信息
            if (!silent) {
                ErrorHandler.showError(errorInfo);
            }
            throw error;
        }
    }

    /**
     * 微信小程序请求封装
     * @param {Object} options 请求选项
     * @returns {Promise<any>} 响应数据
     */
    wxRequest(options) {
        return new Promise((resolve, reject) => {
            wx.request({
                ...options,
                success: resolve,
                fail: reject
            });
        });
    }

    /**
     * 延迟函数
     * @param {number} ms 延迟毫秒数
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取安全请求头
     * @returns {Object} 安全请求头
     */
    getSecurityHeaders() {
        return {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Client-Version': '1.0.0',
            'X-Request-ID': SecurityUtils.generateRandomString(16)
        };
    }

    /**
     * 验证请求数据
     * @param {Object} data 请求数据
     * @param {string} method 请求方法
     * @param {string} url 请求URL
     * @returns {Object} 验证结果
     */
    validateRequestData(data, method, url) {
        // 基础验证规则
        const rules = {
            openid: {
                required: url.includes('/user/'),
                type: 'string',
                minLength: 1,
                maxLength: 50
            },
            nickname: {
                required: url.includes('/user/'),
                type: 'string',
                minLength: 1,
                maxLength: 100,
                checkSecurity: true
            },
            content: {
                required: url.includes('/comments/') || url.includes('/reviews'),
                type: 'string',
                minLength: 1,
                maxLength: 500,
                checkSecurity: true
            },
            amount: {
                required: url.includes('/donate'),
                type: 'number',
                min: 0.01,
                max: 10000
            },
            rating: {
                required: url.includes('/reviews'),
                type: 'integer',
                min: 1,
                max: 5
            }
        };

        return SecurityUtils.validateData(data, rules);
    }

    /**
     * 清理数据
     * @param {Object} data 原始数据
     * @returns {Object} 清理后的数据
     */
    sanitizeData(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = SecurityUtils.sanitizeInput(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeData(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * 判断是否应该重试
     * @param {Error} error 错误对象
     * @returns {boolean} 是否应该重试
     */
    shouldRetry(error) {
        // 网络错误和超时错误可以重试
        if (error.errMsg) {
            return error.errMsg.includes('request:fail') ||
                error.errMsg.includes('timeout');
        }

        // 5xx服务器错误可以重试
        if (error.statusCode >= 500) {
            return true;
        }

        // 429限流错误可以重试
        if (error.statusCode === 429) {
            return true;
        }

        return false;
    }

    /**
     * 获取本地数据（兼容模式）
     * @param {string} url API路径
     * @param {string} method 请求方法
     * @param {any} data 请求数据
     * @returns {Promise<any>} 本地数据
     */
    async getLocalData(url, method, data) {
        // 导入本地数据服务
        const dataService = require('./dataService');

        // 根据URL路径返回对应的本地数据
        if (url.includes('/user/login')) {
            return {
                code: 200,
                message: '登录成功',
                data: {
                    id: 1,
                    openid: data?.openid || 'test_openid',
                    nickname: data?.nickname || '测试用户',
                    avatar_url: data?.avatar_url || '/image/dog.png',
                    created_at: new Date().toISOString()
                },
                timestamp: Date.now()
            };
        } else if (url.includes('/animals')) {
            const animals = await dataService.getAnimals();
            return {
                code: 200,
                message: '获取动物列表成功',
                data: animals,
                timestamp: Date.now()
            };
        } else if (url.includes('/products')) {
            const products = await dataService.getProducts();
            return {
                code: 200,
                message: '获取商品列表成功',
                data: products,
                timestamp: Date.now()
            };
        } else if (url.includes('/donations')) {
            const donations = await dataService.getDonations();
            return {
                code: 200,
                message: '获取捐赠项目列表成功',
                data: donations,
                timestamp: Date.now()
            };
        } else if (url.includes('/notices')) {
            const notices = await dataService.getNotices();
            return {
                code: 200,
                message: '获取公告列表成功',
                data: notices,
                timestamp: Date.now()
            };
        } else if (url.includes('/comments')) {
            const animalId = url.match(/\/comments\/animal\/(\d+)/)?.[1];
            const comments = await dataService.getComments(animalId ? parseInt(animalId) : null);
            return {
                code: 200,
                message: '获取评论列表成功',
                data: comments,
                timestamp: Date.now()
            };
        }

        // 默认返回空数据
        return {
            code: 200,
            message: 'success',
            data: [],
            timestamp: Date.now()
        };
    }

    // ==================== 用户相关API ====================

    /**
     * 用户登录/注册
     * @param {Object} userData 用户数据
     * @returns {Promise<any>} 用户信息
     */
    async loginUser(userData) {
        return this.request({
            url: '/user/login',
            method: 'POST',
            data: userData
        });
    }

    async wechatLogin(payload) {
        return this.request({
            url: '/wechat/login',
            method: 'POST',
            data: payload
        });
    }

    /**
     * 获取用户信息
     * @param {string} openid 用户openid
     * @returns {Promise<any>} 用户信息
     */
    async getUserInfo(openid) {
        const options = arguments.length > 1 ? arguments[1] : {};
        return this.request({
            url: `/user/info?openid=${openid}`,
            method: 'GET',
            silent: Boolean(options?.silent)
        });
    }

    /**
     * 更新用户信息
     * @param {Object} userData 用户数据
     * @returns {Promise<any>} 更新结果
     */
    async updateUserInfo(userData) {
        return this.request({
            url: '/user/info',
            method: 'PUT',
            data: userData
        });
    }

    /**
     * 获取用户统计信息
     * @param {number} userId 用户ID
     * @returns {Promise<any>} 统计信息
     */
    async getUserStats(userId) {
        const options = arguments.length > 1 ? arguments[1] : {};
        return this.request({
            url: `/user/stats/${userId}`,
            method: 'GET',
            silent: Boolean(options?.silent)
        });
    }

    /**
     * 获取用户排名
     * @param {number} limit 排名数量
     * @returns {Promise<any>} 排名列表
     */
    async getUserRanking(limit = 10) {
        return this.request({
            url: `/user/ranking?limit=${limit}`,
            method: 'GET'
        });
    }

    // ==================== 动物相关API ====================

    /**
     * 获取动物列表
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 动物列表
     */
    async getAnimals(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/animals${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 获取动物详情
     * @param {number} id 动物ID
     * @returns {Promise<any>} 动物详情
     */
    async getAnimalDetail(id) {
        return this.request({
            url: `/animals/${id}`,
            method: 'GET'
        });
    }

    /**
     * 获取热门动物
     * @param {number} limit 数量限制
     * @returns {Promise<any>} 热门动物列表
     */
    async getPopularAnimals(limit = 5) {
        return this.request({
            url: `/animals/popular?limit=${limit}`,
            method: 'GET'
        });
    }

    /**
     * 搜索动物
     * @param {string} keyword 搜索关键词
     * @param {Object} options 搜索选项
     * @returns {Promise<any>} 搜索结果
     */
    async searchAnimals(keyword, options = {}) {
        const params = { keyword, ...options };
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/animals/search?${queryString}`,
            method: 'GET'
        });
    }

    // ==================== 商品相关API ====================

    /**
     * 获取商品列表
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 商品列表
     */
    async getProducts(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/products${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 获取商品详情
     * @param {number} id 商品ID
     * @returns {Promise<any>} 商品详情
     */
    async getProductDetail(id) {
        return this.request({
            url: `/products/${id}`,
            method: 'GET'
        });
    }

    /**
     * 获取商品评价
     * @param {number} id 商品ID
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 商品评价
     */
    async getProductReviews(id, params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/products/${id}/reviews${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 添加商品评价
     * @param {number} id 商品ID
     * @param {Object} reviewData 评价数据
     * @returns {Promise<any>} 创建结果
     */
    async createProductReview(id, reviewData) {
        return this.request({
            url: `/products/${id}/reviews`,
            method: 'POST',
            data: reviewData
        });
    }

    // ==================== 捐赠相关API ====================

    /**
     * 获取捐赠项目列表
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 捐赠项目列表
     */
    async getDonations(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/donations${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 获取捐赠项目详情
     * @param {number} id 捐赠项目ID
     * @returns {Promise<any>} 捐赠项目详情
     */
    async getDonationDetail(id) {
        return this.request({
            url: `/donations/${id}`,
            method: 'GET'
        });
    }

    /**
     * 创建捐赠记录
     * @param {number} id 捐赠项目ID
     * @param {Object} donationData 捐赠数据
     * @returns {Promise<any>} 创建结果
     */
    async createDonation(id, donationData) {
        return this.request({
            url: `/donations/${id}/donate`,
            method: 'POST',
            data: donationData
        });
    }

    async createDonationPrepay(id, payload) {
        return this.request({
            url: `/pay/donation/${id}/prepay`,
            method: 'POST',
            data: payload
        });
    }

    async confirmDonationPay(id, payload) {
        return this.request({
            url: `/pay/donation/${id}/confirm`,
            method: 'POST',
            data: payload
        });
    }

    async createOrderPrepay(payload) {
        return this.request({
            url: `/pay/order/prepay`,
            method: 'POST',
            data: payload
        });
    }

    /**
     * 获取用户捐赠记录
     * @param {number} userId 用户ID
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 捐赠记录
     */
    async getUserDonations(userId, params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/donations/user/${userId}${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    // ==================== 评论相关API ====================

    /**
     * 获取动物评论
     * @param {number} animalId 动物ID
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 评论列表
     */
    async getAnimalComments(animalId, params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/comments/animal/${animalId}${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 创建评论
     * @param {number} animalId 动物ID
     * @param {Object} commentData 评论数据
     * @returns {Promise<any>} 创建结果
     */
    async createComment(animalId, commentData) {
        return this.request({
            url: `/comments/animal/${animalId}`,
            method: 'POST',
            data: commentData
        });
    }

    /**
     * 回复评论
     * @param {number} commentId 评论ID
     * @param {Object} replyData 回复数据
     * @returns {Promise<any>} 创建结果
     */
    async replyComment(commentId, replyData) {
        return this.request({
            url: `/comments/${commentId}/reply`,
            method: 'POST',
            data: replyData
        });
    }

    // ==================== 公告相关API ====================

    /**
     * 获取公告列表
     * @param {Object} params 查询参数
     * @returns {Promise<any>} 公告列表
     */
    async getNotices(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request({
            url: `/notices${queryString ? '?' + queryString : ''}`,
            method: 'GET'
        });
    }

    /**
     * 获取公告详情
     * @param {number} id 公告ID
     * @returns {Promise<any>} 公告详情
     */
    async getNoticeDetail(id) {
        return this.request({
            url: `/notices/${id}`,
            method: 'GET'
        });
    }

    // ==================== 统计相关API ====================

    /**
     * 获取动物统计信息
     * @returns {Promise<any>} 统计信息
     */
    async getAnimalStats() {
        return this.request({
            url: '/animals/stats/overview',
            method: 'GET'
        });
    }

    /**
     * 获取商品统计信息
     * @returns {Promise<any>} 统计信息
     */
    async getProductStats() {
        return this.request({
            url: '/products/stats/overview',
            method: 'GET'
        });
    }

    /**
     * 获取捐赠统计信息
     * @returns {Promise<any>} 统计信息
     */
    async getDonationStats() {
        return this.request({
            url: '/donations/stats/overview',
            method: 'GET'
        });
    }
}

// 创建单例实例
const apiService = new ApiService();
module.exports = apiService;
