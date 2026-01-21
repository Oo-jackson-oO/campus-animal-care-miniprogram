Component({
    options: {
        multipleSlots: true,
        styleIsolation: 'apply-shared'
    },
    properties: {
        title: {
            type: String,
            value: ''
        },
        subtitle: {
            type: String,
            value: ''
        },
        rightText: {
            type: String,
            value: ''
        },
        showArrow: {
            type: Boolean,
            value: false
        }
    }
});

