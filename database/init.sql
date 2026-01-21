-- 校园流浪动物守护小程序数据库初始化脚本
-- 创建时间: 2024-01-20
-- 版本: 1.0
-- 支持多次执行，使用IF NOT EXISTS和DROP IF EXISTS语句

-- 设置SQL模式，确保兼容性
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- 创建数据库
CREATE DATABASE IF NOT EXISTS campus_animal_care 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE campus_animal_care;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(50) UNIQUE NOT NULL COMMENT '微信openid',
    nickname VARCHAR(100) NOT NULL COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知, 1-男, 2-女',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 兼容升级：补齐 last_login_at 字段（避免重复执行时报错）
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'last_login_at'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL COMMENT ''最后登录时间''',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql;
EXECUTE __stmt;
DEALLOCATE PREPARE __stmt;

-- 动物信息表
CREATE TABLE IF NOT EXISTS animals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '动物姓名',
    species VARCHAR(20) NOT NULL COMMENT '物种: cat, dog, other',
    gender TINYINT NOT NULL COMMENT '性别: 0-未知, 1-公, 2-母',
    age_months INT COMMENT '年龄(月)',
    color VARCHAR(50) COMMENT '毛色',
    description TEXT COMMENT '描述',
    image_url VARCHAR(500) COMMENT '头像图片URL',
    location VARCHAR(200) COMMENT '常出现地点',
    sterilized BOOLEAN DEFAULT FALSE COMMENT '是否已绝育',
    vaccinated BOOLEAN DEFAULT FALSE COMMENT '是否已接种疫苗',
    health_status VARCHAR(20) DEFAULT 'healthy' COMMENT '健康状态: healthy, sick, injured, recovered',
    adoption_status VARCHAR(20) DEFAULT 'wild' COMMENT '收养状态: wild, fostered, adopted',
    created_by INT COMMENT '创建者用户ID',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-删除, 1-正常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_species (species),
    INDEX idx_status (status),
    INDEX idx_location (location),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物信息表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '现价',
    original_price DECIMAL(10,2) COMMENT '原价',
    image_url VARCHAR(500) COMMENT '主图URL',
    images JSON COMMENT '商品图片数组',
    category VARCHAR(50) COMMENT '商品分类',
    stock INT DEFAULT 0 COMMENT '库存数量',
    sales INT DEFAULT 0 COMMENT '销量',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分(0-5)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 商品评价表
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL COMMENT '商品ID',
    user_id INT NOT NULL COMMENT '用户ID',
    rating TINYINT NOT NULL COMMENT '评分(1-5)',
    content TEXT COMMENT '评价内容',
    images JSON COMMENT '评价图片',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价表';

-- 捐赠项目表
CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    animal_id INT COMMENT '关联动物ID',
    title VARCHAR(100) NOT NULL COMMENT '项目标题',
    description TEXT COMMENT '项目描述',
    target_amount DECIMAL(10,2) NOT NULL COMMENT '目标金额',
    current_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '当前金额',
    image_url VARCHAR(500) COMMENT '项目图片',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active, completed, cancelled',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    created_by INT COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_animal_id (animal_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='捐赠项目表';

-- 捐赠记录表
CREATE TABLE IF NOT EXISTS donation_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donation_id INT NOT NULL COMMENT '捐赠项目ID',
    user_id INT NOT NULL COMMENT '捐赠用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '捐赠金额',
    payment_method VARCHAR(20) COMMENT '支付方式',
    transaction_id VARCHAR(100) COMMENT '交易ID',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, completed, failed, refunded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_donation_id (donation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='捐赠记录表';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    animal_id INT NOT NULL COMMENT '动物ID',
    user_id INT NOT NULL COMMENT '用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_id INT COMMENT '父评论ID(回复)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-删除, 1-正常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_animal_id (animal_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 公告表
CREATE TABLE IF NOT EXISTS notices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    type VARCHAR(20) NOT NULL COMMENT '类型: urgent, activity, collection, update, recruit',
    priority INT DEFAULT 1 COMMENT '优先级: 1-最高, 5-最低',
    icon VARCHAR(10) COMMENT '图标',
    color VARCHAR(20) COMMENT '主题色',
    bg_color VARCHAR(20) COMMENT '背景色',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active, inactive, expired',
    start_time TIMESTAMP COMMENT '开始时间',
    end_time TIMESTAMP COMMENT '结束时间',
    created_by INT COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_time_range (start_time, end_time),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) UNIQUE NOT NULL COMMENT '订单号',
    user_id INT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, paid, shipped, completed, cancelled',
    payment_method VARCHAR(20) COMMENT '支付方式',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    shipping_address TEXT COMMENT '收货地址',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL COMMENT '数量',
    price DECIMAL(10,2) NOT NULL COMMENT '单价',
    total_price DECIMAL(10,2) NOT NULL COMMENT '小计',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单详情表';

-- 创建视图：动物统计信息
CREATE OR REPLACE VIEW animal_stats AS
SELECT 
    species,
    COUNT(*) as total_count,
    SUM(CASE WHEN health_status = 'healthy' THEN 1 ELSE 0 END) as healthy_count,
    SUM(CASE WHEN sterilized = TRUE THEN 1 ELSE 0 END) as sterilized_count,
    SUM(CASE WHEN vaccinated = TRUE THEN 1 ELSE 0 END) as vaccinated_count
FROM animals 
WHERE status = 1 
GROUP BY species;

-- 创建视图：商品销售统计
CREATE OR REPLACE VIEW product_sales_stats AS
SELECT 
    p.id,
    p.name,
    p.sales,
    p.rating,
    COUNT(pr.id) as review_count,
    AVG(pr.rating) as avg_rating
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.status = 1
WHERE p.status = 1
GROUP BY p.id, p.name, p.sales, p.rating;

-- 创建存储过程：更新商品评分
DELIMITER //
DROP PROCEDURE IF EXISTS UpdateProductRating //
CREATE PROCEDURE UpdateProductRating(IN p_product_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    
    SELECT AVG(rating) INTO avg_rating
    FROM product_reviews 
    WHERE product_id = p_product_id AND status = 1;
    
    UPDATE products 
    SET rating = COALESCE(avg_rating, 0.00)
    WHERE id = p_product_id;
END //
DELIMITER ;

-- 创建触发器：自动更新商品评分
DELIMITER //
DROP TRIGGER IF EXISTS update_product_rating_after_review //
CREATE TRIGGER update_product_rating_after_review
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN
    CALL UpdateProductRating(NEW.product_id);
END //
DELIMITER ;

-- 创建触发器：自动更新捐赠项目当前金额
DELIMITER //
DROP TRIGGER IF EXISTS update_donation_amount_after_record //
CREATE TRIGGER update_donation_amount_after_record
AFTER INSERT ON donation_records
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE donations 
        SET current_amount = current_amount + NEW.amount
        WHERE id = NEW.donation_id;
    END IF;
END //
DELIMITER ;

-- 插入初始管理员用户
INSERT IGNORE INTO users (openid, nickname, avatar_url, gender, status) VALUES
('admin', 'Admin', '/image/dog.png', 0, 1);

-- 显示创建结果
SELECT 'Database and tables created successfully!' as message;
