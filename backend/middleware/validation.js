/**
 * 数据验证中间件
 * 使用express-validator进行请求参数验证
 */

const { body, query, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 处理验证结果
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));

        logger.warn('请求参数验证失败', {
            url: req.originalUrl,
            method: req.method,
            errors: errorMessages
        });

        return res.status(400).json({
            code: 400,
            message: '请求参数验证失败',
            data: {
                errors: errorMessages
            }
        });
    }

    next();
}

/**
 * 用户相关验证规则
 */
const userValidation = {
    // 用户登录/注册
    login: [
        body('openid')
            .notEmpty()
            .withMessage('openid不能为空')
            .isLength({ min: 1, max: 50 })
            .withMessage('openid长度必须在1-50个字符之间'),
        body('nickname')
            .notEmpty()
            .withMessage('昵称不能为空')
            .isLength({ min: 1, max: 100 })
            .withMessage('昵称长度必须在1-100个字符之间'),
        body('avatar_url')
            .optional()
            .isURL()
            .withMessage('头像URL格式不正确'),
        handleValidationErrors
    ],

    // 更新用户信息
    updateInfo: [
        body('openid')
            .notEmpty()
            .withMessage('openid不能为空'),
        body('phone')
            .optional()
            .isMobilePhone('zh-CN')
            .withMessage('手机号格式不正确'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('邮箱格式不正确'),
        handleValidationErrors
    ]
};

/**
 * 动物相关验证规则
 */
const animalValidation = {
    // 获取动物列表
    getList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('页码必须是大于0的整数'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('每页数量必须在1-100之间'),
        query('species')
            .optional()
            .isIn(['cat', 'dog', 'other'])
            .withMessage('动物种类只能是cat、dog或other'),
        query('status')
            .optional()
            .isInt({ min: 0, max: 1 })
            .withMessage('状态只能是0或1'),
        handleValidationErrors
    ],

    // 获取动物详情
    getById: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('动物ID必须是正整数'),
        handleValidationErrors
    ],

    // 创建动物
    create: [
        body('name')
            .notEmpty()
            .withMessage('动物名称不能为空')
            .isLength({ min: 1, max: 50 })
            .withMessage('动物名称长度必须在1-50个字符之间'),
        body('species')
            .isIn(['cat', 'dog', 'other'])
            .withMessage('动物种类只能是cat、dog或other'),
        body('gender')
            .isInt({ min: 0, max: 2 })
            .withMessage('性别只能是0(未知)、1(雄性)或2(雌性)'),
        body('age_months')
            .isInt({ min: 0, max: 300 })
            .withMessage('年龄必须在0-300个月之间'),
        body('color')
            .optional()
            .isLength({ max: 50 })
            .withMessage('颜色描述不能超过50个字符'),
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('描述不能超过500个字符'),
        body('image_url')
            .optional()
            .isURL()
            .withMessage('图片URL格式不正确'),
        body('location')
            .optional()
            .isLength({ max: 100 })
            .withMessage('位置描述不能超过100个字符'),
        body('sterilized')
            .optional()
            .isBoolean()
            .withMessage('绝育状态必须是布尔值'),
        body('vaccinated')
            .optional()
            .isBoolean()
            .withMessage('疫苗状态必须是布尔值'),
        body('health_status')
            .optional()
            .isIn(['healthy', 'sick', 'injured', 'unknown'])
            .withMessage('健康状态只能是healthy、sick、injured或unknown'),
        body('adoption_status')
            .optional()
            .isIn(['wild', 'adopted', 'adoptable'])
            .withMessage('领养状态只能是wild、adopted或adoptable'),
        handleValidationErrors
    ]
};

/**
 * 商品相关验证规则
 */
