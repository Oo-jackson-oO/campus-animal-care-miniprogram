/**
 * 捐赠相关路由
 * 处理捐赠项目查询、捐赠记录创建等操作
 */

const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const { donationValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * 获取捐赠项目列表
 * GET /api/donations?page=1&limit=10&status=active
 */
router.get('/', donationValidation.getList, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status
        } = req.query;

        const conditions = {};
        if (status) conditions.status = status;

        const result = await Donation.prototype.paginate(conditions, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderBy: 'created_at',
            order: 'DESC'
        });

        res.json({
            code: 200,
            message: '获取捐赠项目列表成功',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取捐赠项目详情
 * GET /api/donations/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '捐赠项目ID必须是正整数',
                timestamp: Date.now()
            });
        }

        const donation = await Donation.prototype.getDonationDetail(parseInt(id));

        if (!donation) {
            return res.status(404).json({
                code: 404,
                message: '捐赠项目不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取捐赠项目详情成功',
            data: donation,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 创建捐赠记录
 * POST /api/donations/:id/donate
 */
router.post('/:id/donate', donationValidation.createDonation, async (req, res, next) => {
    try {
        const { id } = req.params;
        const donationData = {
            ...req.body,
            donation_id: parseInt(id),
            status: 1,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await Donation.prototype.createDonationRecord(donationData);

        res.status(201).json({
            code: 201,
            message: '创建捐赠记录成功',
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户捐赠记录
 * GET /api/user/:userId/donations?page=1&limit=10
 */
router.get('/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                code: 400,
                message: '用户ID必须是正整数',
                timestamp: Date.now()
            });
        }

        const donations = await Donation.prototype.getUserDonations(parseInt(userId), {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            code: 200,
            message: '获取用户捐赠记录成功',
            data: donations.data,
            pagination: donations.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

