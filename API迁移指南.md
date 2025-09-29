# 微信小程序API迁移指南

## 🚨 弃用警告修复

### 问题描述
```
wx.getSystemInfoSync is deprecated.
Please use wx.getSystemSetting/wx.getAppAuthorizeSetting/wx.getDeviceInfo/wx.getWindowInfo/wx.getAppBaseInfo instead.
```

### 解决方案

#### 1. 新增工具文件

##### `utils/systemInfo.js` - 系统信息管理工具
- 使用新的API替代已弃用的 `wx.getSystemInfoSync`
- 提供兼容性降级方案
- 支持缓存机制，提高性能

##### `utils/apiCompatibility.js` - API兼容性检查工具
- 检查API可用性
- 提供安全调用机制
- 生成兼容性报告

#### 2. 使用方式

##### 旧方式（已弃用）
```javascript
// ❌ 不推荐
const systemInfo = wx.getSystemInfoSync();
const isDev = systemInfo.platform === 'devtools';
```

##### 新方式（推荐）
```javascript
// ✅ 推荐
const systemInfoManager = require('../../utils/systemInfo');

// 异步获取（推荐）
const systemInfo = await systemInfoManager.getSystemInfo();

// 同步获取（兼容模式）
const systemInfo = systemInfoManager.getSystemInfoSync();

// 便捷方法
const isDev = systemInfoManager.isDevTools();
const isIOS = systemInfoManager.isIOS();
const isAndroid = systemInfoManager.isAndroid();
```

#### 3. 具体API替换

| 旧API | 新API | 说明 |
|-------|-------|------|
| `wx.getSystemInfoSync()` | `wx.getDeviceInfo()` + `wx.getWindowInfo()` + `wx.getAppBaseInfo()` | 系统信息 |
| - | `wx.getSystemSetting()` | 系统设置 |
| - | `wx.getAppAuthorizeSetting()` | 应用授权设置 |

#### 4. 代码更新示例

##### 日志工具更新
```javascript
// 旧代码
class Logger {
  constructor() {
    this.isDev = wx.getSystemInfoSync().platform === 'devtools';
  }
}

// 新代码
const systemInfoManager = require('./systemInfo');

class Logger {
  constructor() {
    this.isDev = systemInfoManager.isDevTools();
  }
}
```

##### 页面代码更新
```javascript
// 旧代码
onShow() {
  if (wx.getSystemInfoSync().platform !== 'devtools') {
    console.log('页面显示');
  }
}

// 新代码
const systemInfoManager = require('../../utils/systemInfo');

onShow() {
  if (!systemInfoManager.isDevTools()) {
    console.log('页面显示');
  }
}
```

## 🔧 技术实现

### 1. 兼容性处理

#### 新API优先，旧API降级
```javascript
async getSystemInfo() {
  try {
    // 优先使用新API
    const [deviceInfo, windowInfo, appBaseInfo] = await Promise.all([
      this.getDeviceInfo(),
      this.getWindowInfo(),
      this.getAppBaseInfo()
    ]);
    
    return {
      ...deviceInfo,
      ...windowInfo,
      ...appBaseInfo
    };
  } catch (error) {
    // 降级到旧API
    return wx.getSystemInfoSync();
  }
}
```

#### API可用性检查
```javascript
isApiAvailable(apiName) {
  return typeof wx[apiName] === 'function';
}

async safeCall(apiName, options = {}, fallback = null) {
  if (!this.isApiAvailable(apiName)) {
    return fallback ? fallback() : null;
  }
  
  return new Promise((resolve, reject) => {
    wx[apiName]({
      ...options,
      success: resolve,
      fail: fallback ? () => resolve(fallback()) : reject
    });
  });
}
```

### 2. 性能优化

#### 缓存机制
```javascript
getCached(key) {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
    return cached.data;
  }
  return null;
}

setCached(key, data) {
  this.cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

#### 便捷方法
```javascript
// 常用判断方法
isDevTools() {
  const systemInfo = this.getSystemInfoSync();
  return systemInfo.platform === 'devtools';
}

isIOS() {
  const systemInfo = this.getSystemInfoSync();
  return systemInfo.platform === 'ios';
}

isAndroid() {
  const systemInfo = this.getSystemInfoSync();
  return systemInfo.platform === 'android';
}
```

## 📊 迁移效果

### 1. 警告消除
- ✅ 消除 `wx.getSystemInfoSync` 弃用警告
- ✅ 使用新的推荐API
- ✅ 保持向后兼容性

### 2. 性能提升
- ✅ 添加缓存机制，减少重复调用
- ✅ 异步API调用，避免阻塞
- ✅ 智能降级，确保稳定性

### 3. 代码质量
- ✅ 统一API管理
- ✅ 更好的错误处理
- ✅ 清晰的代码结构

## 🚀 使用建议

### 1. 立即更新
- 将所有 `wx.getSystemInfoSync()` 替换为 `systemInfoManager.getSystemInfoSync()`
- 使用便捷方法如 `isDevTools()`, `isIOS()`, `isAndroid()`

### 2. 逐步迁移
- 优先更新核心功能
- 保持旧代码作为降级方案
- 测试新API的兼容性

### 3. 监控和测试
- 使用 `apiCompatibility.generateCompatibilityReport()` 检查API状态
- 在不同设备和版本上测试
- 监控性能影响

## 🔍 故障排除

### 1. 常见问题

#### API不可用
```javascript
// 检查API可用性
const apiCompatibility = require('./apiCompatibility');
console.log(apiCompatibility.isApiAvailable('getDeviceInfo'));
```

#### 降级失败
```javascript
// 使用默认值
const systemInfo = systemInfoManager.getSystemInfoSync() || {
  platform: 'unknown',
  system: 'unknown',
  // ... 其他默认值
};
```

### 2. 调试工具

#### 兼容性报告
```javascript
const apiCompatibility = require('./apiCompatibility');
const report = apiCompatibility.generateCompatibilityReport();
console.log('API兼容性报告:', report);
```

#### 系统信息检查
```javascript
const systemInfoManager = require('./systemInfo');
const systemInfo = await systemInfoManager.getSystemInfo();
console.log('系统信息:', systemInfo);
```

## 📝 更新清单

### 已更新文件
- [x] `utils/systemInfo.js` - 新增系统信息管理工具
- [x] `utils/apiCompatibility.js` - 新增API兼容性检查工具
- [x] `utils/logger.js` - 更新使用新的系统信息API
- [x] `utils/performance.js` - 更新使用新的系统信息API
- [x] `pages/index/index.js` - 更新使用新的系统信息API
- [x] `pages/my/my.js` - 更新使用新的系统信息API

### 待更新文件
- [ ] 其他页面文件（如需要）
- [ ] 其他工具文件（如需要）

---

**更新时间**: 2025年9月29日  
**影响范围**: 所有使用 `wx.getSystemInfoSync` 的文件  
**兼容性**: 支持新旧API，自动降级

