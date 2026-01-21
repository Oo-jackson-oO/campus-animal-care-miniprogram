/**
 * 商品数据模型
 * 继承BaseModel，提供商品相关的数据库操作
 */

const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class Product extends BaseModel {
    constructor() {
        super('products');
    }

    /**
     * 获取商品详情（带评价统计）
     * @param {number} id 商品ID
     * @returns {Promise<Object|null>} 商品详情
     */
    async getProductDetail(id) {
        try {
            const sql = `
        SELECT 
          p.*,
          COALESCE(review_stats.avg_rating, 0) as avg_rating,
          COALESCE(review_stats.review_count, 0) as review_count,
          COALESCE(sales_stats.total_sales, 0) as total_sales
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
          FROM product_reviews 
          WHERE status = 1
          GROUP BY product_id
        ) review_stats ON p.id = review_stats.product_id
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(quantity) as total_sales
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.status != 'cancelled'
          GROUP BY product_id
        ) sales_stats ON p.id = sales_stats.product_id
        WHERE p.id = ? AND p.status = 1
      `;

            const results = await this.rawQuery(sql, [id]);

            logger.database('SELECT', this.tableName, `获取商品详情，ID: ${id}`);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            logger.error('获取商品详情失败', {
                id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取商品评价
     * @param {number} productId 商品ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 评价列表
     */
    async getProductReviews(productId, options = {}) {
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
            const allowedOrderBy = new Set(['created_at', 'id', 'rating']);
            const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : 'created_at';
            const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const sql = `
        SELECT 
          pr.*,
          u.nickname as user_name,
          u.avatar_url as user_avatar
        FROM product_reviews pr
        LEFT JOIN users u ON pr.user_id = u.id
        WHERE pr.product_id = ? AND pr.status = 1
        ORDER BY pr.${safeOrderBy} ${safeOrder}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

            const reviews = await this.rawQuery(sql, [productId]);

            // 获取总数
            const countSql = `
        SELECT COUNT(*) as total
        FROM product_reviews 
        WHERE product_id = ? AND status = 1
      `;
            const countResult = await this.rawQuery(countSql, [productId]);
            const total = countResult[0].total;

            logger.database('SELECT', 'product_reviews', `获取商品评价，商品ID: ${productId}`);

            return {
                data: reviews,
                pagination: {
                    page: parseInt(safePage),
                    limit: parseInt(safeLimit),
                    total: parseInt(total),
                    pages: Math.ceil(total / safeLimit)
                }
            };
        } catch (error) {
            logger.error('获取商品评价失败', {
                productId,
                options,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 创建商品评价
     * @param {Object} reviewData 评价数据
     * @returns {Promise<Object>} 创建结果
     */
    async createReview(reviewData) {
        try {
            const result = await this.rawQuery(`
        INSERT INTO product_reviews (product_id, user_id, rating, content, images, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                reviewData.product_id,
                reviewData.user_id,
                reviewData.rating,
                reviewData.content,
                JSON.stringify(reviewData.images || []),
                reviewData.status,
                reviewData.created_at,
                reviewData.updated_at
            ]);

            // 更新商品评分
            await this.updateProductRating(reviewData.product_id);

            logger.database('INSERT', 'product_reviews', `创建商品评价，商品ID: ${reviewData.product_id}`);

            return {
                id: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error('创建商品评价失败', {
                reviewData,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 更新商品评分
     * @param {number} productId 商品ID
     * @returns {Promise<void>}
     */
    async updateProductRating(productId) {
        try {
            await this.rawQuery(`
        UPDATE products 
        SET rating = (
          SELECT COALESCE(AVG(rating), 0) 
          FROM product_reviews 
          WHERE product_id = ? AND status = 1
        ),
        updated_at = NOW()
        WHERE id = ?
      `, [productId, productId]);

            logger.database('UPDATE', this.tableName, `更新商品评分，商品ID: ${productId}`);
        } catch (error) {
            logger.error('更新商品评分失败', {
                productId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取商品统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getProductStats() {
        try {
            const stats = await this.rawQuery(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_products,
          AVG(rating) as avg_rating,
          SUM(stock) as total_stock,
          SUM(sales) as total_sales
        FROM products
      `);

            return stats[0];
        } catch (error) {
            logger.error('获取商品统计信息失败', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 搜索商品
     * @param {string} keyword 搜索关键词
     * @param {Object} options 搜索选项
     * @returns {Promise<Array>} 搜索结果
     */
    async searchProducts(keyword, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;
            const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(parseInt(limit), 100)) : 20;
            const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset)) : 0;

            const sql = `
        SELECT 
          p.*,
          COALESCE(review_stats.avg_rating, 0) as avg_rating,
          COALESCE(review_stats.review_count, 0) as review_count
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
          FROM product_reviews 
          WHERE status = 1
          GROUP BY product_id
        ) review_stats ON p.id = review_stats.product_id
        WHERE p.status = 1 
        AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)
        ORDER BY p.created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

            const searchPattern = `%${keyword}%`;
            const results = await this.rawQuery(sql, [searchPattern, searchPattern, searchPattern]);

            logger.database('SEARCH', this.tableName, `搜索关键词: ${keyword}`);
            return results;
        } catch (error) {
            logger.error('搜索商品失败', {
                keyword,
                options,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = Product;

