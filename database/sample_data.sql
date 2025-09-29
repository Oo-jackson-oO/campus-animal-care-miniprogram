-- 示例数据插入脚本
USE campus_animal_care;

-- 插入用户数据
INSERT IGNORE INTO users (openid, nickname, avatar_url, phone, email, gender) VALUES
('o6zAJs1Gz7zPo3FQPeNZOGMKl9Jc', '爱心用户', '/image/dog.png', '13800138000', 'user@example.com', 1),
('o6zAJs1Gz7zPo3FQPeNZOGMKl9Jd', '动物爱好者', '/image/dog.png', '13800138001', 'lover@example.com', 2);

-- 插入动物数据
INSERT IGNORE INTO animals (name, species, gender, age_months, color, description, image_url, location, sterilized, vaccinated, health_status, adoption_status, created_by) VALUES
('小橘', 'cat', 1, 12, '橘色', '友善亲人的橘猫，喜欢晒太阳', '/image/dog.png', '图书馆附近', TRUE, TRUE, 'healthy', 'wild', 1),
('雪球', 'cat', 2, 8, '白色', '温顺的白猫，很亲人', '/image/dog.png', '宿舍楼下', TRUE, TRUE, 'healthy', 'wild', 1),
('奥利奥', 'cat', 1, 18, '黑白', '活泼好动的黑白猫', '/image/dog.png', '食堂附近', FALSE, TRUE, 'healthy', 'wild', 2),
('小白', 'dog', 2, 24, '白色', '温顺的小狗，很聪明', '/image/dog.png', '操场附近', TRUE, TRUE, 'healthy', 'wild', 1);

-- 插入商品数据
INSERT IGNORE INTO products (name, description, price, original_price, image_url, images, category, stock, sales, rating) VALUES
('猫咪帆布包', '印有可爱猫咪图案的帆布包，环保材质', 39.90, 59.90, '/image/dog.png', '["/image/dog.png", "/image/dog.png"]', '文创用品', 100, 25, 4.5),
('爱心徽章套装', '校园流浪动物关爱主题徽章', 9.90, 15.90, '/image/dog.png', '["/image/dog.png"]', '文创用品', 200, 50, 4.8),
('动物主题明信片', '手绘动物主题明信片套装', 19.90, 29.90, '/image/dog.png', '["/image/dog.png"]', '文创用品', 150, 30, 4.3);

-- 插入商品评价数据
INSERT IGNORE INTO product_reviews (product_id, user_id, rating, content, status) VALUES
(1, 1, 5, '质量很好，图案很可爱，支持流浪动物救助！', 1),
(1, 2, 4, '包包很实用，价格也合理', 1),
(2, 1, 5, '徽章做工精美，很有意义', 1),
(3, 2, 4, '明信片很漂亮，收藏价值高', 1);

-- 插入捐赠项目数据
INSERT IGNORE INTO donations (animal_id, title, description, target_amount, current_amount, image_url, status, start_date, end_date, created_by) VALUES
(1, '小橘疫苗接种', '为小橘筹集疫苗接种费用', 300.00, 150.00, '/image/dog.png', 'active', '2024-01-01', '2024-03-01', 1),
(2, '雪球绝育手术', '为雪球筹集绝育手术费用', 200.00, 180.00, '/image/dog.png', 'active', '2024-01-01', '2024-02-15', 1),
(3, '奥利奥体检', '为奥利奥筹集定期体检费用', 150.00, 80.00, '/image/dog.png', 'active', '2024-01-01', '2024-02-01', 2);

-- 插入捐赠记录数据
INSERT IGNORE INTO donation_records (donation_id, user_id, amount, payment_method, status) VALUES
(1, 1, 50.00, 'wechat', 'completed'),
(1, 2, 100.00, 'wechat', 'completed'),
(2, 1, 80.00, 'wechat', 'completed'),
(2, 2, 100.00, 'wechat', 'completed'),
(3, 1, 30.00, 'wechat', 'completed'),
(3, 2, 50.00, 'wechat', 'completed');

-- 插入评论数据
INSERT IGNORE INTO comments (animal_id, user_id, content, status) VALUES
(1, 1, '小橘今天在图书馆门口晒太阳，看起来很健康！', 1),
(1, 2, '昨天看到小橘在吃猫粮，胃口很好', 1),
(2, 1, '雪球很亲人，会主动蹭人', 1),
(3, 2, '奥利奥今天在食堂附近玩耍，很活泼', 1);

-- 插入公告数据
INSERT IGNORE INTO notices (title, content, type, priority, icon, color, bg_color, status, created_by) VALUES
('紧急救助通知', '图书馆附近发现受伤小猫，需要志愿者协助送医', 'urgent', 1, '🚨', '#FF4444', '#FFE6E6', 'active', 1),
('义卖活动通知', '本周文创义卖收益将用于流浪动物疫苗', 'activity', 2, '🎁', '#FF6600', '#FFE0B3', 'active', 1),
('故事征集', '欢迎分享你和校园毛孩子的故事', 'collection', 3, '📝', '#4CAF50', '#E8F5E8', 'active', 1),
('新功能上线', '商品详情页现已支持用户评价功能', 'update', 2, '✨', '#2196F3', '#E3F2FD', 'active', 1),
('志愿者招募', '长期招募校园流浪动物关爱志愿者', 'recruit', 2, '👥', '#9C27B0', '#F3E5F5', 'active', 1);

