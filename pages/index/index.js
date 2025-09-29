const dataService = require('../../utils/dataService');
const logger = require('../../utils/logger');
const systemInfoManager = require('../../utils/systemInfo');

Page({
  data: {
    notices: [],
    products: [],
    animals: [],
    currentNoticeIndex: 0
  },

  async onLoad() {
    logger.pageLifecycle('首页', '加载完成');
    await this.loadData();
  },

  onShow() {
    logger.pageLifecycle('首页', '显示');
  },

  // 加载数据
  async loadData() {
    try {
      // 加载公告数据
      const notices = await dataService.getNotices();
      const processedNotices = Array.isArray(notices) ? notices.map(notice => ({
        ...notice,
        timeAgo: this.formatTimeAgo(notice.createTime)
      })) : [];

      // 加载动物数据
      const animals = await dataService.getAnimals();

      // 加载商品数据
      const products = await dataService.getProducts();

      this.setData({
        notices: processedNotices,
        animals: Array.isArray(animals) ? animals : [],
        products: Array.isArray(products) ? products : []
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间显示
  formatTimeAgo(timeString) {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diff = now - date;

      // 小于1小时
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      }
      // 小于1天
      if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      }
      // 小于7天
      if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前';
      }
      // 超过7天显示具体日期
      return date.toLocaleDateString();
    } catch (error) {
      return timeString;
    }
  },

  // 公告滚动变化事件
  onNoticeChange(e) {
    this.setData({
      currentNoticeIndex: e.detail.current
    });
  },

  // 点击公告卡片
  onNoticeTap(e) {
    const notice = e.currentTarget.dataset.notice;
    if (!notice) return;

    // 根据公告类型显示不同的详情
    let content = '';
    switch (notice.type) {
      case 'urgent':
        content = `【紧急救助】\n${notice.content}\n\n如需帮助，请联系管理员`;
        break;
      case 'activity':
        content = `【活动通知】\n${notice.content}\n\n活动时间：本周内\n参与方式：直接购买文创产品`;
        break;
      case 'collection':
        content = `【故事征集】\n${notice.content}\n\n投稿方式：在动物详情页评论区分享\n奖励：优秀故事将获得特殊徽章`;
        break;
      case 'update':
        content = `【功能更新】\n${notice.content}\n\n更新内容：\n• 商品详情页支持用户评价\n• 优化了页面加载速度\n• 新增了更多互动功能`;
        break;
      case 'recruit':
        content = `【志愿者招募】\n${notice.content}\n\n招募要求：\n• 热爱动物，有责任心\n• 每周至少参与一次活动\n• 有相关经验者优先\n\n报名方式：联系管理员`;
        break;
      default:
        content = notice.content;
    }

    wx.showModal({
      title: notice.title,
      content: content,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '了解更多',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到相关页面或显示更多信息
          this.showMoreInfo(notice);
        }
      }
    });
  },

  // 显示更多信息
  showMoreInfo(notice) {
    let url = '';
    switch (notice.type) {
      case 'urgent':
        // 跳转到守护侠页面
        url = '/pages/calendar/calendar';
        break;
      case 'activity':
        // 跳转到商品页面
        url = '/pages/index/index';
        break;
      case 'collection':
        // 跳转到动物详情页面
        url = '/pages/hero/hero?id=1';
        break;
      case 'update':
        // 跳转到商品详情页面
        url = '/pages/product-detail/product-detail?id=1';
        break;
      case 'recruit':
        // 跳转到个人中心
        url = '/pages/my/my';
        break;
    }

    if (url) {
      wx.navigateTo({
        url: url,
        fail: () => {
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  },

  // 点击动物卡片
  onAnimalTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/hero/hero?id=${id}`,
      fail: (err) => {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 点击产品
  onProductTap(e) {
    const { id } = e.currentTarget.dataset;

    // 验证ID参数
    if (!id || isNaN(parseInt(id))) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${id}`,
      fail: (err) => {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
});