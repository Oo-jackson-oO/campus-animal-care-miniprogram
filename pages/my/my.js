const systemInfoManager = require('../../utils/systemInfo');
const dataService = require('../../utils/dataService');

Page({
  data: {
    weekDonate: 0,
    totalDonate: 0,
    userName: '访客',
    userAvatar: '/image/dog.png',
    favoriteAnimals: [],
    myRank: '-',
    otherRanks: [],
    isFixed: false,
    loading: true
  },

  async onLoad() {
    console.log('个人中心页面加载完成');
    this.setData({ loading: true });
    try {
      const user = await dataService.ensureUser();
      this.setData({
        userName: user.nickname || '访客',
        userAvatar: user.avatar_url || '/image/dog.png'
      });

      const [stats, ranking, animals] = await Promise.all([
        dataService.getUserStats(user.id),
        dataService.getUserRanking(10),
        dataService.getAnimals({ page: 1, limit: 3 })
      ]);

      const rankingList = Array.isArray(ranking) ? ranking : [];
      const me = rankingList.find(r => r.id === user.id);
      const others = rankingList.filter(r => r.id !== user.id);

      this.setData({
        weekDonate: Number(stats?.week_amount) || 0,
        totalDonate: Number(stats?.total_amount) || 0,
        myRank: me?.rank || '-',
        otherRanks: others.map(r => ({
          name: r.nickname,
          amount: Number(r.total_donations) || 0
        })),
        favoriteAnimals: Array.isArray(animals) ? animals.map(a => ({
          id: a.id,
          name: a.name,
          image: a.image,
          description: a.description
        })) : [],
        loading: false
      });
    } catch (error) {
      console.error('加载个人中心数据失败:', error);
      this.setData({ loading: false });
    }
  },

  onShow() {
    if (systemInfoManager.isDevTools()) {
      console.log('个人中心页面显示');
    }
  },

  // 点击收藏的动物
  onFavoriteTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/hero/hero?id=${id}`
    });
  }
});
