const dataService = require('../../utils/dataService');

Page({
    data: {
        product: null,
        reviews: [],
        currentImageIndex: 0,
        quantity: 1,
        showImagePreview: false,
        loading: true
    },

    async onLoad(options) {
        const productId = options.id;

        // 验证ID参数
        if (!productId || isNaN(parseInt(productId))) {
            wx.showToast({
                title: '商品不存在',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
            return;
        }

        await this.loadProductData(parseInt(productId));
        await this.loadReviews(parseInt(productId));
    },

    // 加载商品数据
    async loadProductData(id) {
        try {
            const product = await dataService.getProductById(id);
            if (product) {
                this.setData({
                    product,
                    loading: false
                });
            } else {
                wx.showToast({
                    title: '商品不存在',
                    icon: 'none'
                });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
        } catch (error) {
            console.error('加载商品数据失败:', error);
            wx.showToast({
                title: '数据加载失败',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },

    // 加载评价数据
    async loadReviews(productId) {
        try {
            const reviews = await dataService.getProductReviews(productId);
            // 格式化时间显示
            const formattedReviews = Array.isArray(reviews) ? reviews.map(review => ({
                ...review,
                createTime: this.formatTime(review.createTime)
            })) : [];
            this.setData({ reviews: formattedReviews });
        } catch (error) {
            console.error('加载评价失败:', error);
        }
    },

    // 格式化时间
    formatTime(timeString) {
        if (!timeString) return '';
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diff = now - date;

            // 小于1分钟
            if (diff < 60000) {
                return '刚刚';
            }
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

    // 预览图片
    previewImage(e) {
        const { index } = e.currentTarget.dataset;
        const { product } = this.data;

        if (product && product.images) {
            wx.previewImage({
                current: product.images[index || 0],
                urls: product.images
            });
        }
    },

    // 切换图片
    onImageChange(e) {
        const { index } = e.currentTarget.dataset;
        console.log('点击指示器，索引:', index);
        this.setData({ currentImageIndex: parseInt(index) });
    },

    // swiper变化事件
    onSwiperChange(e) {
        console.log('swiper变化，当前索引:', e.detail.current);
        this.setData({ currentImageIndex: e.detail.current });
    },

    // 数量减少
    decreaseQuantity() {
        if (this.data.quantity > 1) {
            this.setData({
                quantity: this.data.quantity - 1
            });
        }
    },

    // 数量增加
    increaseQuantity() {
        const { product } = this.data;
        if (product && this.data.quantity < product.stock) {
            this.setData({
                quantity: this.data.quantity + 1
            });
        } else {
            wx.showToast({
                title: '库存不足',
                icon: 'none'
            });
        }
    },

    // 输入数量
    onQuantityInput(e) {
        const value = parseInt(e.detail.value);
        const { product } = this.data;

        if (isNaN(value) || value < 1) {
            this.setData({ quantity: 1 });
            return;
        }

        if (product && value > product.stock) {
            this.setData({ quantity: product.stock });
            wx.showToast({
                title: '库存不足',
                icon: 'none'
            });
            return;
        }

        this.setData({ quantity: value });
    },

    // 立即购买
    buyNow() {
        const { product, quantity } = this.data;

        if (!product) {
            wx.showToast({
                title: '商品信息错误',
                icon: 'none'
            });
            return;
        }

        if (quantity > product.stock) {
            wx.showToast({
                title: '库存不足',
                icon: 'none'
            });
            return;
        }

        // 模拟购买流程
        wx.showModal({
            title: '确认购买',
            content: `确定购买 ${product.name} x${quantity} 件，总价 ¥${(product.price * quantity).toFixed(2)} 吗？`,
            success: (res) => {
                if (res.confirm) {
                    this.processPurchase();
                }
            }
        });
    },

    // 处理购买
    processPurchase() {
        const { product, quantity } = this.data;

        // 模拟购买成功
        wx.showLoading({
            title: '处理中...'
        });

        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '购买成功！',
                icon: 'success'
            });

            // 更新库存
            const updatedProduct = {
                ...product,
                stock: product.stock - quantity,
                sales: product.sales + quantity
            };

            this.setData({ product: updatedProduct });

            // 模拟跳转到订单页面
            setTimeout(() => {
                wx.showToast({
                    title: '感谢您的购买！',
                    icon: 'success'
                });
            }, 1500);
        }, 2000);
    },

    // 加入购物车
    addToCart() {
        const { product, quantity } = this.data;

        if (!product) {
            wx.showToast({
                title: '商品信息错误',
                icon: 'none'
            });
            return;
        }

        if (quantity > product.stock) {
            wx.showToast({
                title: '库存不足',
                icon: 'none'
            });
            return;
        }

        // 模拟加入购物车
        wx.showToast({
            title: '已加入购物车',
            icon: 'success'
        });
    },

    // 分享商品
    onShareAppMessage() {
        const { product } = this.data;
        return {
            title: product ? product.name : '校园流浪动物守护',
            path: `/pages/product-detail/product-detail?id=${product ? product.id : 1}`,
            imageUrl: product ? product.image : ''
        };
    }
});
