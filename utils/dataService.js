/**
 * 数据服务类 - 统一数据访问层
 * 支持本地数据和远程API两种模式
 */

// 导入API服务
const apiService = require('./apiService');

// 导入本地数据文件（兼容模式）
const animalsData = require('../data/animals.js');
const donationsData = require('../data/donations.js');
const commentsData = require('../data/comments.js');
const noticesData = require('../data/notices.js');
const productsData = require('../data/products.js');
const productReviewsData = require('../data/product_reviews.js');

class DataService {
    constructor() {
        this.cache = new Map(); // 数据缓存
        this.storageBackedTypes = new Set(['comments', 'donations']);
        this.dataMap = {
            animals: animalsData,
            donations: donationsData,
            comments: commentsData,
            notices: noticesData,
            products: productsData,
            productReviews: productReviewsData
        };
        this.useApi = !apiService.useLocalData; // 是否使用API
    }

    parseJsonArray(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    normalizeAnimal(animal) {
        if (!animal) return null;
        const genderMap = { 0: '未知', 1: '公', 2: '母' };
        const statusMap = {
            healthy: '健康',
            sick: '生病',
            injured: '受伤',
            recovered: '康复'
        };
        const months = Number(animal.age_months);
        const age = Number.isFinite(months) && months > 0 ? `${Math.max(1, Math.round(months / 12))}岁` : '';

        return {
            id: animal.id,
            name: animal.name,
            gender: genderMap[animal.gender] || '未知',
            age,
            breed: animal.species === 'cat' ? '猫咪' : animal.species === 'dog' ? '狗狗' : '其他',
            sterilized: Boolean(animal.sterilized),
            status: statusMap[animal.health_status] || '未知',
            description: animal.description || '',
            image: animal.image_url || '/image/dog.png',
            location: animal.location || '',
            healthRecords: [],
            createTime: animal.created_at || '',
            updateTime: animal.updated_at || ''
        };
    }

    normalizeProduct(product) {
        if (!product) return null;
        const images = this.parseJsonArray(product.images);
        const image = product.image_url || (images[0] || '/image/dog.png');
        return {
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            originalPrice: Number(product.original_price) || 0,
            image,
            images: images.length > 0 ? images : [image],
            description: product.description || '',
            details: product.details || product.description || '',
            features: Array.isArray(product.features) ? product.features : [],
            stock: Number(product.stock) || 0,
            sales: Number(product.sales) || 0,
            rating: Number(product.avg_rating || product.rating) || 0,
            reviewCount: Number(product.review_count) || 0,
            category: product.category || '',
            tags: Array.isArray(product.tags) ? product.tags : [],
            createTime: product.created_at || '',
            updateTime: product.updated_at || ''
        };
    }

    normalizeNotice(notice) {
        if (!notice) return null;
        return {
            id: notice.id,
            title: notice.title,
            content: notice.content,
            type: notice.type,
            priority: notice.priority,
            status: notice.status,
            createTime: notice.created_at || notice.createTime || '',
            icon: notice.icon || '',
            color: notice.color || '',
            bgColor: notice.bg_color || notice.bgColor || ''
        };
    }

    normalizeComment(comment) {
        if (!comment) return null;
        return {
            id: comment.id,
            animalId: comment.animal_id,
            userId: comment.user_id,
            userName: comment.user_name || '匿名用户',
            avatar: comment.user_avatar || '/image/dog.png',
            content: comment.content || '',
            likes: 0,
            createTime: comment.created_at || ''
        };
    }

    normalizeDonation(donation) {
        if (!donation) return null;
        const statusMap = {
            active: '进行中',
            completed: '已完成',
            cancelled: '已取消'
        };
        return {
            id: donation.id,
            animalId: donation.animal_id,
            title: donation.title,
            description: donation.description || '',
            targetAmount: Number(donation.target_amount) || 0,
            currentAmount: Number(donation.current_amount) || 0,
            image: donation.image_url || donation.animal_image || '/image/dog.png',
            status: statusMap[donation.status] || donation.status || '',
            startDate: donation.start_date || '',
            endDate: donation.end_date || '',
            createTime: donation.created_at || ''
        };
    }

    getCachedUser() {
        try {
            const user = wx.getStorageSync('user');
            return user && user.id ? user : null;
        } catch (error) {
            return null;
        }
    }

    async ensureUser() {
        const cached = this.getCachedUser();
        if (cached) {
            if (!this.useApi) return cached;

            const openid = (() => {
                try {
                    return wx.getStorageSync('openid') || '';
                } catch (error) {
                    return '';
                }
            })();

            if (openid) {
                try {
                    const response = await apiService.getUserInfo(openid, { silent: true });
                    const user = response?.data || null;
                    if (user && user.id) {
                        wx.setStorageSync('user', user);
                        return user;
                    }
                } catch (error) {
                    if (error && error.statusCode === 404) {
                        try {
                            wx.removeStorageSync('user');
                            wx.removeStorageSync('openid');
                        } catch (e) {}
                    } else {
                        return cached;
                    }
                }
            } else {
                try {
                    await apiService.getUserStats(cached.id, { silent: true });
                    return cached;
                } catch (error) {
                    if (!error || error.statusCode !== 404) {
                        return cached;
                    }
                    try {
                        wx.removeStorageSync('user');
                    } catch (e) {}
                }
            }
        }

        const loginRes = await new Promise((resolve, reject) => {
            wx.login({
                success: resolve,
                fail: reject
            });
        });

        const code = loginRes?.code || `mock_${Date.now()}`;
        const result = await apiService.wechatLogin({
            code,
            nickname: '访客',
            avatar_url: '/image/dog.png'
        });

        const user = result?.data?.user || null;
        if (!user) {
            throw new Error('登录失败：未返回用户信息');
        }

        wx.setStorageSync('user', user);
        wx.setStorageSync('openid', result?.data?.openid || '');
        return user;
    }

    loadStorageData(dataType) {
        if (typeof wx === 'undefined' || !wx.getStorageSync) return null;
        if (!this.storageBackedTypes.has(dataType)) return null;
        const stored = wx.getStorageSync(dataType);
        return Array.isArray(stored) ? stored : null;
    }

    /**
     * 获取数据
     * @param {string} dataType 数据类型 (animals, donations, comments, notices)
     * @returns {Promise<Array>} 数据数组
     */
    async getData(dataType) {
        // 先检查缓存
        if (this.cache.has(dataType)) {
            return this.cache.get(dataType);
        }

        try {
            const stored = this.loadStorageData(dataType);
            const data = stored || this.dataMap[dataType] || [];
            this.cache.set(dataType, data);
            return data;
        } catch (error) {
            console.error(`获取${dataType}数据异常:`, error);
            return [];
        }
    }

    /**
     * 根据ID获取单个数据
     * @param {string} dataType 数据类型
     * @param {number} id 数据ID
     * @returns {Promise<Object|null>} 数据对象
     */
    async getById(dataType, id) {
        const data = await this.getData(dataType);
        return data.find(item => item.id === id) || null;
    }

    /**
     * 根据条件过滤数据
     * @param {string} dataType 数据类型
     * @param {Function} filterFn 过滤函数
     * @returns {Promise<Array>} 过滤后的数据
     */
    async filter(dataType, filterFn) {
        const data = await this.getData(dataType);
        return data.filter(filterFn);
    }

    /**
     * 获取动物数据
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 动物列表
     */
    async getAnimals(params = {}) {
        if (this.useApi) {
            try {
                const response = await apiService.getAnimals(params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map(item => this.normalizeAnimal(item)).filter(Boolean);
            } catch (error) {
                console.error('获取动物数据失败:', error);
                throw error;
            }
        }
        return await this.getData('animals');
    }

    /**
     * 根据ID获取动物
     * @param {number} id 动物ID
     * @returns {Promise<Object|null>} 动物对象
     */
    async getAnimalById(id) {
        if (this.useApi) {
            try {
                const response = await apiService.getAnimalDetail(id);
                return this.normalizeAnimal(response.data);
            } catch (error) {
                console.error('获取动物详情失败:', error);
                throw error;
            }
        }
        return await this.getById('animals', id);
    }

    /**
     * 获取捐款项目
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 捐款项目列表
     */
    async getDonations(params = {}) {
        if (this.useApi) {
            try {
                const response = await apiService.getDonations(params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map(item => this.normalizeDonation(item)).filter(Boolean);
            } catch (error) {
                console.error('获取捐赠项目失败:', error);
                throw error;
            }
        }
        return await this.getData('donations');
    }

    /**
     * 根据动物ID获取捐款项目
     * @param {number} animalId 动物ID
     * @returns {Promise<Array>} 捐款项目列表
     */
    async getDonationsByAnimalId(animalId) {
        return await this.filter('donations', item => item.animalId === animalId);
    }

    /**
     * 获取评论数据
     * @param {number} animalId 动物ID
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 评论列表
     */
    async getComments(animalId, params = {}) {
        if (this.useApi && animalId) {
            try {
                const response = await apiService.getAnimalComments(animalId, params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map(item => this.normalizeComment(item)).filter(Boolean);
            } catch (error) {
                console.error('获取评论数据失败:', error);
                throw error;
            }
        }
        if (animalId) {
            return await this.filter('comments', item => item.animalId === animalId);
        }
        return await this.getData('comments');
    }

    /**
     * 获取公告数据
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 公告列表
     */
    async getNotices(params = {}) {
        if (this.useApi) {
            try {
                const response = await apiService.getNotices(params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map(item => this.normalizeNotice(item)).filter(Boolean);
            } catch (error) {
                console.error('获取公告数据失败:', error);
                throw error;
            }
        }
        return await this.getData('notices');
    }

    /**
     * 获取商品数据
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 商品列表
     */
    async getProducts(params = {}) {
        if (this.useApi) {
            try {
                const response = await apiService.getProducts(params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map(item => this.normalizeProduct(item)).filter(Boolean);
            } catch (error) {
                console.error('获取商品数据失败:', error);
                throw error;
            }
        }
        return await this.getData('products');
    }

    /**
     * 根据ID获取商品
     * @param {number} id 商品ID
     * @returns {Promise<Object|null>} 商品对象
     */
    async getProductById(id) {
        if (this.useApi) {
            try {
                const response = await apiService.getProductDetail(id);
                return this.normalizeProduct(response.data);
            } catch (error) {
                console.error('获取商品详情失败:', error);
                throw error;
            }
        }
        return await this.getById('products', id);
    }

    /**
     * 获取商品评价
     * @param {number} productId 商品ID
     * @param {Object} params 查询参数
     * @returns {Promise<Array>} 评价列表
     */
    async getProductReviews(productId, params = {}) {
        if (this.useApi && productId) {
            try {
                const response = await apiService.getProductReviews(productId, params);
                const list = Array.isArray(response.data) ? response.data : [];
                return list.map((review) => ({
                    id: review.id,
                    productId: review.product_id,
                    userId: review.user_id,
                    userName: review.user_name || '匿名用户',
                    avatar: review.user_avatar || '/image/dog.png',
                    rating: review.rating,
                    content: review.content || '',
                    images: this.parseJsonArray(review.images),
                    likes: 0,
                    createTime: review.created_at || ''
                }));
            } catch (error) {
                console.error('获取商品评价失败:', error);
                throw error;
            }
        }
        if (productId) {
            return await this.filter('productReviews', item => item.productId === productId);
        }
        return await this.getData('productReviews');
    }

    /**
     * 清除缓存
     * @param {string} dataType 数据类型，不传则清除所有缓存
     */
    clearCache(dataType) {
        if (dataType) {
            this.cache.delete(dataType);
        } else {
            this.cache.clear();
        }
    }

    /**
     * 模拟添加评论（实际无法修改JSON文件）
     * 这里使用本地存储模拟
     * @param {Object} comment 评论对象
     * @returns {Promise<boolean>} 是否成功
     */
    async addComment(comment) {
        try {
            if (this.useApi) {
                const user = await this.ensureUser();
                const payload = {
                    user_id: comment.user_id || user.id,
                    content: comment.content
                };
                if (comment.parent_id) payload.parent_id = comment.parent_id;

                const response = await apiService.createComment(comment.animalId, payload);
                return response && (response.code === 201 || response.code === 200);
            }

            // 获取现有评论
            const comments = await this.getComments();

            // 添加新评论
            const newComment = {
                ...comment,
                id: Date.now(), // 使用时间戳作为ID
                createTime: new Date().toISOString()
            };

            comments.unshift(newComment);

            // 保存到本地存储
            wx.setStorageSync('comments', comments);

            // 更新缓存
            this.cache.set('comments', comments);

            return true;
        } catch (error) {
            console.error('添加评论失败:', error);
            return false;
        }
    }

    /**
     * 模拟更新捐款金额（实际无法修改JSON文件）
     * 这里使用本地存储模拟
     * @param {number} donationId 捐款项目ID
     * @param {number} amount 捐款金额
     * @returns {Promise<boolean>} 是否成功
     */
    async updateDonationAmount(donationId, amount) {
        if (this.useApi) {
            try {
                return await this.payDonation(donationId, amount);
            } catch (error) {
                console.error('API更新捐款金额失败:', error);
                throw error;
            }
        }

        try {
            // 获取现有捐款项目
            const donations = await this.getDonations();
            const donation = donations.find(item => item.id === donationId);

            if (donation) {
                donation.currentAmount = Math.min(donation.currentAmount + amount, donation.targetAmount);

                // 检查是否完成
                if (donation.currentAmount >= donation.targetAmount) {
                    donation.status = '已完成';
                }

                // 保存到本地存储
                wx.setStorageSync('donations', donations);

                // 更新缓存
                this.cache.set('donations', donations);

                return true;
            }

            return false;
        } catch (error) {
            console.error('更新捐款金额失败:', error);
            return false;
        }
    }

    async payDonation(donationId, amount) {
        const user = await this.ensureUser();
        const prepay = await apiService.createDonationPrepay(donationId, {
            user_id: user.id,
            amount: Number(amount)
        });

        const recordId = prepay?.data?.record_id;
        const payment = prepay?.data?.payment;
        const isMock = Boolean(prepay?.data?.mock);

        if (isMock || !payment) {
            if (recordId) {
                await apiService.confirmDonationPay(donationId, { record_id: recordId });
            }
            return true;
        }

        await new Promise((resolve, reject) => {
            wx.requestPayment({
                ...payment,
                success: resolve,
                fail: reject
            });
        });

        if (recordId) {
            await apiService.confirmDonationPay(donationId, { record_id: recordId });
        }
        return true;
    }

    async payOrder(productId, quantity) {
        const user = await this.ensureUser();
        const prepay = await apiService.createOrderPrepay({
            user_id: user.id,
            product_id: productId,
            quantity
        });

        const payment = prepay?.data?.payment;
        const isMock = Boolean(prepay?.data?.mock);
        if (isMock || !payment) {
            return prepay?.data?.order || null;
        }

        await new Promise((resolve, reject) => {
            wx.requestPayment({
                ...payment,
                success: resolve,
                fail: reject
            });
        });

        return prepay?.data?.order || null;
    }

    // ==================== 新增API方法 ====================

    /**
     * 用户登录/注册
     * @param {Object} userData 用户数据
     * @returns {Promise<any>} 用户信息
     */
    async loginUser(userData) {
        if (this.useApi) {
            try {
                const response = await apiService.loginUser(userData);
                return response.data;
            } catch (error) {
                console.error('用户登录失败:', error);
                throw error;
            }
        }

        // 本地模式返回模拟数据
        return {
            id: 1,
            openid: userData.openid,
            nickname: userData.nickname,
            avatar_url: userData.avatar_url || '/image/dog.png',
            created_at: new Date().toISOString()
        };
    }

    /**
     * 获取用户统计信息
     * @param {number} userId 用户ID
     * @returns {Promise<any>} 统计信息
     */
    async getUserStats(userId) {
        if (this.useApi) {
            try {
                const response = await apiService.getUserStats(userId);
                return response.data;
            } catch (error) {
                console.error('获取用户统计信息失败:', error);
                return null;
            }
        }

        // 本地模式返回模拟数据
        return {
            id: userId,
            nickname: '测试用户',
            total_donations: 3,
            total_amount: 150.00,
            total_orders: 2,
            total_spent: 79.80,
            total_comments: 5
        };
    }

    /**
     * 获取用户排名
     * @param {number} limit 排名数量
     * @returns {Promise<Array>} 排名列表
     */
    async getUserRanking(limit = 10) {
        if (this.useApi) {
            try {
                const response = await apiService.getUserRanking(limit);
                return response.data;
            } catch (error) {
                console.error('获取用户排名失败:', error);
                return [];
            }
        }

        // 本地模式返回模拟数据
        return [
            { id: 1, nickname: '爱心天使', total_donations: 500.00, rank: 1 },
            { id: 2, nickname: '动物守护者', total_donations: 300.00, rank: 2 },
            { id: 3, nickname: '小动物朋友', total_donations: 200.00, rank: 3 }
        ];
    }

    /**
     * 创建评论
     * @param {Object} commentData 评论数据
     * @returns {Promise<boolean>} 是否成功
     */
    async createComment(commentData) {
        if (this.useApi) {
            try {
                const response = await apiService.createComment(commentData.animalId, commentData);
                return response.code === 201;
            } catch (error) {
                console.error('创建评论失败:', error);
                return false;
            }
        }

        // 本地模式使用原有逻辑
        return await this.addComment(commentData);
    }

    /**
     * 创建商品评价
     * @param {Object} reviewData 评价数据
     * @returns {Promise<boolean>} 是否成功
     */
    async createProductReview(reviewData) {
        if (this.useApi) {
            try {
                const response = await apiService.createProductReview(reviewData.productId, reviewData);
                return response.code === 201;
            } catch (error) {
                console.error('创建商品评价失败:', error);
                return false;
            }
        }

        // 本地模式返回成功
        return true;
    }
}

// 创建单例实例
const dataService = new DataService();

module.exports = dataService;
