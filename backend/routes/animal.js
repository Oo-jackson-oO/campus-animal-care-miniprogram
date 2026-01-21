/**
 * 动物相关路由
 * 处理动物信息查询、创建、更新等操作
 */

const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal');
const { animalValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

const animalModel = new Animal();

/**
 * 获取动物列表
 * GET /api/animals?page=1&limit=10&species=cat&status=1
 */
router.get('/', animalValidation.getList, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            species,
            gender,
            health_status,
            adoption_status
        } = req.query;

        const conditions = {};
        if (species) conditions.species = species;
        if (gender !== undefined) conditions.gender = parseInt(gender);
        if (health_status) conditions.health_status = health_status;
        if (adoption_status) conditions.adoption_status = adoption_status;

        const result = await animalModel.paginate(conditions, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderBy: 'created_at',
            order: 'DESC'
        });

        res.json({
            code: 200,
            message: '获取动物列表成功',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取动物详情
 * GET /api/animals/:id
 */
/**
 * 创建动物信息
 * POST /api/animals
 */
router.post('/', animalValidation.create, async (req, res, next) => {
    try {
        const animalData = {
            ...req.body,
            status: 1,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await animalModel.create(animalData);
        const newAnimal = await animalModel.findById(result.id);

        res.status(201).json({
            code: 201,
            message: '创建动物信息成功',
            data: newAnimal,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 更新动物信息
 * PUT /api/animals/:id
 */
router.put('/:id', animalValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        const result = await animalModel.update(parseInt(id), updateData);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                message: '动物不存在',
                timestamp: Date.now()
            });
        }

        const updatedAnimal = await animalModel.findById(parseInt(id));

        res.json({
            code: 200,
            message: '更新动物信息成功',
            data: updatedAnimal,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 删除动物信息（软删除）
 * DELETE /api/animals/:id
 */
router.delete('/:id', animalValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await animalModel.softDelete(parseInt(id));

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                message: '动物不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '删除动物信息成功',
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取动物统计信息
 * GET /api/animals/stats/overview
 */
router.get('/stats/overview', async (req, res, next) => {
    try {
        const stats = await animalModel.getAnimalStats();

        res.json({
            code: 200,
            message: '获取动物统计信息成功',
            data: stats,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 搜索动物
 * GET /api/animals/search?keyword=xxx&limit=20&offset=0
 */
router.get('/search', async (req, res, next) => {
    try {
        const { keyword, limit = 20, offset = 0 } = req.query;

        if (!keyword || keyword.trim().length === 0) {
            return res.status(400).json({
                code: 400,
                message: '搜索关键词不能为空',
                timestamp: Date.now()
            });
        }

        const animals = await animalModel.searchAnimals(keyword.trim(), {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            code: 200,
            message: '搜索动物成功',
            data: animals,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取动物详情
 * GET /api/animals/:id
 */
router.get('/:id', animalValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;

        const animal = await animalModel.getAnimalDetail(parseInt(id));

        if (!animal) {
            return res.status(404).json({
                code: 404,
                message: '动物不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '获取动物详情成功',
            data: animal,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取热门动物
 * GET /api/animals/popular?limit=5
 */
router.get('/popular', async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;

        if (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 20) {
            return res.status(400).json({
                code: 400,
                message: 'limit参数必须在1-20之间',
                timestamp: Date.now()
            });
        }

        const animals = await animalModel.getPopularAnimals(parseInt(limit));

        res.json({
            code: 200,
            message: '获取热门动物成功',
            data: animals,
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 更新动物状态
 * PUT /api/animals/:id/status
 */
router.put('/:id/status', animalValidation.getById, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                code: 400,
                message: '状态参数不能为空',
                timestamp: Date.now()
            });
        }

        const result = await animalModel.updateStatus(parseInt(id), status);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                message: '动物不存在',
                timestamp: Date.now()
            });
        }

        res.json({
            code: 200,
            message: '更新动物状态成功',
            timestamp: Date.now()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

