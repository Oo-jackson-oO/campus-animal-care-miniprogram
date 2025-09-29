/**
 * 评论相关路由
 * 处理动物评论查询、创建等操作
 */

const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { commentValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * 获取动物评论列表
 * GET /api/comments/animal/:id?page=1&limit=10
 */
router.get('/animal/:id', commentValidation.getList, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const comments = await Comment.prototype.getAnimalComments(parseInt(id), {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            code: 200,
            message: '获取动物评论成功',
            data: comments.data,
            pagination: comments.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 创建评论
 * POST /api/comments/animal/:id
 */
router.post('/animal/:id', commentValidation.create, async (req, res, next) => {
    try {
        const { id } = req.params;
        const commentData = {
            ...req.body,
            animal_id: parseInt(id),
            status: 1,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await Comment.prototype.create(commentData);

        res.status(201).json({
            code: 201,
            message: '创建评论成功',
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 回复评论
 * POST /api/comments/:id/reply
 */
router.post('/:id/reply', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id, content } = req.body;

        if (!user_id || !content) {
            return res.status(400).json({
                code: 400,
                message: '用户ID和回复内容不能为空',
                timestamp: Date.now()
            });
        }

        const replyData = {
            user_id: parseInt(user_id),
            content: content.trim(),
            parent_id: parseInt(id),
            status: 1,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await Comment.prototype.create(replyData);

        res.status(201).json({
            code: 201,
            message: '回复评论成功',
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

