/**
 * API兼容性检查工具
 * 检查微信小程序API的可用性，提供降级方案
 */

class ApiCompatibility {
    constructor() {
        this.apiCache = new Map();
    }

    /**
     * 检查API是否可用
     * @param {string} apiName API名称
     * @returns {boolean} 是否可用
     */
    isApiAvailable(apiName) {
        if (this.apiCache.has(apiName)) {
            return this.apiCache.get(apiName);
        }

        const isAvailable = typeof wx[apiName] === 'function';
        this.apiCache.set(apiName, isAvailable);
        return isAvailable;
    }

    /**
     * 安全调用API
     * @param {string} apiName API名称
     * @param {Object} options 调用参数
     * @param {Function} fallback 降级函数
     * @returns {Promise<any>} 调用结果
     */
    async safeCall(apiName, options = {}, fallback = null) {
        if (!this.isApiAvailable(apiName)) {
            if (fallback) {
                return fallback();
            }
            throw new Error(`API ${apiName} 不可用`);
        }

        return new Promise((resolve, reject) => {
            wx[apiName]({
                ...options,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    if (fallback) {
                        resolve(fallback());
                    } else {
                        reject(err);
                    }
                }
            });
        });
    }

    /**
     * 获取系统信息（兼容新旧API）
     * @returns {Promise<Object>} 系统信息
     */
    async getSystemInfo() {
        // 优先使用新API
        if (this.isApiAvailable('getDeviceInfo') &&
            this.isApiAvailable('getWindowInfo') &&
            this.isApiAvailable('getAppBaseInfo')) {

            try {
                const [deviceInfo, windowInfo, appBaseInfo] = await Promise.all([
                    this.safeCall('getDeviceInfo'),
                    this.safeCall('getWindowInfo'),
                    this.safeCall('getAppBaseInfo')
                ]);

                return {
                    ...deviceInfo,
                    ...windowInfo,
                    ...appBaseInfo,
                    // 兼容性字段
                    platform: deviceInfo.platform,
                    system: deviceInfo.system,
                    version: deviceInfo.version,
                    SDKVersion: appBaseInfo.SDKVersion,
                    language: appBaseInfo.language,
                    pixelRatio: windowInfo.pixelRatio,
                    screenWidth: windowInfo.screenWidth,
                    screenHeight: windowInfo.screenHeight,
                    windowWidth: windowInfo.windowWidth,
                    windowHeight: windowInfo.windowHeight,
                    statusBarHeight: windowInfo.statusBarHeight,
                    safeArea: windowInfo.safeArea
                };
            } catch (error) {
                console.warn('新API调用失败，降级到旧API:', error);
            }
        }

        // 降级到旧API
        return this.safeCall('getSystemInfoSync', {}, () => {
            console.warn('系统信息获取失败，使用默认值');
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
        });
    }

    /**
     * 检查API版本兼容性
     * @param {string} requiredVersion 所需版本
     * @returns {boolean} 是否兼容
     */
    isVersionCompatible(requiredVersion) {
        try {
            const systemInfo = wx.getSystemInfoSync();
            const currentVersion = systemInfo.SDKVersion;

            if (!currentVersion || !requiredVersion) {
                return true; // 无法确定版本时，假设兼容
            }

            // 简单的版本比较（可以根据需要改进）
            const current = currentVersion.split('.').map(Number);
            const required = requiredVersion.split('.').map(Number);

            for (let i = 0; i < Math.max(current.length, required.length); i++) {
                const c = current[i] || 0;
                const r = required[i] || 0;

                if (c > r) return true;
                if (c < r) return false;
            }

            return true;
        } catch (error) {
            console.warn('版本检查失败:', error);
            return true; // 检查失败时假设兼容
        }
    }

    /**
     * 获取API使用建议
     * @returns {Object} API使用建议
     */
    getApiRecommendations() {
        const recommendations = {
            systemInfo: {
                deprecated: 'wx.getSystemInfoSync',
                recommended: ['wx.getDeviceInfo', 'wx.getWindowInfo', 'wx.getAppBaseInfo'],
                reason: 'wx.getSystemInfoSync 已弃用，建议使用更具体的API'
            },
            // 可以添加更多API建议
        };

        return recommendations;
    }

    /**
     * 生成兼容性报告
     * @returns {Object} 兼容性报告
     */
    generateCompatibilityReport() {
        const report = {
            timestamp: Date.now(),
            apis: {},
            recommendations: this.getApiRecommendations()
        };

        // 检查常用API
        const commonApis = [
            'getSystemInfoSync',
            'getDeviceInfo',
            'getWindowInfo',
            'getAppBaseInfo',
            'getSystemSetting',
            'getAppAuthorizeSetting'
        ];

        commonApis.forEach(api => {
            report.apis[api] = {
                available: this.isApiAvailable(api),
                deprecated: api === 'getSystemInfoSync'
            };
        });

        return report;
    }
}

// 创建单例实例
const apiCompatibility = new ApiCompatibility();

module.exports = apiCompatibility;

