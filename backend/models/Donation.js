/**
 * 捐赠数据模型
 * 继承BaseModel，提供捐赠相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class Donation extends BaseModel {
    constructor() {
        super('donations', {
            activeCondition: `status IN (?, ?)`,
            activeParams: ['active', 'completed'],
            inactiveValue: 'cancelled'
        });
    }

    /**
     * 获取捐赠项目详情（带统计信息）
     * @param {number} id 捐赠项目ID
     * @returns {Promise<Object|null>} 捐赠项目详情
     */
    async getDonationDetail(id) {
        try {
            const sql = `
        SELECT 
          d.*,
          a.name as animal_name,
          a.image_url as animal_image,
          u.nickname as creator_name,
          COALESCE(donation_stats.total_donations, 0) as total_donations,
          COALESCE(donation_stats.total_amount, 0) as total_amount,
          COALESCE(donation_stats.donor_count, 0) as donor_count
        FROM donations d
        LEFT JOIN animals a ON d.animal_id = a.id
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN (
          SELECT 
            donation_id,
            COUNT(*) as total_donations,
            SUM(amount) as total_amount,
            COUNT(DISTINCT user_id) as donor_count
          FROM donation_records 
          WHERE status = 'completed'
          GROUP BY donation_id
        ) donation_stats ON d.id = donation_stats.donation_id
        WHERE d.id = ? AND d.status IN ('active', 'completed')
      `;

            const results = await this.rawQuery(sql, [id]);

            logger.database('SELECT', this.tableName, `获取捐赠项目详情，ID: ${id}`);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            logger.error('获取捐赠项目详情失败', {
                id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 创建捐赠记录
     * @param {Object} donationData 捐赠数据
     * @returns {Promise<Object>} 创建结果
     */
    async createDonationRecord(donationData) {
        try {
            const result = await this.rawQuery(`
        INSERT INTO donation_records (donation_id, user_id, amount, payment_method, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                donationData.donation_id,
                donationData.user_id,
                donationData.amount,
                donationData.payment_method,
                donationData.status,
                donationData.created_at,
                donationData.updated_at
            ]);

            await this.updateDonationStatusIfReached(donationData.donation_id);

            logger.database('INSERT', 'donation_records', `创建捐赠记录，项目ID: ${donationData.donation_id}`);

            return {
                id: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error('创建捐赠记录失败', {
                donationData,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 更新捐赠项目金额
     * @param {number} donationId 捐赠项目ID
     * @param {number} amount 捐赠金额
     * @returns {Promise<void>}
     */
    async updateDonationAmount(donationId, amount) {
        try {
            await this.rawQuery(`
        UPDATE donations 
        SET current_amount = current_amount + ?,
            updated_at = NOW()
        WHERE id = ?
      `, [amount, donationId]);

            // 检查是否达到目标金额
            const donation = await this.findById(donationId);
            if (donation && donation.current_amount >= donation.target_amount) {
                await this.update(donationId, { status: 'completed' });
            }

            logger.database('UPDATE', this.tableName, `更新捐赠金额，项目ID: ${donationId}`);
        } catch (error) {
            logger.error('更新捐赠项目金额失败', {
                donationId,
                amount,
                error: error.message
            });
            throw error;
        }
    }

    async updateDonationStatusIfReached(donationId) {
        const donation = await this.findById(donationId);
        if (donation && donation.current_amount >= donation.target_amount && donation.status !== 'completed') {
            await this.update(donationId, { status: 'completed' });
        }
    }

    /**
     * 获取用户捐赠记录
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 捐赠记录列表
     */
    async getUserDonations(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                orderBy = 'created_at',
                order = 'DESC'
            } = options;

            const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 10;
            const safePage = Number.isFinite(Number(page)) ? Math.max(1, parseInt(page)) : 1;
            const offset = (safePage - 1) * safeLimit;
            const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset)) : 0;
            const allowedOrderBy = new Set(['created_at', 'id', 'amount']);
            const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : 'created_at';
            const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const sql = `
        SELECT 
          dr.*,
          d.title as donation_title,
          d.description as donation_description,
          a.name as animal_name,
          a.image_url as animal_image
        FROM donation_records dr
        LEFT JOIN donations d ON dr.donation_id = d.id
        LEFT JOIN animals a ON d.animal_id = a.id
        WHERE dr.user_id = ? AND dr.status = 'completed'
        ORDER BY dr.${safeOrderBy} ${safeOrder}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

            const donations = await this.rawQuery(sql, [userId]);

            // 获取总数
            const countSql = `
        SELECT COUNT(*) as total
        FROM donation_records 
        WHERE user_id = ? AND status = 'completed'
      `;
            const countResult = await this.rawQuery(countSql, [userId]);
            const total = countResult[0].total;

            logger.database('SELECT', 'donation_records', `获取用户捐赠记录，用户ID: ${userId}`);

            return {
                data: donations,
                pagination: {
                    page: parseInt(safePage),
                    limit: parseInt(safeLimit),
                    total: parseInt(total),
                    pages: Math.ceil(total / safeLimit)
                }
            };
        } catch (error) {
            logger.error('获取用户捐赠记录失败', {
                userId,
                options,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取捐赠统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getDonationStats() {
        try {
            const stats = await this.rawQuery(`
        SELECT 
          COUNT(*) as total_donations,
          SUM(current_amount) as total_amount,
          AVG(current_amount) as avg_amount,
          COUNT(DISTINCT created_by) as total_creators
        FROM donations 
        WHERE status IN ('active', 'completed')
      `);

            return stats[0];
        } catch (error) {
            logger.error('获取捐赠统计信息失败', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = Donation;

