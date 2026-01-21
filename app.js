// app.js
const dataService = require('./utils/dataService');

App({
  async onLaunch() {
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    try {
      const user = await dataService.ensureUser();
      this.globalData.userInfo = user;
    } catch (error) {
      console.error('初始化用户失败:', error);
    }
  },
  globalData: {
    userInfo: null
  }
})
