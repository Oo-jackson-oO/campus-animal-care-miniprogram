/**
 * 路由入口文件
 * 统一管理所有API路由
 */

const express = require('express');
const router = express.Router();

// 导入各个模块的路由
const userRoutes = require('./user');
const animalRoutes = require('./animal');
const productRoutes = require('./product');
const donationRoutes = require('./donation');
const commentRoutes = require('./comment');
const noticeRoutes = require('./notice');
const wechatRoutes = require('./wechat');
const payRoutes = require('./pay');

// 注册路由
router.use('/user', userRoutes);
router.use('/animals', animalRoutes);
router.use('/products', productRoutes);
router.use('/donations', donationRoutes);
router.use('/comments', commentRoutes);
router.use('/notices', noticeRoutes);
router.use('/wechat', wechatRoutes);
router.use('/pay', payRoutes);

// 根路径
router.get('/', (req, res) => {
    res.json({
        code: 200,
        message: '校园流浪动物守护API服务',
        data: {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: {
                user: '/api/user',
                animals: '/api/animals',
                products: '/api/products',
                donations: '/api/donations',
                comments: '/api/comments',
                notices: '/api/notices',
                wechat: '/api/wechat',
                pay: '/api/pay'
            }
        }
    });
});

module.exports = router;

