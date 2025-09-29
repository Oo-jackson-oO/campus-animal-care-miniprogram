# 校园流浪动物守护小程序 API 接口文档

## 基础信息
- **基础URL**: `https://your-domain.com/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200
}
```

## 1. 用户相关接口

### 1.1 用户登录/注册
```
POST /user/login
```
**请求参数**:
```json
{
  "openid": "o6zAJs1Gz7zPo3FQPeNZOGMKl9Jc",
  "nickname": "用户昵称",
  "avatar_url": "头像URL"
}
```

### 1.2 获取用户信息
```
GET /user/info?openid=xxx
```

### 1.3 更新用户信息
```
PUT /user/info
```
**请求参数**:
```json
{
  "openid": "o6zAJs1Gz7zPo3FQPeNZOGMKl9Jc",
  "phone": "13800138000",
  "email": "user@example.com"
}
```

## 2. 动物相关接口

### 2.1 获取动物列表
```
GET /animals?page=1&limit=10&species=cat&status=1
```

### 2.2 获取动物详情
```
GET /animals/{id}
```

### 2.3 添加动物信息
```
POST /animals
```
**请求参数**:
```json
{
  "name": "小橘",
  "species": "cat",
  "gender": 1,
  "age_months": 12,
  "color": "橘色",
  "description": "友善亲人的橘猫",
  "image_url": "/image/dog.png",
  "location": "图书馆附近",
  "sterilized": true,
  "vaccinated": true,
  "health_status": "healthy",
  "created_by": 1
}
```

### 2.4 更新动物信息
```
PUT /animals/{id}
```

## 3. 商品相关接口

### 3.1 获取商品列表
```
GET /products?page=1&limit=10&category=文创用品&status=1
```

### 3.2 获取商品详情
```
GET /products/{id}
```

### 3.3 获取商品评价
```
GET /products/{id}/reviews?page=1&limit=10
```

### 3.4 添加商品评价
```
POST /products/{id}/reviews
```
**请求参数**:
```json
{
  "user_id": 1,
  "rating": 5,
  "content": "质量很好，支持流浪动物救助！",
  "images": ["/image/review1.jpg"]
}
```

## 4. 捐赠相关接口

### 4.1 获取捐赠项目列表
```
GET /donations?page=1&limit=10&status=active
```

### 4.2 获取捐赠项目详情
```
GET /donations/{id}
```

### 4.3 创建捐赠记录
```
POST /donations/{id}/donate
```
**请求参数**:
```json
{
  "user_id": 1,
  "amount": 50.00,
  "payment_method": "wechat"
}
```

### 4.4 获取用户捐赠记录
```
GET /user/{user_id}/donations?page=1&limit=10
```

## 5. 评论相关接口

### 5.1 获取动物评论
```
GET /animals/{id}/comments?page=1&limit=10
```

### 5.2 添加评论
```
POST /animals/{id}/comments
```
**请求参数**:
```json
{
  "user_id": 1,
  "content": "今天看到小橘在晒太阳，很健康！",
  "parent_id": null
}
```

### 5.3 回复评论
```
POST /comments/{id}/reply
```
**请求参数**:
```json
{
  "user_id": 1,
  "content": "是的，我也看到了！"
}
```

## 6. 公告相关接口

### 6.1 获取公告列表
```
GET /notices?page=1&limit=10&type=urgent&status=active
```

### 6.2 获取公告详情
```
GET /notices/{id}
```

### 6.3 创建公告
```
POST /notices
```
**请求参数**:
```json
{
  "title": "紧急救助通知",
  "content": "图书馆附近发现受伤小猫",
  "type": "urgent",
  "priority": 1,
  "icon": "🚨",
  "color": "#FF4444",
  "bg_color": "#FFE6E6",
  "created_by": 1
}
```

## 7. 订单相关接口

### 7.1 创建订单
```
POST /orders
```
**请求参数**:
```json
{
  "user_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 39.90
    }
  ],
  "shipping_address": "北京市朝阳区xxx",
  "remark": "请尽快发货"
}
```

### 7.2 获取用户订单列表
```
GET /user/{user_id}/orders?page=1&limit=10&status=paid
```

### 7.3 更新订单状态
```
PUT /orders/{id}/status
```
**请求参数**:
```json
{
  "status": "paid",
  "payment_method": "wechat",
  "transaction_id": "wx_123456789"
}
```

## 8. 统计相关接口

### 8.1 获取动物统计
```
GET /statistics/animals
```

### 8.2 获取捐赠统计
```
GET /statistics/donations
```

### 8.3 获取商品销售统计
```
GET /statistics/products
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 数据库连接配置示例

### Node.js + MySQL2
```javascript
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'campus_animal_care',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

const pool = mysql.createPool(dbConfig);
```

### PHP + PDO
```php
<?php
$dsn = "mysql:host=localhost;dbname=campus_animal_care;charset=utf8mb4";
$username = "your_username";
$password = "your_password";

try {
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
```

## 部署建议

1. **数据库服务器**: 建议使用云数据库服务（如阿里云RDS、腾讯云CDB）
2. **备份策略**: 每日自动备份，保留30天
3. **监控**: 设置数据库性能监控和告警
4. **安全**: 使用SSL连接，定期更新密码
5. **优化**: 根据查询频率添加合适的索引




