/**
 * 基础数据模型类
 * 提供通用的数据库操作方法
 */

const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class BaseModel {
    constructor(tableName, options = {}) {
        this.tableName = tableName;
        this.statusField = options.statusField || 'status';
        this.hasStatus = options.hasStatus !== false;
        this.activeCondition = options.activeCondition || null;
        this.activeParams = Array.isArray(options.activeParams) ? options.activeParams : [];
        this.inactiveValue = options.inactiveValue !== undefined ? options.inactiveValue : 0;
    }

    getActiveFilter(conditions = {}) {
        if (!this.hasStatus) return null;
        if (conditions && Object.prototype.hasOwnProperty.call(conditions, this.statusField)) {
            return null;
        }
        if (this.activeCondition) {
            return { sql: this.activeCondition, params: [...this.activeParams] };
        }
        return { sql: `${this.statusField} = ?`, params: [1] };
    }

    /**
     * 根据ID查询单条记录
     * @param {number} id 记录ID
     * @param {Array} fields 查询字段，默认查询所有字段
     * @returns {Promise<Object|null>} 查询结果
     */
    async findById(id, fields = ['*']) {
        try {
            const fieldStr = fields.join(', ');
            const active = this.getActiveFilter();
            const sql = `SELECT ${fieldStr} FROM ${this.tableName} WHERE id = ?${active ? ` AND ${active.sql}` : ''}`;
            const results = await query(sql, [id, ...(active ? active.params : [])]);

            logger.database('SELECT', this.tableName, `查询ID: ${id}`);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            logger.error(`查询${this.tableName}失败`, {
                id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 根据条件查询多条记录
     * @param {Object} conditions 查询条件
     * @param {Object} options 查询选项
     * @returns {Promise<Array>} 查询结果
     */
    async find(conditions = {}, options = {}) {
        try {
            const {
                fields = ['*'],
                orderBy = 'id',
                order = 'DESC',
                limit = 100,
                offset = 0
            } = options;

            let sql = `SELECT ${fields.join(', ')} FROM ${this.tableName}`;
            const params = [];

            // 构建WHERE条件
            const whereConditions = [];
            Object.keys(conditions).forEach(key => {
                if (conditions[key] !== undefined && conditions[key] !== null) {
                    whereConditions.push(`${key} = ?`);
                    params.push(conditions[key]);
                }
            });

            const active = this.getActiveFilter(conditions);
            if (active) {
                whereConditions.push(active.sql);
                params.push(...active.params);
            }

            if (whereConditions.length > 0) {
                sql += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            // 添加排序
            sql += ` ORDER BY ${orderBy} ${order}`;

            const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.min(parseInt(limit), 1000)) : 100;
            const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset)) : 0;
            sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

            const results = await query(sql, params);

            logger.database('SELECT', this.tableName, `查询条件: ${JSON.stringify(conditions)}`);
            return results;
        } catch (error) {
            logger.error(`查询${this.tableName}失败`, {
                conditions,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 分页查询
     * @param {Object} conditions 查询条件
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 分页结果
     */
    async paginate(conditions = {}, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                fields = ['*'],
                orderBy = 'id',
                order = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            // 查询数据
            const data = await this.find(conditions, {
                fields,
                orderBy,
                order,
                limit,
                offset
            });

            // 查询总数
            const countResult = await this.count(conditions);
            const total = countResult.total;

            return {
                data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error(`分页查询${this.tableName}失败`, {
                conditions,
                options,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 统计记录数
     * @param {Object} conditions 查询条件
     * @returns {Promise<Object>} 统计结果
     */
    async count(conditions = {}) {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
            const params = [];

            // 构建WHERE条件
            const whereConditions = [];
            Object.keys(conditions).forEach(key => {
                if (conditions[key] !== undefined && conditions[key] !== null) {
                    whereConditions.push(`${key} = ?`);
                    params.push(conditions[key]);
                }
            });

            const active = this.getActiveFilter(conditions);
            if (active) {
                whereConditions.push(active.sql);
                params.push(...active.params);
            }

            if (whereConditions.length > 0) {
                sql += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            const results = await query(sql, params);

            logger.database('COUNT', this.tableName, `统计条件: ${JSON.stringify(conditions)}`);
            return results[0];
        } catch (error) {
            logger.error(`统计${this.tableName}失败`, {
                conditions,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 创建新记录
     * @param {Object} data 记录数据
     * @returns {Promise<Object>} 创建结果
     */
    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');

            const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
            const result = await query(sql, values);

            logger.database('INSERT', this.tableName, `创建记录: ${JSON.stringify(data)}`);

            return {
                id: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error(`创建${this.tableName}失败`, {
                data,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 更新记录
     * @param {number} id 记录ID
     * @param {Object} data 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');

            const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE id = ?`;
            const result = await query(sql, [...values, id]);

            logger.database('UPDATE', this.tableName, `更新ID: ${id}, 数据: ${JSON.stringify(data)}`);

            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error(`更新${this.tableName}失败`, {
                id,
                data,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 软删除记录
     * @param {number} id 记录ID
     * @returns {Promise<Object>} 删除结果
     */
    async softDelete(id) {
        try {
            if (!this.hasStatus) {
                throw new Error(`${this.tableName} 不支持软删除（无状态字段）`);
            }

            const sql = `UPDATE ${this.tableName} SET ${this.statusField} = ?, updated_at = NOW() WHERE id = ?`;
            const result = await query(sql, [this.inactiveValue, id]);

            logger.database('DELETE', this.tableName, `软删除ID: ${id}`);

            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error(`删除${this.tableName}失败`, {
                id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 硬删除记录
     * @param {number} id 记录ID
     * @returns {Promise<Object>} 删除结果
     */
    async hardDelete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await query(sql, [id]);

            logger.database('DELETE', this.tableName, `硬删除ID: ${id}`);

            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error(`删除${this.tableName}失败`, {
                id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 批量创建记录
     * @param {Array} dataList 记录数据列表
     * @returns {Promise<Object>} 创建结果
     */
    async batchCreate(dataList) {
        try {
            if (!Array.isArray(dataList) || dataList.length === 0) {
                throw new Error('数据列表不能为空');
            }

            const fields = Object.keys(dataList[0]);
            const placeholders = fields.map(() => '?').join(', ');
            const valuesPlaceholders = dataList.map(() => `(${placeholders})`).join(', ');

            const values = dataList.flatMap(data => fields.map(field => data[field]));

            const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ${valuesPlaceholders}`;
            const result = await query(sql, values);

            logger.database('BATCH_INSERT', this.tableName, `批量创建${dataList.length}条记录`);

            return {
                affectedRows: result.affectedRows,
                insertId: result.insertId
            };
        } catch (error) {
            logger.error(`批量创建${this.tableName}失败`, {
                dataList,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 执行原生SQL查询
     * @param {string} sql SQL语句
     * @param {Array} params 参数
     * @returns {Promise<Array>} 查询结果
     */
    async rawQuery(sql, params = []) {
        try {
            const results = await query(sql, params);
            logger.database('RAW_QUERY', this.tableName, `执行SQL: ${sql.substring(0, 100)}...`);
            return results;
        } catch (error) {
            logger.error(`执行原生SQL失败`, {
                sql: sql.substring(0, 100),
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = BaseModel;

