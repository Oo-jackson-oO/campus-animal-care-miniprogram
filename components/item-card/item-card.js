Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    properties: {
        kind: {
            type: String,
            value: 'animal'
        },
        image: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        desc: {
            type: String,
            value: ''
        },
        price: {
            type: Number,
            value: 0
        },
        originalPrice: {
            type: Number,
            value: 0
        },
        rating: {
            type: Number,
            value: 0
        },
        sales: {
            type: Number,
            value: 0
        }
    },
    methods: {
        onTap() {
            this.triggerEvent('tap');
        }
    }
});

