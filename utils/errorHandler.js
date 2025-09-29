/**
 * 错误处理工具
 * 统一处理各种错误情况
 */

class ErrorHandler {
    /**
     * 处理API错误
     * @param {Error} error 错误对象
     * @param {Object} context 上下文信息
     * @returns {Object} 处理后的错误信息
     */
    static handleApiError(error, context = {}) {
        console.error('[API错误]', error, context);

        let errorInfo = {
            code: 'UNKNOWN_ERROR',
            message: '未知错误',
            details: error.message,
            timestamp: new Date().toISOString(),
            context
        };

        // 网络错误
        if (error.errMsg && error.errMsg.includes('request:fail')) {
            errorInfo = {
                code: 'NETWORK_ERROR',
                message: '网络连接失败，请检查网络设置',
                details: error.errMsg,
                timestamp: new Date().toISOString(),
                context
            };
        }
        // 超时错误
        else if (error.errMsg && error.errMsg.includes('timeout')) {
            errorInfo = {
                code: 'TIMEOUT_ERROR',
                message: '请求超时，请稍后重试',
                details: error.errMsg,
                timestamp: new Date().toISOString(),
                context
            };
        }
        // HTTP状态码错误
        else if (error.statusCode) {
            switch (error.statusCode) {
                case 400:
                    errorInfo = {
                        code: 'BAD_REQUEST',
                        message: '请求参数错误',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 401:
                    errorInfo = {
                        code: 'UNAUTHORIZED',
                        message: '未授权访问，请重新登录',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 403:
                    errorInfo = {
                        code: 'FORBIDDEN',
                        message: '禁止访问',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 404:
                    errorInfo = {
                        code: 'NOT_FOUND',
                        message: '请求的资源不存在',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 429:
                    errorInfo = {
                        code: 'RATE_LIMITED',
                        message: '请求过于频繁，请稍后再试',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 500:
                    errorInfo = {
                        code: 'SERVER_ERROR',
                        message: '服务器内部错误',
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                default:
                    errorInfo = {
                        code: 'HTTP_ERROR',
                        message: `HTTP错误 ${error.statusCode}`,
                        details: error.data?.message || error.message,
                        timestamp: new Date().toISOString(),
                        context
                    };
            }
        }
        // 业务逻辑错误
        else if (error.code) {
            errorInfo = {
                code: error.code,
                message: error.message || '业务逻辑错误',
                details: error.details || error.message,
                timestamp: new Date().toISOString(),
                context
            };
        }

        return errorInfo;
    }

    /**
     * 处理数据验证错误
     * @param {Object} validationResult 验证结果
     * @returns {Object} 处理后的错误信息
     */
    static handleValidationError(validationResult) {
        const { errors, warnings } = validationResult;

        let errorMessage = '数据验证失败';
        if (errors.length > 0) {
            errorMessage = errors.map(err =>
                `${err.field}: ${err.errors.join(', ')}`
            ).join('; ');
        }

        return {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            details: {
                errors,
                warnings
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 处理文件上传错误
     * @param {Error} error 错误对象
     * @param {Object} fileInfo 文件信息
     * @returns {Object} 处理后的错误信息
     */
    static handleFileUploadError(error, fileInfo = {}) {
        let errorInfo = {
            code: 'FILE_UPLOAD_ERROR',
            message: '文件上传失败',
            details: error.message,
            timestamp: new Date().toISOString(),
            fileInfo
        };

        if (error.message.includes('size')) {
            errorInfo = {
                code: 'FILE_TOO_LARGE',
                message: '文件大小超出限制',
                details: `文件大小不能超过${fileInfo.maxSize || '5MB'}`,
                timestamp: new Date().toISOString(),
                fileInfo
            };
        } else if (error.message.includes('type')) {
            errorInfo = {
                code: 'INVALID_FILE_TYPE',
                message: '不支持的文件类型',
                details: `只支持${fileInfo.allowedTypes?.join(', ') || '图片文件'}`,
                timestamp: new Date().toISOString(),
                fileInfo
            };
        }

        return errorInfo;
    }

    /**
     * 处理数据库错误
     * @param {Error} error 错误对象
     * @param {Object} context 上下文信息
     * @returns {Object} 处理后的错误信息
     */
    static handleDatabaseError(error, context = {}) {
        let errorInfo = {
            code: 'DATABASE_ERROR',
            message: '数据库操作失败',
            details: error.message,
            timestamp: new Date().toISOString(),
            context
        };

        // MySQL错误码处理
        if (error.code) {
            switch (error.code) {
                case 'ER_DUP_ENTRY':
                    errorInfo = {
                        code: 'DUPLICATE_ENTRY',
                        message: '数据已存在',
                        details: '该记录已存在，请检查后重试',
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 'ER_NO_REFERENCED_ROW_2':
                    errorInfo = {
                        code: 'FOREIGN_KEY_CONSTRAINT',
                        message: '关联数据不存在',
                        details: '引用的数据不存在，请检查关联关系',
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 'ER_ROW_IS_REFERENCED_2':
                    errorInfo = {
                        code: 'ROW_IS_REFERENCED',
                        message: '数据正在被使用',
                        details: '该数据正在被其他记录引用，无法删除',
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
                case 'ECONNREFUSED':
                    errorInfo = {
                        code: 'CONNECTION_REFUSED',
                        message: '数据库连接失败',
                        details: '无法连接到数据库服务器',
                        timestamp: new Date().toISOString(),
                        context
                    };
                    break;
            }
        }

        return errorInfo;
    }

    /**
     * 显示错误提示
     * @param {Object} errorInfo 错误信息
     * @param {Object} options 显示选项
     */
    static showError(errorInfo, options = {}) {
        const {
            showToast = true,
            showModal = false,
            duration = 3000,
            title = '错误提示'
        } = options;

        if (showToast) {
            wx.showToast({
                title: errorInfo.message,
                icon: 'none',
                duration: duration
            });
        }

        if (showModal) {
            wx.showModal({
                title: title,
                content: errorInfo.message,
                showCancel: false,
                confirmText: '确定'
            });
        }

        // 记录错误日志
        console.error('[错误日志]', errorInfo);
    }

    /**
     * 处理异步操作错误
     * @param {Function} asyncFn 异步函数
     * @param {Object} context 上下文信息
     * @param {Object} options 处理选项
     * @returns {Promise<any>} 处理结果
     */
    static async handleAsyncError(asyncFn, context = {}, options = {}) {
        const {
            showError = true,
            fallbackValue = null,
            retryCount = 0,
            retryDelay = 1000
        } = options;

        try {
            return await asyncFn();
        } catch (error) {
            const errorInfo = this.handleApiError(error, context);

            if (showError) {
                this.showError(errorInfo);
            }

            // 重试逻辑
            if (retryCount > 0) {
                console.log(`[重试] ${context.operation || '操作'} 第${retryCount}次重试`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.handleAsyncError(asyncFn, context, {
                    ...options,
                    retryCount: retryCount - 1
                });
            }

            return fallbackValue;
        }
    }

    /**
     * 创建错误边界
     * @param {Function} componentFn 组件函数
     * @param {Object} fallbackComponent 降级组件
     * @returns {Function} 包装后的组件函数
     */
    static createErrorBoundary(componentFn, fallbackComponent = null) {
        return async (...args) => {
            try {
                return await componentFn(...args);
            } catch (error) {
                const errorInfo = this.handleApiError(error, {
                    component: componentFn.name,
                    args
                });

                console.error('[组件错误]', errorInfo);

                if (fallbackComponent) {
                    return fallbackComponent(errorInfo);
                }

                // 默认降级处理
                wx.showToast({
                    title: '页面加载失败',
                    icon: 'none'
                });

                return null;
            }
        };
    }

    /**
     * 全局错误处理
     * @param {Error} error 错误对象
     * @param {Object} context 上下文信息
     */
    static handleGlobalError(error, context = {}) {
        const errorInfo = this.handleApiError(error, context);

        // 记录到错误监控系统
        this.logError(errorInfo);

        // 显示用户友好的错误信息
        this.showError(errorInfo, {
            showToast: true,
            showModal: false
        });
    }

    /**
     * 记录错误日志
     * @param {Object} errorInfo 错误信息
     */
    static logError(errorInfo) {
        // 这里可以集成错误监控服务，如Sentry、Bugsnag等
        console.error('[错误监控]', {
            ...errorInfo,
            userAgent: wx.getSystemInfoSync(),
            timestamp: Date.now()
        });

        // 可以发送到服务器进行错误统计
        // this.sendErrorToServer(errorInfo);
    }
}

module.exports = ErrorHandler;