const productValidation = {
    // 获取商品列表
    getList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('页码必须是大于0的整数'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('每页数量必须在1-100之间'),
        query('category')
            .optional()
            .isLength({ max: 50 })
            .withMessage('分类名称不能超过50个字符'),
        query('status')
            .optional()
            .isInt({ min: 0, max: 1 })
            .withMessage('状态只能是0或1'),
        handleValidationErrors
    ],

    // 获取商品详情
    getById: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('商品ID必须是正整数'),
        handleValidationErrors
    ],

    // 创建商品评价
    createReview: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('商品ID必须是正整数'),
        body('user_id')
            .isInt({ min: 1 })
            .withMessage('用户ID必须是正整数'),
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('评分必须在1-5之间'),
        body('content')
            .notEmpty()
            .withMessage('评价内容不能为空')
            .isLength({ min: 1, max: 500 })
            .withMessage('评价内容长度必须在1-500个字符之间'),
        body('images')
            .optional()
            .isArray()
            .withMessage('图片必须是数组格式'),
        handleValidationErrors
    ]
};

/**
 * 捐赠相关验证规则
 */
const donationValidation = {
    // 获取捐赠项目列表
    getList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('页码必须是大于0的整数'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('每页数量必须在1-100之间'),
        query('status')
            .optional()
            .isIn(['active', 'completed', 'cancelled'])
            .withMessage('状态只能是active、completed或cancelled'),
        handleValidationErrors
    ],

    // 创建捐赠记录
    createDonation: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('捐赠项目ID必须是正整数'),
        body('user_id')
            .isInt({ min: 1 })
            .withMessage('用户ID必须是正整数'),
        body('amount')
            .isFloat({ min: 0.01, max: 10000 })
            .withMessage('捐赠金额必须在0.01-10000之间'),
        body('payment_method')
            .isIn(['wechat', 'alipay', 'bank'])
            .withMessage('支付方式只能是wechat、alipay或bank'),
        handleValidationErrors
    ]
};

/**
 * 评论相关验证规则
 */
const commentValidation = {
    // 获取评论列表
    getList: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('动物ID必须是正整数'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('页码必须是大于0的整数'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('每页数量必须在1-100之间'),
        handleValidationErrors
    ],

    // 创建评论
    create: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('动物ID必须是正整数'),
        body('user_id')
            .isInt({ min: 1 })
            .withMessage('用户ID必须是正整数'),
        body('content')
            .notEmpty()
            .withMessage('评论内容不能为空')
            .isLength({ min: 1, max: 500 })
            .withMessage('评论内容长度必须在1-500个字符之间'),
        body('parent_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('父评论ID必须是正整数'),
        handleValidationErrors
    ]
};

/**
 * 公告相关验证规则
 */
const noticeValidation = {
    // 获取公告列表
    getList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('页码必须是大于0的整数'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('每页数量必须在1-100之间'),
        query('type')
            .optional()
            .isIn(['urgent', 'normal', 'activity'])
            .withMessage('公告类型只能是urgent、normal或activity'),
        query('status')
            .optional()
            .isIn(['active', 'inactive'])
            .withMessage('状态只能是active或inactive'),
        handleValidationErrors
    ],

    // 创建公告
    create: [
        body('title')
            .notEmpty()
            .withMessage('公告标题不能为空')
            .isLength({ min: 1, max: 100 })
            .withMessage('公告标题长度必须在1-100个字符之间'),
        body('content')
            .notEmpty()
            .withMessage('公告内容不能为空')
            .isLength({ min: 1, max: 1000 })
            .withMessage('公告内容长度必须在1-1000个字符之间'),
        body('type')
            .isIn(['urgent', 'normal', 'activity'])
            .withMessage('公告类型只能是urgent、normal或activity'),
        body('priority')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('优先级必须在1-5之间'),
        body('icon')
            .optional()
            .isLength({ max: 10 })
            .withMessage('图标不能超过10个字符'),
        body('color')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('颜色必须是有效的十六进制颜色值'),
        body('bg_color')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('背景颜色必须是有效的十六进制颜色值'),
        handleValidationErrors
    ]
};

module.exports = {
    userValidation,
    animalValidation,
    productValidation,
    donationValidation,
    commentValidation,
    noticeValidation,
    handleValidationErrors
};

