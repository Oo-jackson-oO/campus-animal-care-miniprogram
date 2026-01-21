/**
 * 用户数据模型
 * 继承BaseModel，提供用户相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    /**
     * 根据openid查找用户
     * @param {string} openid 微信openid
     * @returns {Promise<Object|null>} 用户信息
     */
    async findByOpenid(openid) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE openid = ? AND status = 1`;
            const results = await this.rawQuery(sql, [openid]);

            logger.database('SELECT', this.tableName, `根据openid查询: ${openid}`);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            logger.error(`根据openid查询用户失败`, {
                openid,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 用户登录或注册
     * @param {Object} userData 用户数据
     * @returns {Promise<Object>} 用户信息
     */
    async loginOrRegister(userData) {
        try {
            const { openid, nickname, avatar_url } = userData;

            // 先查找是否已存在
            let user = await this.findByOpenid(openid);

            if (user) {
                // 更新最后登录时间
                await this.update(user.id, {
                    last_login_at: new Date()
                });

                logger.info('用户登录', { userId: user.id, openid });
                return user;
            } else {
                // 创建新用户
                const newUserData = {
                    openid,
                    nickname,
                    avatar_url: avatar_url || '/image/dog.png',
                    gender: 0, // 默认未知
                    status: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                    last_login_at: new Date()
                };

                const result = await this.create(newUserData);
                const newUser = await this.findById(result.id);

                logger.info('用户注册', { userId: result.id, openid });
                return newUser;
            }
        } catch (error) {
            logger.error('用户登录或注册失败', {
                userData,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 更新用户信息
     * @param {string} openid 用户openid
     * @param {Object} updateData 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateByOpenid(openid, updateData) {
        try {
            const user = await this.findByOpenid(openid);
            if (!user) {
                throw new Error('用户不存在');
            }

            const result = await this.update(user.id, updateData);

            logger.info('更新用户信息', {
                userId: user.id,
                openid,
                updateData
            });

            return result;
        } catch (error) {
            logger.error('更新用户信息失败', {
                openid,
                updateData,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取用户统计信息
     * @param {number} userId 用户ID
     * @returns {Promise<Object>} 统计信息
     */
    async getUserStats(userId) {
        try {
            const stats = await this.rawQuery(`
        SELECT 
          u.id,
          u.nickname,
          u.avatar_url,
          u.created_at,
          u.last_login_at,
          COALESCE(donation_stats.total_donations, 0) as total_donations,
          COALESCE(donation_stats.total_amount, 0) as total_amount,
          COALESCE(donation_week.week_amount, 0) as week_amount,
          COALESCE(order_stats.total_orders, 0) as total_orders,
          COALESCE(order_stats.total_spent, 0) as total_spent,
          COALESCE(comment_stats.total_comments, 0) as total_comments
        FROM users u
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as total_donations,
            SUM(amount) as total_amount
          FROM donation_records 
          WHERE status = 'completed'
          GROUP BY user_id
        ) donation_stats ON u.id = donation_stats.user_id
        LEFT JOIN (
          SELECT
            user_id,
            SUM(amount) as week_amount
          FROM donation_records
          WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY user_id
        ) donation_week ON u.id = donation_week.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_spent
          FROM orders 
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) order_stats ON u.id = order_stats.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as total_comments
          FROM comments 
          WHERE status = 1
          GROUP BY user_id
        ) comment_stats ON u.id = comment_stats.user_id
        WHERE u.id = ? AND u.status = 1
      `, [userId]);

            return stats.length > 0 ? stats[0] : null;
        } catch (error) {
            logger.error('获取用户统计信息失败', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取用户排名
     * @param {number} limit 排名数量
     * @returns {Promise<Array>} 排名列表
     */
    async getUserRanking(limit = 10) {
        try {
            const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 10;
            const ranking = await this.rawQuery(
                `
        SELECT 
          u.id,
          u.nickname,
          u.avatar_url,
          COALESCE(donation_stats.total_amount, 0) as total_donations
        FROM users u
        LEFT JOIN (
          SELECT 
            user_id,
            SUM(amount) as total_amount
          FROM donation_records 
          WHERE status = 'completed'
          GROUP BY user_id
        ) donation_stats ON u.id = donation_stats.user_id
        WHERE u.status = 1
        ORDER BY total_donations DESC
        LIMIT ${safeLimit}
      `
            );

            return ranking.map((row, index) => ({ ...row, rank: index + 1 }));
        } catch (error) {
            logger.error('获取用户排名失败', {
                limit,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 搜索用户
     * @param {string} keyword 搜索关键词
     * @param {Object} options 搜索选项
     * @returns {Promise<Array>} 搜索结果
     */
    async searchUsers(keyword, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;
            const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 20;
            const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset)) : 0;

            const sql = `
        SELECT id, nickname, avatar_url, created_at
        FROM ${this.tableName}
        WHERE status = 1 
        AND (nickname LIKE ? OR openid LIKE ?)
        ORDER BY created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

            const searchPattern = `%${keyword}%`;
            const results = await this.rawQuery(sql, [searchPattern, searchPattern]);

            logger.database('SEARCH', this.tableName, `搜索关键词: ${keyword}`);
            return results;
        } catch (error) {
            logger.error('搜索用户失败', {
                keyword,
                options,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = User;

