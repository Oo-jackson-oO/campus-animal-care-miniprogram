const systemInfoManager = require('../../utils/systemInfo');

Page({
  data: {
    weekDonate: 500,
    totalDonate: 2000,
    favoriteAnimals: [
      { id: 1, name: "小橘", image: "/image/dog.png", description: "友善亲人的橘猫" }
    ],
    myRank: 5,
    otherRanks: [
      { name: "爱心天使", amount: 3000 },
      { name: "守护者", amount: 2500 },
      { name: "暖心人", amount: 2200 },
      { name: "小太阳", amount: 2100 }
    ],
    isFixed: false
  },

  onLoad() {
    console.log('个人中心页面加载完成');
  },

  onShow() {
    // 减少重复日志输出
    if (!systemInfoManager.isDevTools()) {
      console.log('个人中心页面显示');
    }
  },

  onPageScroll(e) {
    // 监听滚动，固定自己排名在顶部
    const query = wx.createSelectorQuery().in(this);
    query.select('#myRank').boundingClientRect(rect => {
      if (rect && e.scrollTop > rect.top) {
        this.setData({ isFixed: true });
      } else {
        this.setData({ isFixed: false });
      }
    }).exec();
  },

  // 点击收藏的动物
  onFavoriteTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/hero/hero?id=${id}`
    });
  }
});