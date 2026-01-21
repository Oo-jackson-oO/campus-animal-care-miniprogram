const express = require('express');
const router = express.Router();
const { transaction } = require('../config/database');

function randomString(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateOrderNo() {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`.padEnd(32, '0').slice(0, 32);
}

/**
 * 创建捐赠支付单（mock优先）
 * POST /api/pay/donation/:id/prepay
 * body: { user_id, amount }
 */
router.post('/donation/:id/prepay', async (req, res, next) => {
  try {
    const donationId = parseInt(req.params.id);
    const { user_id, amount } = req.body || {};
    const payAmount = Number(amount);

    if (!donationId || Number.isNaN(donationId)) {
      return res.status(400).json({ code: 400, message: '捐赠项目ID不合法', timestamp: Date.now() });
    }
    if (!user_id || Number.isNaN(parseInt(user_id))) {
      return res.status(400).json({ code: 400, message: 'user_id不合法', timestamp: Date.now() });
    }
    if (!payAmount || Number.isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ code: 400, message: 'amount不合法', timestamp: Date.now() });
    }

    const mock = process.env.MOCK_PAY !== 'false';
    const donationRecordStatus = mock ? 'completed' : 'pending';
    const transactionId = mock ? `mock_tx_${randomString(20)}` : null;

    const result = await transaction(async (conn) => {
      const [donations] = await conn.execute('SELECT id, status FROM donations WHERE id = ? LIMIT 1', [donationId]);
      if (!donations || donations.length === 0) {
        const error = new Error('捐赠项目不存在');
        error.statusCode = 404;
        throw error;
      }

      const [insertRes] = await conn.execute(
        `INSERT INTO donation_records (donation_id, user_id, amount, payment_method, transaction_id, status, created_at, updated_at)
         VALUES (?, ?, ?, 'wechat', ?, ?, NOW(), NOW())`,
        [donationId, parseInt(user_id), payAmount, transactionId, donationRecordStatus]
      );

      return {
        record_id: insertRes.insertId,
        status: donationRecordStatus,
        transaction_id: transactionId
      };
    });

    if (mock) {
      return res.json({
        code: 200,
        message: '预下单成功',
        data: {
          mock: true,
          record_id: result.record_id,
          payment: null
        },
        timestamp: Date.now()
      });
    }

    return res.json({
      code: 501,
      message: '真实微信支付尚未配置（请设置MOCK_PAY=true用于联调）',
      data: {
        mock: false,
        record_id: result.record_id,
        payment: null
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 确认捐赠支付成功（用于mock联调）
 * POST /api/pay/donation/:id/confirm
 * body: { record_id }
 */
router.post('/donation/:id/confirm', async (req, res, next) => {
  try {
    const donationId = parseInt(req.params.id);
    const { record_id } = req.body || {};
    const recordId = parseInt(record_id);
    if (!donationId || Number.isNaN(donationId) || !recordId || Number.isNaN(recordId)) {
      return res.status(400).json({ code: 400, message: '参数不合法', timestamp: Date.now() });
    }

    const updated = await transaction(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT id, amount, status FROM donation_records WHERE id = ? AND donation_id = ? LIMIT 1',
        [recordId, donationId]
      );
      if (!rows || rows.length === 0) {
        const error = new Error('捐赠记录不存在');
        error.statusCode = 404;
        throw error;
      }
      const record = rows[0];
      if (record.status === 'completed') {
        return { already: true };
      }

      await conn.execute("UPDATE donation_records SET status = 'completed', updated_at = NOW() WHERE id = ?", [recordId]);
      await conn.execute('UPDATE donations SET current_amount = current_amount + ?, updated_at = NOW() WHERE id = ?', [
        record.amount,
        donationId
      ]);

      return { already: false };
    });

    res.json({
      code: 200,
      message: '确认成功',
      data: updated,
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建商品购买支付单（mock优先）
 * POST /api/pay/order/prepay
 * body: { user_id, product_id, quantity }
 */
router.post('/order/prepay', async (req, res, next) => {
  try {
    const { user_id, product_id, quantity } = req.body || {};
    const userId = parseInt(user_id);
    const productId = parseInt(product_id);
    const qty = parseInt(quantity);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ code: 400, message: 'user_id不合法', timestamp: Date.now() });
    }
    if (!productId || Number.isNaN(productId)) {
      return res.status(400).json({ code: 400, message: 'product_id不合法', timestamp: Date.now() });
    }
    if (!qty || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ code: 400, message: 'quantity不合法', timestamp: Date.now() });
    }

    const mock = process.env.MOCK_PAY !== 'false';
    const orderStatus = mock ? 'paid' : 'pending';
    const orderNo = generateOrderNo();
    const transactionId = mock ? `mock_tx_${randomString(20)}` : null;

    const order = await transaction(async (conn) => {
      const [products] = await conn.execute(
        'SELECT id, price, stock, sales, status FROM products WHERE id = ? AND status = 1 LIMIT 1 FOR UPDATE',
        [productId]
      );
      if (!products || products.length === 0) {
        const error = new Error('商品不存在或已下架');
        error.statusCode = 404;
        throw error;
      }

      const product = products[0];
      if (product.stock < qty) {
        const error = new Error('库存不足');
        error.statusCode = 400;
        throw error;
      }

      const totalAmount = Number(product.price) * qty;

      const [orderRes] = await conn.execute(
        `INSERT INTO orders (order_no, user_id, total_amount, status, payment_method, payment_time, remark, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'wechat', ?, NULL, NOW(), NOW())`,
        [orderNo, userId, totalAmount, orderStatus, mock ? new Date() : null]
      );

      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, total_price, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [orderRes.insertId, productId, qty, product.price, totalAmount]
      );

      if (mock) {
        await conn.execute('UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = NOW() WHERE id = ?', [
          qty,
          qty,
          productId
        ]);
      }

      return {
        id: orderRes.insertId,
        order_no: orderNo,
        status: orderStatus,
        total_amount: totalAmount,
        transaction_id: transactionId
      };
    });

    if (mock) {
      return res.json({
        code: 200,
        message: '预下单成功',
        data: {
          mock: true,
          order,
          payment: null
        },
        timestamp: Date.now()
      });
    }

    return res.json({
      code: 501,
      message: '真实微信支付尚未配置（请设置MOCK_PAY=true用于联调）',
      data: {
        mock: false,
        order,
        payment: null
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
