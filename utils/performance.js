/**
 * 性能监控工具
 * 监控小程序性能，避免重复计算和内存泄漏
 */

class PerformanceMonitor {
    constructor() {
        this.timers = new Map();
        this.memoryUsage = [];
        this.maxMemorySamples = 100;
    }

    /**
     * 开始计时
     * @param {string} name 计时器名称
     */
    startTimer(name) {
        this.timers.set(name, Date.now());
    }

    /**
     * 结束计时
     * @param {string} name 计时器名称
     * @returns {number} 耗时（毫秒）
     */
    endTimer(name) {
        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`计时器 ${name} 未找到`);
            return 0;
        }

        const duration = Date.now() - startTime;
        this.timers.delete(name);

        // 记录性能数据
        this.recordPerformance(name, duration);

        return duration;
    }

    /**
     * 记录性能数据
     * @param {string} operation 操作名称
     * @param {number} duration 耗时
     */
    recordPerformance(operation, duration) {
        const performanceData = {
            operation,
            duration,
            timestamp: Date.now()
        };

        // 检查是否有性能问题
        if (duration > 1000) {
            console.warn(`性能警告: ${operation} 耗时 ${duration}ms`);
        }

        // 存储性能数据（限制数量）
        if (this.memoryUsage.length >= this.maxMemorySamples) {
            this.memoryUsage.shift();
        }
        this.memoryUsage.push(performanceData);
    }

    /**
     * 监控函数执行时间
     * @param {string} name 监控名称
     * @param {Function} fn 要监控的函数
     * @returns {any} 函数执行结果
     */
    monitor(name, fn) {
        this.startTimer(name);
        try {
            const result = fn();
            const duration = this.endTimer(name);

            // 如果是异步函数，需要特殊处理
            if (result && typeof result.then === 'function') {
                return result.then(
                    (res) => {
                        this.endTimer(name);
                        return res;
                    },
                    (err) => {
                        this.endTimer(name);
                        throw err;
                    }
                );
            }

            return result;
        } catch (error) {
            this.endTimer(name);
            throw error;
        }
    }

    /**
     * 监控异步函数
     * @param {string} name 监控名称
     * @param {Function} asyncFn 异步函数
     * @returns {Promise<any>} 执行结果
     */
    async monitorAsync(name, asyncFn) {
        this.startTimer(name);
        try {
            const result = await asyncFn();
            const duration = this.endTimer(name);
            return result;
        } catch (error) {
            this.endTimer(name);
            throw error;
        }
    }

    /**
     * 获取性能统计
     * @returns {Object} 性能统计信息
     */
    getStats() {
        const totalOperations = this.memoryUsage.length;
        if (totalOperations === 0) {
            return { message: '暂无性能数据' };
        }

        const durations = this.memoryUsage.map(item => item.duration);
        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        const avgDuration = totalDuration / totalOperations;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        // 按操作类型分组统计
        const operationStats = {};
        this.memoryUsage.forEach(item => {
            if (!operationStats[item.operation]) {
                operationStats[item.operation] = {
                    count: 0,
                    totalDuration: 0,
                    maxDuration: 0,
                    minDuration: Infinity
                };
            }

            const stats = operationStats[item.operation];
            stats.count++;
            stats.totalDuration += item.duration;
            stats.maxDuration = Math.max(stats.maxDuration, item.duration);
            stats.minDuration = Math.min(stats.minDuration, item.duration);
        });

        // 计算平均值
        Object.keys(operationStats).forEach(operation => {
            const stats = operationStats[operation];
            stats.avgDuration = stats.totalDuration / stats.count;
        });

        return {
            totalOperations,
            totalDuration,
            avgDuration: Math.round(avgDuration),
            maxDuration,
            minDuration,
            operationStats
        };
    }

    /**
     * 清理性能数据
     */
    clear() {
        this.timers.clear();
        this.memoryUsage = [];
    }

    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        const systemInfoManager = require('./systemInfo');
        const systemInfo = systemInfoManager.getSystemInfoSync();
        const memoryInfo = {
            platform: systemInfo.platform,
            version: systemInfo.version,
            timestamp: Date.now()
        };

        // 记录内存信息
        console.log('内存使用情况:', memoryInfo);

        return memoryInfo;
    }

    /**
     * 防抖函数
     * @param {Function} fn 要防抖的函数
     * @param {number} delay 延迟时间
     * @returns {Function} 防抖后的函数
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    /**
     * 节流函数
     * @param {Function} fn 要节流的函数
     * @param {number} delay 延迟时间
     * @returns {Function} 节流后的函数
     */
    throttle(fn, delay = 300) {
        let lastTime = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
