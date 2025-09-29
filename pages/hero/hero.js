const dataService = require('../../utils/dataService');

Page({
  data: {
    animal: {
      id: 1,
      name: "小橘",
      image: "/image/dog.png",
      description: "友善亲人的橘猫",
      status: "健康"
    },
    comments: [],
    commentContent: ""
  },

  async onLoad(options) {
    const animalId = options.id;
    console.log('加载动物详情，ID:', animalId);

    // 验证ID参数
    if (!animalId || isNaN(parseInt(animalId))) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 根据ID加载对应的动物数据
    await this.loadAnimalData(animalId);
    await this.loadComments(animalId);
  },

  // 根据ID加载动物数据
  async loadAnimalData(id) {
    try {
      const animal = await dataService.getAnimalById(parseInt(id));
      if (animal) {
        this.setData({ animal });
      } else {
        wx.showToast({
          title: '动物信息不存在',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载动物数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 加载评论数据
  async loadComments(animalId) {
    try {
      const comments = await dataService.getComments(parseInt(animalId));
      this.setData({ comments });
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  },

  // 输入评论
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 提交评论
  async submitComment() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    const newComment = {
      animalId: this.data.animal.id,
      userId: "user001", // 实际应用中应该从用户信息获取
      userName: "我",
      content: this.data.commentContent,
      likes: 0
    };

    try {
      const success = await dataService.addComment(newComment);
      if (success) {
        // 重新加载评论
        await this.loadComments(this.data.animal.id);
        this.setData({ commentContent: "" });
        wx.showToast({ title: '评论成功' });
      } else {
        wx.showToast({ title: '评论失败', icon: 'none' });
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      wx.showToast({ title: '评论失败', icon: 'none' });
    }
  }
});