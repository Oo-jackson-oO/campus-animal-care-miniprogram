const express = require('express');
const router = express.Router();
const User = require('../models/User');
const config = require('../config/config');
const { code2Session } = require('../utils/wechat');

const userModel = new User();

function randomString(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * 微信登录（开发优先）
 * POST /api/wechat/login
 * body: { code, nickname?, avatar_url? }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code, nickname, avatar_url } = req.body || {};
    if (!code) {
      return res.status(400).json({
        code: 400,
        message: 'code不能为空',
        timestamp: Date.now()
      });
    }

    const appId = config.wechat.appId;
    const secret = config.wechat.secret;
    let mock = process.env.MOCK_WECHAT === 'true' || !appId || !secret;

    let openid = '';
    let session_key = '';

    if (mock) {
      openid = `mock_${code}_${randomString(6)}`;
      session_key = randomString(32);
    } else {
      try {
        const result = await code2Session({ appId, secret, code });
        openid = result.openid;
        session_key = result.session_key;
      } catch (error) {
        mock = true;
        openid = `mock_${code}_${randomString(6)}`;
        session_key = randomString(32);
      }
    }

    const user = await userModel.loginOrRegister({
      openid,
      nickname: nickname || '微信用户',
      avatar_url: avatar_url || '/image/dog.png'
    });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        openid,
        session_key,
        user
      },
      mock,
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
