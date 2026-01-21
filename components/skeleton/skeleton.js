Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    properties: {
        rows: {
            type: Number,
            value: 3,
            observer() {
                this.updateRows();
            }
        },
        avatar: {
            type: Boolean,
            value: false
        }
    },
    data: {
        rowArray: []
    },
    lifetimes: {
        attached() {
            this.updateRows();
        }
    },
    methods: {
        updateRows() {
            const rows = Math.max(1, Math.min(10, Number(this.data.rows) || 3));
            const rowArray = Array.from({ length: rows }).map((_, i) => String(i));
            this.setData({ rowArray });
        }
    }
});

