/**
 * 公告相关路由
 * 处理公告查询、创建等操作
 */

const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { noticeValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

const noticeModel = new Notice();

/**
 * 获取公告列表
 * GET /api/notices?page=1&limit=10&type=urgent&status=active
 */
router.get('/', noticeValidation.getList, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            status
        } = req.query;

        const conditions = {};
        if (type) conditions.type = type;
        if (status) conditions.status = status;

        const result = await noticeModel.paginate(conditions, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderBy: 'priority',
            order: 'DESC'
        });

        res.json({
            code: 200,
            message: '获取公告列表成功',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取公告详情
 * GET /api/notices/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '公告ID必须是正整数',
                timestamp: Date.now()
            });
        }

        const notice = await noticeModel.findById(parseInt(id));

        if (!notice) {
            return res.status(404).json({
                code: 404,
                message: '公告不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取公告详情成功',
            data: notice,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 创建公告
 * POST /api/notices
 */
router.post('/', noticeValidation.create, async (req, res, next) => {
    try {
        const noticeData = {
            ...req.body,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await noticeModel.create(noticeData);
        const newNotice = await noticeModel.findById(result.id);

        res.status(201).json({
            code: 201,
            message: '创建公告成功',
            data: newNotice,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

