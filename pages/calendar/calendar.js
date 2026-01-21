const logger = require('../../utils/logger');
const performanceMonitor = require('../../utils/performance');
const dataService = require('../../utils/dataService');

Page({
  data: {
    currentDateStr: '',     // 当前日期（YYYY-MM-DD）
    weekDays: [],           // 一周日期数据
    currentMonth: 8,        // 当前月份（1-12）
    currentWeek: 1,         // 当前周数（1-5）
    selectedDateStr: '',    // 选中的日期（YYYY-MM-DD）
    animals: [],
    donateInput: {},
    filteredAnimals: [], // 根据选中日期过滤的动物列表
    loading: true
  },

  async onLoad() {
    // 使用当前日期作为初始日期
    const initialDate = new Date();
    logger.pageLifecycle('守护侠页面', '加载完成');
    logger.debug('初始日期', initialDate);

    this._currentDate = initialDate;
    const initialDateStr = this.formatDate(initialDate);
    this.setData({
      currentDateStr: initialDateStr,
      selectedDateStr: initialDateStr
    });

    // 初始化数据，避免重复计算
    this.initializeData();
    await this.loadDonationProjects();
  },

  // 初始化数据方法
  initializeData() {
    this.calculateWeekDays();
    this.updateFilteredAnimals();
  },

  async loadDonationProjects() {
    this.setData({ loading: true });
    try {
      const donations = await dataService.getDonations({ limit: 100 });
      const animals = donations.map((d) => ({
        id: d.id,
        name: d.title,
        need: d.description,
        image: d.image,
        donateCurrent: d.currentAmount,
        donateTarget: d.targetAmount,
        startDate: d.startDate,
        endDate: d.endDate
      }));
      this.setData({ animals, loading: false }, () => {
        this.updateFilteredAnimals();
      });
    } catch (error) {
      console.error('加载捐赠项目失败:', error);
      this.setData({ animals: [], filteredAnimals: [], loading: false });
    }
  },

  // 计算一周日期（周一为起始）
  calculateWeekDays() {
    return performanceMonitor.monitor('calculateWeekDays', () => {
      if (!this._currentDate) {
        console.error('currentDate 未初始化');
        return;
      }

      const currentDate = new Date(this._currentDate);
      const currentDateStr = this.formatDate(currentDate);
      const cacheKey = `${currentDateStr}|${this.data.selectedDateStr || ''}`;

      // 防止重复计算
      if (this._lastCalculatedKey && this._lastCalculatedKey === cacheKey) {
        return;
      }

      logger.debug('计算周日期，当前日期', currentDate);
      this._lastCalculatedKey = cacheKey;

      if (isNaN(currentDate.getTime())) {
        console.error('currentDate 是无效日期');
        return;
      }

      const firstDayOfWeek = new Date(currentDate);
      const weekDay = currentDate.getDay();
      // 调整为周一为一周第一天（周日则减6天，其他减 weekDay-1 天）
      firstDayOfWeek.setDate(
        currentDate.getDate() - (weekDay === 0 ? 6 : weekDay - 1)
      );

      const weekDays = [];
      const todayStr = this.formatDate(new Date());
      const selectedDateStr = this.data.selectedDateStr;
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        const dateStr = this.formatDate(date);
        weekDays.push({
          dateStr,
          dayNum: date.getDate(),
          weekDay: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
          isCurrentMonth: date.getMonth() === currentDate.getMonth(),
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr
        });
      }

      logger.debug('计算出的周日期', weekDays);

      // 更新月份和周数
      const month = currentDate.getMonth() + 1;
      const week = this.calculateMonthWeek(currentDate);

      this.setData({
        weekDays,
        currentMonth: month,
        currentWeek: week,
        currentDateStr: currentDateStr
      });

      logger.debug('设置数据完成', { month, week });
    });
  },

  // 计算是本月第几周（核心算法）
  calculateMonthWeek(date) {
    if (isNaN(date.getTime())) {
      console.error('传入的日期无效');
      return 1;
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayWeek = firstDay.getDay();
    // 周一为一周起始（周日则 offset 为 6，其他为 weekDay-1）
    const offset = (firstDayWeek === 0 ? 6 : firstDayWeek - 1);

    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + offset) / 7);
  },

  // 上一周
  prevWeek() {
    if (!this._currentDate) return;

    const currentDate = new Date(this._currentDate);
    currentDate.setDate(currentDate.getDate() - 7);

    console.log('切换到上一周:', currentDate);

    this._currentDate = currentDate;
    const currentDateStr = this.formatDate(currentDate);
    this.setData({
      currentDateStr: currentDateStr,
      selectedDateStr: currentDateStr
    }, () => {
      this.calculateWeekDays();
      this.updateFilteredAnimals();
    });
  },

  // 下一周
  nextWeek() {
    if (!this._currentDate) return;

    const currentDate = new Date(this._currentDate);
    currentDate.setDate(currentDate.getDate() + 7);

    console.log('切换到下一周:', currentDate);

    this._currentDate = currentDate;
    const currentDateStr = this.formatDate(currentDate);
    this.setData({
      currentDateStr: currentDateStr,
      selectedDateStr: currentDateStr
    }, () => {
      this.calculateWeekDays();
      this.updateFilteredAnimals();
    });
  },

  // 选择日期
  selectDate(dateStr) {
    if (!dateStr) return;
    this.setData({ selectedDateStr: dateStr }, () => {
      this.calculateWeekDays();
      this.updateFilteredAnimals();
    });
  },

  // 点击日期项
  onDateTap(e) {
    const { index } = e.currentTarget.dataset;
    if (index >= 0 && index < this.data.weekDays.length) {
      const selectedDateStr = this.data.weekDays[index].dateStr;
      this.selectDate(selectedDateStr);
    }
  },

  safePercent(current, target) {
    const currentNumber = Number(current);
    const targetNumber = Number(target);
    if (!targetNumber || isNaN(currentNumber) || isNaN(targetNumber)) return 0;
    return Math.max(0, Math.min(100, (currentNumber / targetNumber) * 100));
  },

  // 根据选中日期过滤动物事项
  updateFilteredAnimals() {
    const selectedDateStr = this.data.selectedDateStr;
    if (!selectedDateStr) {
      const normalized = this.data.animals.map(item => ({
        ...item,
        percent: this.safePercent(item.donateCurrent, item.donateTarget)
      }));
      this.setData({ filteredAnimals: normalized });
      return;
    }

    const filtered = this.data.animals.filter((item) => {
      if (!item.startDate || !item.endDate) return true;
      return selectedDateStr >= item.startDate && selectedDateStr <= item.endDate;
    });

    const normalized = filtered.map(item => ({
      ...item,
      percent: this.safePercent(item.donateCurrent, item.donateTarget)
    }));

    this.setData({ filteredAnimals: normalized });
    logger.debug('过滤后的事项数量', filtered.length);
  },

  // 格式化日期为 YYYY-MM-DD 格式
  formatDate(date) {
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 输入捐款金额
  onDonateInput(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      [`donateInput[${id}]`]: e.detail.value
    });
  },

  // 捐款逻辑
  handleDonate(e) {
    const { id } = e.currentTarget.dataset;
    const amount = this.data.donateInput[id];
    if (!amount || isNaN(amount) || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '处理中...' });
    dataService.updateDonationAmount(id, amount)
      .then(() => {
        wx.hideLoading();
        this.setData({ [`donateInput[${id}]`]: '' });
        wx.showToast({ title: '捐款成功' });
        return this.loadDonationProjects();
      })
      .catch((error) => {
        wx.hideLoading();
        console.error('捐款失败:', error);
        wx.showToast({ title: '捐款失败', icon: 'none' });
      });
  },

  // 页面卸载时清理
  onUnload() {
    // 清理缓存，防止内存泄漏
    this._lastCalculatedDateStr = null;
    this._lastCalculatedKey = null;
    this._currentDate = null;
  }
});
