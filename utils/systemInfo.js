/**
 * 系统信息工具
 * 使用新的微信小程序API替代已弃用的wx.getSystemInfoSync
 */

const apiCompatibility = require('./apiCompatibility');

class SystemInfoManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5000; // 5秒缓存
    }

    /**
     * 获取系统信息（兼容新旧API）
     * @returns {Promise<Object>} 系统信息
     */
    async getSystemInfo() {
        const cacheKey = 'systemInfo';
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // 使用兼容性检查工具
            const systemInfo = await apiCompatibility.getSystemInfo();
            this.setCached(cacheKey, systemInfo);
            return systemInfo;
        } catch (error) {
            console.warn('获取系统信息失败，使用兼容模式:', error);
            // 降级到旧API
            return this.getSystemInfoSyncCompat();
        }
    }

    /**
     * 获取设备信息
     * @returns {Promise<Object>} 设备信息
     */
    async getDeviceInfo() {
        try {
            return await new Promise((resolve, reject) => {
                wx.getDeviceInfo({
                    success: resolve,
                    fail: reject
                });
            });
        } catch (error) {
            console.warn('获取设备信息失败:', error);
            return {};
        }
    }

    /**
     * 获取窗口信息
     * @returns {Promise<Object>} 窗口信息
     */
    async getWindowInfo() {
        try {
            return await new Promise((resolve, reject) => {
                wx.getWindowInfo({
                    success: resolve,
                    fail: reject
                });
            });
        } catch (error) {
            console.warn('获取窗口信息失败:', error);
            return {};
        }
    }

    /**
     * 获取应用基础信息
     * @returns {Promise<Object>} 应用信息
     */
    async getAppBaseInfo() {
        try {
            return await new Promise((resolve, reject) => {
                wx.getAppBaseInfo({
                    success: resolve,
                    fail: reject
                });
            });
        } catch (error) {
            console.warn('获取应用信息失败:', error);
            return {};
        }
    }

    /**
     * 兼容模式：使用旧的API
     * @returns {Object} 系统信息
     */
    getSystemInfoSyncCompat() {
        try {
            return wx.getSystemInfoSync();
        } catch (error) {
            console.error('获取系统信息失败:', error);
            return {
                platform: 'unknown',
                system: 'unknown',
                version: 'unknown',
                SDKVersion: 'unknown',
                language: 'zh_CN',
                pixelRatio: 1,
                screenWidth: 375,
                screenHeight: 667,
                windowWidth: 375,
                windowHeight: 667,
                statusBarHeight: 20,
                safeArea: {
                    top: 20,
                    bottom: 667,
                    left: 0,
                    right: 375,
                    width: 375,
                    height: 647
                }
            };
        }
    }

    /**
     * 同步获取系统信息（推荐使用异步版本）
     * @returns {Object} 系统信息
     */
    getSystemInfoSync() {
        const cacheKey = 'systemInfoSync';
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        const systemInfo = this.getSystemInfoSyncCompat();
        this.setCached(cacheKey, systemInfo);
        return systemInfo;
    }

    /**
     * 检查是否为开发工具
     * @returns {boolean} 是否为开发工具
     */
    isDevTools() {
        const systemInfo = this.getSystemInfoSync();
        return systemInfo.platform === 'devtools';
    }

    /**
     * 检查是否为iOS
     * @returns {boolean} 是否为iOS
     */
    isIOS() {
        const systemInfo = this.getSystemInfoSync();
        return systemInfo.platform === 'ios';
    }

    /**
     * 检查是否为Android
     * @returns {boolean} 是否为Android
     */
    isAndroid() {
        const systemInfo = this.getSystemInfoSync();
        return systemInfo.platform === 'android';
    }

    /**
     * 获取屏幕尺寸
     * @returns {Object} 屏幕尺寸信息
     */
    getScreenSize() {
        const systemInfo = this.getSystemInfoSync();
        return {
            width: systemInfo.screenWidth,
            height: systemInfo.screenHeight,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            pixelRatio: systemInfo.pixelRatio
        };
    }

    /**
     * 获取安全区域信息
     * @returns {Object} 安全区域信息
     */
    getSafeArea() {
        const systemInfo = this.getSystemInfoSync();
        return systemInfo.safeArea || {
            top: systemInfo.statusBarHeight || 20,
            bottom: systemInfo.screenHeight,
            left: 0,
            right: systemInfo.screenWidth,
            width: systemInfo.screenWidth,
            height: systemInfo.screenHeight - (systemInfo.statusBarHeight || 20)
        };
    }

    /**
     * 获取缓存
     * @param {string} key 缓存键
     * @returns {any} 缓存值
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * 设置缓存
     * @param {string} key 缓存键
     * @param {any} data 缓存数据
     */
    setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

// 创建单例实例
const systemInfoManager = new SystemInfoManager();

module.exports = systemInfoManager;
