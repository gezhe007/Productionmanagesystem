// 存储键常量
export const STORAGE_KEYS = {
    PRODUCTS: 'products',
    SHELF_PRODUCTS: 'shelfProducts',
    SHELF_BATCHES: 'shelfBatches',
    SHELVES: 'shelves',
    EXPIRE_THRESHOLD: 'expireWarningThreshold',
    CATEGORIES: 'categories'
};

// 本地存储工具类
export const StorageUtil = {
    // 获取数据
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取数据失败:', e);
            this.showAlert('读取数据失败，请检查本地存储', 'error');
            return [];
        }
    },

    // 设置数据
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            this.showAlert('数据保存失败，请检查本地存储是否可用', 'error');
            return false;
        }
    },

    // 获取临期阈值
    getExpireThreshold() {
        try {
            const threshold = localStorage.getItem(STORAGE_KEYS.EXPIRE_THRESHOLD);
            return threshold ? parseInt(threshold) : 3;
        } catch (e) {
            return 3;
        }
    },

    // 设置临期阈值
    setExpireThreshold(value) {
        try {
            localStorage.setItem(STORAGE_KEYS.EXPIRE_THRESHOLD, value);
            return true;
        } catch (e) {
            console.error('保存阈值失败:', e);
            this.showAlert('保存临期提醒天数失败', 'error');
            return false;
        }
    },

    // 初始化默认数据
    init() {
        // 初始化商品数据（添加ID）
        let products = this.get(STORAGE_KEYS.PRODUCTS);
        if (products.length > 0 && !products[0].id) {
            products = products.map((p, i) => ({
                ...p,
                id: `prod_${Date.now()}_${i}`
            }));
            this.set(STORAGE_KEYS.PRODUCTS, products);
        }

        // 初始化货架商品关联数据
        let shelfProducts = this.get(STORAGE_KEYS.SHELF_PRODUCTS);
        if (shelfProducts.length > 0 && !shelfProducts[0].max) {
            shelfProducts = shelfProducts.map(sp => ({ ...sp, max: 10 }));
            this.set(STORAGE_KEYS.SHELF_PRODUCTS, shelfProducts);
        }

        // 初始化默认数据
        !localStorage.getItem(STORAGE_KEYS.SHELF_PRODUCTS) && this.set(STORAGE_KEYS.SHELF_PRODUCTS, []);
        !localStorage.getItem(STORAGE_KEYS.EXPIRE_THRESHOLD) && this.setExpireThreshold(3);

        // 初始化货架
        let shelves = this.get(STORAGE_KEYS.SHELVES);
        if (shelves.length === 0) {
            shelves = ['货架1', '货架2', '货架3', '货架4', '货架5'];
            this.set(STORAGE_KEYS.SHELVES, shelves);
        }

        // 初始化分类
        let categories = this.get(STORAGE_KEYS.CATEGORIES);
        if (categories.length === 0) {
            categories = ['牛奶', '啤酒', '饮料', '矿泉水', '槟榔', '散装零食', '糖果', '饼干', '薯片', '玩具', '雪糕', '干果',
                '生活用品', '沐浴露', '洗衣液', '蚊香', '洗手液', '洗面奶', '洗发露', '牙刷', '牙膏', '毛巾', '纸巾', '卫生巾', '洗洁精',
                '洗衣粉', '辣条', '榨菜', '瓜子', '花生', '面包', '火腿肠', '泡面', '油', '盐', '罐头', '酱油', '蚝油', '一次性内裤', '充电器',
                '手套', '刷子', '筷子', '袜子', '剃须刀', '唇膏', '白酒', '红酒', '电池', '扑克牌'];
            this.set(STORAGE_KEYS.CATEGORIES, categories);
        }

        return {
            shelves,
            products,
            shelfProducts,
            shelfBatches: this.get(STORAGE_KEYS.SHELF_BATCHES),
            pendingNew: [],
            expireThreshold: this.getExpireThreshold(),
            categories
        };
    },

    // 提示弹窗（复用原有逻辑）
    showAlert(message, type = 'success') {
        // 这里后续结合 ElementUI 的 $message 实现
        const alertEl = document.createElement('div');
        alertEl.className = `el-message el-message--${type}`;
        alertEl.textContent = message;
        document.body.appendChild(alertEl);
        setTimeout(() => alertEl.remove(), 3000);
    }
};