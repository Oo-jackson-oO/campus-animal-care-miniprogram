/**
 * 数据库配置和连接管理
 * 使用连接池提高性能和稳定性
 */

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_animal_care',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: '+08:00',
    // 连接池配置
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // SSL配置（生产环境建议启用）
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// 创建连接池
let pool = null;

/**
 * 初始化数据库连接池
 */
async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);

        // 测试连接
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        logger.info('数据库连接池初始化成功', {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database
        });

        return true;
    } catch (error) {
        logger.error('数据库连接失败', {
            error: error.message,
            config: {
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database
            }
        });
        throw error;
    }
}

/**
 * 获取数据库连接池
 */
function getPool() {
    if (!pool) {
        throw new Error('数据库连接池未初始化，请先调用 initDatabase()');
    }
    return pool;
}

/**
 * 执行查询
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        logger.error('数据库查询失败', {
            sql: sql.substring(0, 100) + '...',
            params: params,
            error: error.message
        });
        throw error;
    }
}

/**
 * 执行事务
 * @param {Function} callback 事务回调函数
 * @returns {Promise<any>} 事务结果
 */
async function transaction(callback) {
    const connection = await getPool().getConnection();

    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        logger.error('数据库事务失败', {
            error: error.message
        });
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 关闭数据库连接池
 */
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('数据库连接池已关闭');
    }
}

/**
 * 检查数据库连接状态
 */
async function checkConnection() {
    try {
        const result = await query('SELECT 1 as status');
        return result[0].status === 1;
    } catch (error) {
        logger.error('数据库连接检查失败', {
            error: error.message
        });
        return false;
    }
}

/**
 * 获取数据库统计信息
 */
async function getDatabaseStats() {
    try {
        const stats = await query(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `, [dbConfig.database]);

        return stats;
    } catch (error) {
        logger.error('获取数据库统计信息失败', {
            error: error.message
        });
        return [];
    }
}

module.exports = {
    initDatabase,
    getPool,
    query,
    transaction,
    closeDatabase,
    checkConnection,
    getDatabaseStats,
    dbConfig
};

