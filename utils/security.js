/**
 * 安全工具类
 * 提供数据验证、过滤、加密等安全功能
 */

/**
 * 数据验证工具
 */
class SecurityUtils {
    /**
     * 验证邮箱格式
     * @param {string} email 邮箱地址
     * @returns {boolean} 是否有效
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证手机号格式
     * @param {string} phone 手机号
     * @returns {boolean} 是否有效
     */
    static isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 验证URL格式
     * @param {string} url URL地址
     * @returns {boolean} 是否有效
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证数字范围
     * @param {number} value 数值
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {boolean} 是否在范围内
     */
    static isInRange(value, min, max) {
        return value >= min && value <= max;
    }

    /**
     * 验证字符串长度
     * @param {string} str 字符串
     * @param {number} minLength 最小长度
     * @param {number} maxLength 最大长度
     * @returns {boolean} 是否在长度范围内
     */
    static isValidLength(str, minLength, maxLength) {
        return str.length >= minLength && str.length <= maxLength;
    }

    /**
     * 过滤HTML标签
     * @param {string} str 输入字符串
     * @returns {string} 过滤后的字符串
     */
    static stripHtml(str) {
        return str.replace(/<[^>]*>/g, '');
    }

    /**
     * 转义特殊字符
     * @param {string} str 输入字符串
     * @returns {string} 转义后的字符串
     */
    static escapeHtml(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * 验证文件类型
     * @param {string} filename 文件名
     * @param {Array} allowedTypes 允许的文件类型
     * @returns {boolean} 是否允许
     */
    static isValidFileType(filename, allowedTypes = ['.jpg', '.jpeg', '.png', '.gif']) {
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return allowedTypes.includes(ext);
    }

    /**
     * 验证文件大小
     * @param {number} size 文件大小（字节）
     * @param {number} maxSize 最大大小（字节）
     * @returns {boolean} 是否在限制内
     */
    static isValidFileSize(size, maxSize = 5 * 1024 * 1024) { // 默认5MB
        return size <= maxSize;
    }

    /**
     * 生成随机字符串
     * @param {number} length 长度
     * @returns {string} 随机字符串
     */
    static generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 验证身份证号
     * @param {string} idCard 身份证号
     * @returns {boolean} 是否有效
     */
    static isValidIdCard(idCard) {
        const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return idCardRegex.test(idCard);
    }

    /**
     * 验证密码强度
     * @param {string} password 密码
     * @returns {Object} 验证结果
     */
    static validatePassword(password) {
        const result = {
            isValid: false,
            score: 0,
            suggestions: []
        };

        if (password.length < 6) {
            result.suggestions.push('密码长度至少6位');
        } else {
            result.score += 1;
        }

        if (password.length >= 8) {
            result.score += 1;
        }

        if (/[a-z]/.test(password)) {
            result.score += 1;
        } else {
            result.suggestions.push('建议包含小写字母');
        }

        if (/[A-Z]/.test(password)) {
            result.score += 1;
        } else {
            result.suggestions.push('建议包含大写字母');
        }

        if (/\d/.test(password)) {
            result.score += 1;
        } else {
            result.suggestions.push('建议包含数字');
        }

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.score += 1;
        } else {
            result.suggestions.push('建议包含特殊字符');
        }

        result.isValid = result.score >= 3;

        return result;
    }

    /**
     * 检测SQL注入
     * @param {string} input 输入字符串
     * @returns {boolean} 是否包含SQL注入
     */
    static detectSqlInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
            /(UNION\s+SELECT)/i,
            /(DROP\s+TABLE)/i,
            /(INSERT\s+INTO)/i,
            /(UPDATE\s+SET)/i,
            /(DELETE\s+FROM)/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * 检测XSS攻击
     * @param {string} input 输入字符串
     * @returns {boolean} 是否包含XSS
     */
    static detectXss(input) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>.*?<\/embed>/gi,
            /<link[^>]*>.*?<\/link>/gi,
            /<meta[^>]*>.*?<\/meta>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /onerror\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * 清理用户输入
     * @param {string} input 用户输入
     * @returns {string} 清理后的输入
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // 移除HTML标签
        let cleaned = this.stripHtml(input);

        // 转义特殊字符
        cleaned = this.escapeHtml(cleaned);

        // 移除多余空白
        cleaned = cleaned.trim().replace(/\s+/g, ' ');

        return cleaned;
    }

    /**
     * 验证数据完整性
     * @param {Object} data 数据对象
     * @param {Object} rules 验证规则
     * @returns {Object} 验证结果
     */
    static validateData(data, rules) {
        const errors = [];
        const warnings = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const fieldErrors = [];

            // 必填验证
            if (rule.required && (value === undefined || value === null || value === '')) {
                fieldErrors.push(`${field}是必填项`);
            }

            // 类型验证
            if (value !== undefined && value !== null && value !== '') {
                if (rule.type === 'email' && !this.isValidEmail(value)) {
                    fieldErrors.push(`${field}格式不正确`);
                }
                if (rule.type === 'phone' && !this.isValidPhone(value)) {
                    fieldErrors.push(`${field}格式不正确`);
                }
                if (rule.type === 'url' && !this.isValidUrl(value)) {
                    fieldErrors.push(`${field}格式不正确`);
                }
                if (rule.type === 'number' && isNaN(Number(value))) {
                    fieldErrors.push(`${field}必须是数字`);
                }
                if (rule.type === 'integer' && !Number.isInteger(Number(value))) {
                    fieldErrors.push(`${field}必须是整数`);
                }
            }

            // 长度验证
            if (rule.minLength && value && value.length < rule.minLength) {
                fieldErrors.push(`${field}长度不能少于${rule.minLength}个字符`);
            }
            if (rule.maxLength && value && value.length > rule.maxLength) {
                fieldErrors.push(`${field}长度不能超过${rule.maxLength}个字符`);
            }

            // 范围验证
            if (rule.min !== undefined && value && Number(value) < rule.min) {
                fieldErrors.push(`${field}不能小于${rule.min}`);
            }
            if (rule.max !== undefined && value && Number(value) > rule.max) {
                fieldErrors.push(`${field}不能大于${rule.max}`);
            }

            // 自定义验证
            if (rule.custom && typeof rule.custom === 'function') {
                const customResult = rule.custom(value, data);
                if (customResult !== true) {
                    fieldErrors.push(customResult || `${field}验证失败`);
                }
            }

            // 安全检查
            if (rule.checkSecurity && value) {
                if (this.detectSqlInjection(value)) {
                    warnings.push(`${field}可能包含SQL注入`);
                }
                if (this.detectXss(value)) {
                    warnings.push(`${field}可能包含XSS攻击`);
                }
            }

            if (fieldErrors.length > 0) {
                errors.push({
                    field,
                    errors: fieldErrors
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

module.exports = SecurityUtils;

