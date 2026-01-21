/**
 * 动物数据模型
 * 继承BaseModel，提供动物相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class Animal extends BaseModel {
  constructor() {
    super('animals');
  }

  /**
   * 获取动物列表（带统计信息）
   * @param {Object} conditions 查询条件
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 动物列表
   */
  async getAnimalsWithStats(conditions = {}, options = {}) {
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

      let whereClause = 'WHERE a.status = 1';
      const params = [];

      // 构建WHERE条件
      if (conditions.species) {
        whereClause += ' AND a.species = ?';
        params.push(conditions.species);
      }
      if (conditions.gender !== undefined) {
        whereClause += ' AND a.gender = ?';
        params.push(conditions.gender);
      }
      if (conditions.health_status) {
        whereClause += ' AND a.health_status = ?';
        params.push(conditions.health_status);
      }
      if (conditions.adoption_status) {
        whereClause += ' AND a.adoption_status = ?';
        params.push(conditions.adoption_status);
      }

      const sql = `
        SELECT 
          a.*,
          u.nickname as creator_name,
          COALESCE(donation_stats.total_donations, 0) as total_donations,
          COALESCE(donation_stats.total_amount, 0) as total_amount,
          COALESCE(comment_stats.comment_count, 0) as comment_count
        FROM animals a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN (
          SELECT 
            animal_id,
            COUNT(*) as total_donations,
            SUM(amount) as total_amount
          FROM donation_records dr
          JOIN donations d ON dr.donation_id = d.id
          WHERE dr.status = 'completed' AND d.status IN ('active', 'completed')
          GROUP BY animal_id
        ) donation_stats ON a.id = donation_stats.animal_id
        LEFT JOIN (
          SELECT 
            animal_id,
            COUNT(*) as comment_count
          FROM comments 
          WHERE status = 1
          GROUP BY animal_id
        ) comment_stats ON a.id = comment_stats.animal_id
        ${whereClause}
        ORDER BY a.${safeOrderBy} ${safeOrder}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

      const results = await this.rawQuery(sql, params);

      logger.database('SELECT', this.tableName, `获取动物列表，条件: ${JSON.stringify(conditions)}`);
      return results;
    } catch (error) {
      logger.error('获取动物列表失败', {
        conditions,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取动物详情（带统计信息）
   * @param {number} id 动物ID
   * @returns {Promise<Object|null>} 动物详情
   */
  async getAnimalDetail(id) {
    try {
      const sql = `
        SELECT 
          a.*,
          u.nickname as creator_name,
          u.avatar_url as creator_avatar,
          COALESCE(donation_stats.total_donations, 0) as total_donations,
          COALESCE(donation_stats.total_amount, 0) as total_amount,
          COALESCE(comment_stats.comment_count, 0) as comment_count
        FROM animals a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN (
          SELECT 
            animal_id,
            COUNT(*) as total_donations,
            SUM(amount) as total_amount
          FROM donation_records dr
          JOIN donations d ON dr.donation_id = d.id
          WHERE dr.status = 'completed' AND d.status IN ('active', 'completed')
          GROUP BY animal_id
        ) donation_stats ON a.id = donation_stats.animal_id
        LEFT JOIN (
          SELECT 
            animal_id,
            COUNT(*) as comment_count
          FROM comments 
          WHERE status = 1
          GROUP BY animal_id
        ) comment_stats ON a.id = comment_stats.animal_id
        WHERE a.id = ? AND a.status = 1
      `;

      const results = await this.rawQuery(sql, [id]);

      logger.database('SELECT', this.tableName, `获取动物详情，ID: ${id}`);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('获取动物详情失败', {
        id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取动物统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getAnimalStats() {
    try {
      const stats = await this.rawQuery(`
        SELECT 
          COUNT(*) as total_animals,
          SUM(CASE WHEN species = 'cat' THEN 1 ELSE 0 END) as cats,
          SUM(CASE WHEN species = 'dog' THEN 1 ELSE 0 END) as dogs,
          SUM(CASE WHEN species = 'other' THEN 1 ELSE 0 END) as others,
          SUM(CASE WHEN sterilized = 1 THEN 1 ELSE 0 END) as sterilized,
          SUM(CASE WHEN vaccinated = 1 THEN 1 ELSE 0 END) as vaccinated,
          SUM(CASE WHEN health_status = 'healthy' THEN 1 ELSE 0 END) as healthy,
          SUM(CASE WHEN adoption_status = 'adoptable' THEN 1 ELSE 0 END) as adoptable
        FROM animals 
        WHERE status = 1
      `);

      return stats[0];
    } catch (error) {
      logger.error('获取动物统计信息失败', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 搜索动物
   * @param {string} keyword 搜索关键词
   * @param {Object} options 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchAnimals(keyword, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 20;
      const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset)) : 0;

      const sql = `
        SELECT 
          a.*,
          u.nickname as creator_name,
          COALESCE(donation_stats.total_donations, 0) as total_donations,
          COALESCE(donation_stats.total_amount, 0) as total_amount
        FROM animals a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN (
          SELECT 
            animal_id,
            COUNT(*) as total_donations,
            SUM(amount) as total_amount
          FROM donation_records dr
          JOIN donations d ON dr.donation_id = d.id
          WHERE dr.status = 'completed' AND d.status IN ('active', 'completed')
          GROUP BY animal_id
        ) donation_stats ON a.id = donation_stats.animal_id
        WHERE a.status = 1 
        AND (a.name LIKE ? OR a.description LIKE ? OR a.location LIKE ?)
        ORDER BY a.created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

      const searchPattern = `%${keyword}%`;
      const results = await this.rawQuery(sql, [searchPattern, searchPattern, searchPattern]);

      logger.database('SEARCH', this.tableName, `搜索关键词: ${keyword}`);
      return results;
    } catch (error) {
      logger.error('搜索动物失败', {
        keyword,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取热门动物（按捐赠金额排序）
   * @param {number} limit 数量限制
   * @returns {Promise<Array>} 热门动物列表
   */
  async getPopularAnimals(limit = 5) {
    try {
      const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 5;
      const sql = `
        SELECT 
          a.*,
          COALESCE(donation_stats.total_amount, 0) as total_donations
        FROM animals a
        LEFT JOIN (
          SELECT 
            animal_id,
            SUM(amount) as total_amount
          FROM donation_records dr
          JOIN donations d ON dr.donation_id = d.id
          WHERE dr.status = 1 AND d.status = 1
          GROUP BY animal_id
        ) donation_stats ON a.id = donation_stats.animal_id
        WHERE a.status = 1
        ORDER BY total_donations DESC, a.created_at DESC
        LIMIT ${safeLimit}
      `;

      const results = await this.rawQuery(sql);

      logger.database('SELECT', this.tableName, `获取热门动物，数量: ${limit}`);
      return results;
    } catch (error) {
      logger.error('获取热门动物失败', {
        limit,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 更新动物状态
   * @param {number} id 动物ID
   * @param {string} status 新状态
   * @returns {Promise<Object>} 更新结果
   */
  async updateStatus(id, status) {
    try {
      const validStatuses = ['healthy', 'sick', 'injured', 'unknown'];
      if (!validStatuses.includes(status)) {
        throw new Error('无效的健康状态');
      }

      const result = await this.update(id, { health_status: status });

      logger.info('更新动物状态', {
        animalId: id,
        status
      });

      return result;
    } catch (error) {
      logger.error('更新动物状态失败', {
        id,
        status,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = Animal;

