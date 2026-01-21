/**
 * 公告数据模型
 * 继承BaseModel，提供公告相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class Notice extends BaseModel {
    constructor() {
        super('notices', {
            activeCondition: 'status = ?',
            activeParams: ['active'],
            inactiveValue: 'inactive'
        });
    }

    /**
     * 获取公告统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getNoticeStats() {
        try {
            const stats = await this.rawQuery(`
        SELECT 
          COUNT(*) as total_notices,
          SUM(CASE WHEN type = 'urgent' THEN 1 ELSE 0 END) as urgent_notices,
          SUM(CASE WHEN type = 'normal' THEN 1 ELSE 0 END) as normal_notices,
          SUM(CASE WHEN type = 'activity' THEN 1 ELSE 0 END) as activity_notices,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_notices
        FROM notices
      `);

            return stats[0];
        } catch (error) {
            logger.error('获取公告统计信息失败', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = Notice;

