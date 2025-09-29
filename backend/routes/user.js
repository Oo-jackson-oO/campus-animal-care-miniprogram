/**
 * 用户相关路由
 * 处理用户登录、注册、信息更新等操作
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { userValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * 用户登录/注册
 * POST /api/user/login
 */
router.post('/login', userValidation.login, async (req, res, next) => {
    try {
        const { openid, nickname, avatar_url } = req.body;

        const user = await User.prototype.loginOrRegister({
            openid,
            nickname,
            avatar_url
        });

        res.json({
            code: 200,
            message: '登录成功',
            data: user,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户信息
 * GET /api/user/info?openid=xxx
 */
router.get('/info', async (req, res, next) => {
    try {
        const { openid } = req.query;

        if (!openid) {
            return res.status(400).json({
                code: 400,
                message: 'openid参数不能为空',
                timestamp: Date.now()
            });
        }

        const user = await User.prototype.findByOpenid(openid);

        if (!user) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取用户信息成功',
            data: user,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 更新用户信息
 * PUT /api/user/info
 */
router.put('/info', userValidation.updateInfo, async (req, res, next) => {
    try {
        const { openid, ...updateData } = req.body;

        const result = await User.prototype.updateByOpenid(openid, updateData);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在',
                timestamp: Date.now()
            });
        }

        // 返回更新后的用户信息
        const updatedUser = await User.prototype.findByOpenid(openid);

        res.json({
            code: 200,
            message: '更新用户信息成功',
            data: updatedUser,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户统计信息
 * GET /api/user/stats/:userId
 */
router.get('/stats/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                code: 400,
                message: '用户ID必须是正整数',
                timestamp: Date.now()
            });
        }

        const stats = await User.prototype.getUserStats(parseInt(userId));

        if (!stats) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取用户统计信息成功',
            data: stats,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户排名
 * GET /api/user/ranking?limit=10
 */
router.get('/ranking', async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        if (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100) {
            return res.status(400).json({
                code: 400,
                message: 'limit参数必须在1-100之间',
                timestamp: Date.now()
            });
        }

        const ranking = await User.prototype.getUserRanking(parseInt(limit));

        res.json({
            code: 200,
            message: '获取用户排名成功',
            data: ranking,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 搜索用户
 * GET /api/user/search?keyword=xxx&limit=20&offset=0
 */
router.get('/search', async (req, res, next) => {
    try {
        const { keyword, limit = 20, offset = 0 } = req.query;

        if (!keyword || keyword.trim().length === 0) {
            return res.status(400).json({
                code: 400,
                message: '搜索关键词不能为空',
                timestamp: Date.now()
            });
        }

        const users = await User.prototype.searchUsers(keyword.trim(), {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            code: 200,
            message: '搜索用户成功',
            data: users,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

