const TAB_BAR_PAGE_PATHS = [
    '/pages/index/index',
    '/pages/calendar/calendar',
    '/pages/my/my'
];

function normalizePath(url = '') {
    const [path] = String(url).split('?');
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
}

function isTabBarUrl(url) {
    const path = normalizePath(url);
    return TAB_BAR_PAGE_PATHS.includes(path);
}

function navigate(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('url is required'));
            return;
        }

        if (isTabBarUrl(url)) {
            wx.switchTab({
                url: normalizePath(url),
                success: resolve,
                fail: reject
            });
            return;
        }

        wx.navigateTo({
            url,
            success: resolve,
            fail: reject
        });
    });
}

module.exports = {
    navigate,
    isTabBarUrl
};

