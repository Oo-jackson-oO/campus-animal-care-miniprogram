/**
 * 评论数据模型
 * 继承BaseModel，提供评论相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class Comment extends BaseModel {
    constructor() {
        super('comments');
    }

    /**
     * 获取动物评论列表
     * @param {number} animalId 动物ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 评论列表
     */
    async getAnimalComments(animalId, options = {}) {
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
            const allowedOrderBy = new Set(['created_at', 'id']);
            const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : 'created_at';
            const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const sql = `
        SELECT 
          c.*,
          u.nickname as user_name,
          u.avatar_url as user_avatar,
          parent_user.nickname as parent_user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN comments parent ON c.parent_id = parent.id
        LEFT JOIN users parent_user ON parent.user_id = parent_user.id
        WHERE c.animal_id = ? AND c.status = 1
        ORDER BY c.${safeOrderBy} ${safeOrder}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

            const comments = await this.rawQuery(sql, [animalId]);

            // 获取总数
            const countSql = `
        SELECT COUNT(*) as total
        FROM comments 
        WHERE animal_id = ? AND status = 1
      `;
            const countResult = await this.rawQuery(countSql, [animalId]);
            const total = countResult[0].total;

            logger.database('SELECT', this.tableName, `获取动物评论，动物ID: ${animalId}`);

            return {
                data: comments,
                pagination: {
                    page: parseInt(safePage),
                    limit: parseInt(safeLimit),
                    total: parseInt(total),
                    pages: Math.ceil(total / safeLimit)
                }
            };
        } catch (error) {
            logger.error('获取动物评论失败', {
                animalId,
                options,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取评论统计信息
     * @param {number} animalId 动物ID
     * @returns {Promise<Object>} 统计信息
     */
    async getCommentStats(animalId) {
        try {
            const stats = await this.rawQuery(`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(DISTINCT user_id) as unique_users
        FROM comments 
        WHERE animal_id = ? AND status = 1
      `, [animalId]);

            return stats[0];
        } catch (error) {
            logger.error('获取评论统计信息失败', {
                animalId,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = Comment;

