/**
 * 商品相关路由
 * 处理商品信息查询、评价等操作
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { productValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * 获取商品列表
 * GET /api/products?page=1&limit=10&category=文创用品&status=1
 */
router.get('/', productValidation.getList, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            status
        } = req.query;

        const conditions = {};
        if (category) conditions.category = category;
        if (status !== undefined) conditions.status = parseInt(status);

        const result = await Product.prototype.paginate(conditions, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderBy: 'created_at',
            order: 'DESC'
        });

        res.json({
            code: 200,
            message: '获取商品列表成功',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取商品详情
 * GET /api/products/:id
 */
router.get('/:id', productValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.prototype.getProductDetail(parseInt(id));

        if (!product) {
            return res.status(404).json({
                code: 404,
                message: '商品不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取商品详情成功',
            data: product,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取商品评价
 * GET /api/products/:id/reviews?page=1&limit=10
 */
router.get('/:id/reviews', productValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Product.prototype.getProductReviews(parseInt(id), {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            code: 200,
            message: '获取商品评价成功',
            data: reviews.data,
            pagination: reviews.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 添加商品评价
 * POST /api/products/:id/reviews
 */
router.post('/:id/reviews', productValidation.createReview, async (req, res, next) => {
    try {
        const { id } = req.params;
        const reviewData = {
            ...req.body,
            product_id: parseInt(id),
            status: 1,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await Product.prototype.createReview(reviewData);

        res.status(201).json({
            code: 201,
            message: '添加商品评价成功',
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

