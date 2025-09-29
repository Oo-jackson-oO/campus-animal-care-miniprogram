const logger = require('../../utils/logger');
const performanceMonitor = require('../../utils/performance');

Page({
  data: {
    currentDate: null,      // 当前选择的日期
    weekDays: [],           // 一周日期数据
    currentMonth: 8,        // 当前月份（1-12）
    currentWeek: 1,         // 当前周数（1-5）
    selectedDate: null,     // 选中的日期
    animals: [
      {
        id: 1,
        name: "小橘",
        need: "疫苗接种",
        image: "/image/dog.png",
        donateCurrent: 150,
        donateTarget: 300,
        dates: [] // 动态生成日期
      },
      {
        id: 2,
        name: "雪球",
        need: "购买专用猫粮",
        image: "/image/dog.png",
        donateCurrent: 180,
        donateTarget: 200,
        dates: [] // 动态生成日期
      },
      {
        id: 3,
        name: "奥利奥",
        need: "绝育手术",
        image: "/image/dog.png",
        donateCurrent: 300,
        donateTarget: 600,
        dates: [] // 动态生成日期
      },
      {
        id: 4,
        name: "小橘",
        need: "定期体检",
        image: "/image/dog.png",
        donateCurrent: 80,
        donateTarget: 150,
        dates: [] // 动态生成日期
      },
      {
        id: 5,
        name: "小白",
        need: "驱虫治疗",
        image: "/image/dog.png",
        donateCurrent: 120,
        donateTarget: 250,
        dates: [] // 动态生成日期
      },
      {
        id: 6,
        name: "咪咪",
        need: "眼部护理",
        image: "/image/dog.png",
        donateCurrent: 90,
        donateTarget: 180,
        dates: [] // 动态生成日期
      },
      {
        id: 7,
        name: "大黄",
        need: "腿部康复",
        image: "/image/dog.png",
        donateCurrent: 200,
        donateTarget: 400,
        dates: [] // 动态生成日期
      },
      {
        id: 8,
        name: "小花",
        need: "营养补充",
        image: "/image/dog.png",
        donateCurrent: 60,
        donateTarget: 120,
        dates: [] // 动态生成日期
      },
      {
        id: 9,
        name: "小黑",
        need: "皮肤病治疗",
        image: "/image/dog.png",
        donateCurrent: 150,
        donateTarget: 300,
        dates: [] // 动态生成日期
      },
      {
        id: 10,
        name: "小灰",
        need: "牙齿清洁",
        image: "/image/dog.png",
        donateCurrent: 80,
        donateTarget: 150,
        dates: [] // 动态生成日期
      },
      {
        id: 11,
        name: "小橙",
        need: "耳道清洁",
        image: "/image/dog.png",
        donateCurrent: 70,
        donateTarget: 130,
        dates: [] // 动态生成日期
      },
      {
        id: 12,
        name: "小蓝",
        need: "关节保健",
        image: "/image/dog.png",
        donateCurrent: 180,
        donateTarget: 350,
        dates: [] // 动态生成日期
      }
    ],
    donateInput: {},
    filteredAnimals: [] // 根据选中日期过滤的动物列表
  },

  onLoad() {
    // 使用当前日期作为初始日期
    const initialDate = new Date();
    logger.pageLifecycle('守护侠页面', '加载完成');
    logger.debug('初始日期', initialDate);

    this.setData({
      currentDate: initialDate,
      selectedDate: initialDate
    });

    // 初始化数据，避免重复计算
    this.initializeData();
  },

  // 初始化数据方法
  initializeData() {
    this.generateAnimalDates();
    this.calculateWeekDays();
    this.updateFilteredAnimals();
  },

  // 动态生成动物事项的日期
  generateAnimalDates() {
    const animals = this.data.animals.map((animal, index) => {
      const dates = [];
      const today = new Date();

      // 为每个动物生成未来几周的日期
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date(today);
          date.setDate(today.getDate() + week * 7 + day + index * 2); // 错开不同动物的日期
          dates.push(this.formatDate(date));
        }
      }

      return {
        ...animal,
        dates: dates
      };
    });

    this.setData({ animals });
  },

  // 计算一周日期（周一为起始）
  calculateWeekDays() {
    return performanceMonitor.monitor('calculateWeekDays', () => {
      if (!this.data.currentDate) {
        console.error('currentDate 未初始化');
        return;
      }

      const currentDate = new Date(this.data.currentDate);

      // 防止重复计算
      if (this._lastCalculatedDate &&
        this._lastCalculatedDate.getTime() === currentDate.getTime()) {
        return;
      }

      logger.debug('计算周日期，当前日期', currentDate);
      this._lastCalculatedDate = new Date(currentDate);

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
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        weekDays.push({
          date: date,
          weekDay: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()],
          isCurrentMonth: date.getMonth() === currentDate.getMonth(),
          isToday: this.isToday(date),
          isSelected: this.isSelectedDate(date)
        });
      }

      logger.debug('计算出的周日期', weekDays);

      // 更新月份和周数
      const month = currentDate.getMonth() + 1;
      const week = this.calculateMonthWeek(currentDate);

      this.setData({
        weekDays,
        currentMonth: month,
        currentWeek: week
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

  // 判断是否为今天
  isToday(date) {
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  },

  // 判断是否为选中日期
  isSelectedDate(date) {
    if (!this.data.selectedDate || isNaN(date.getTime())) return false;
    const selected = this.data.selectedDate;
    if (isNaN(selected.getTime())) return false;

    return date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear();
  },

  // 上一周
  prevWeek() {
    if (!this.data.currentDate) return;

    const currentDate = new Date(this.data.currentDate);
    currentDate.setDate(currentDate.getDate() - 7);

    console.log('切换到上一周:', currentDate);

    this.setData({
      currentDate: currentDate,
      selectedDate: currentDate
    }, () => {
      this.calculateWeekDays();
      this.updateFilteredAnimals();
    });
  },

  // 下一周
  nextWeek() {
    if (!this.data.currentDate) return;

    const currentDate = new Date(this.data.currentDate);
    currentDate.setDate(currentDate.getDate() + 7);

    console.log('切换到下一周:', currentDate);

    this.setData({
      currentDate: currentDate,
      selectedDate: currentDate
    }, () => {
      this.calculateWeekDays();
      this.updateFilteredAnimals();
    });
  },

  // 选择日期
  selectDate(date) {
    if (isNaN(date.getTime())) return;

    this.setData({ selectedDate: date });
    // 选择日期时不需要重新计算周日期，只需要更新过滤的动物
    this.updateFilteredAnimals();
  },

  // 点击日期项
  onDateTap(e) {
    const { index } = e.currentTarget.dataset;
    if (index >= 0 && index < this.data.weekDays.length) {
      const selectedDate = this.data.weekDays[index].date;
      this.selectDate(selectedDate);
    }
  },

  // 根据选中日期过滤动物事项
  updateFilteredAnimals() {
    if (!this.data.selectedDate || isNaN(this.data.selectedDate.getTime())) {
      this.setData({ filteredAnimals: this.data.animals });
      return;
    }

    const selectedDateStr = this.formatDate(this.data.selectedDate);
    const filtered = this.data.animals.filter(animal =>
      animal.dates.includes(selectedDateStr)
    );

    this.setData({ filteredAnimals: filtered });
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

    const animals = this.data.animals.map(item => {
      if (item.id === id) {
        item.donateCurrent = Math.min(item.donateCurrent + Number(amount), item.donateTarget);
      }
      return item;
    });

    this.setData({
      animals,
      [`donateInput[${id}]`]: ''
    });

    this.updateFilteredAnimals();

    wx.showToast({ title: '捐款成功' });
  },

  // 页面卸载时清理
  onUnload() {
    // 清理缓存，防止内存泄漏
    this._lastCalculatedDate = null;
  }
});