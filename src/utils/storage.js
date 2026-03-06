// src/utils/storage.js

// ========== 统一存储键名常量 ==========
export const STORAGE_KEYS = {
  PRODUCTS: 'products',
  SHELF_PRODUCTS: 'shelfProducts',
  SHELF_PRODUCTS_BATCHES: 'shelfProductBatches',
  SHELVES: 'shelves',
  EXPIRE_THRESHOLD: 'expireWarningThreshold',
  CATEGORIES: 'categories'
};

// ========== 本地存储封装工具（纯工具函数，无业务逻辑） ==========
export const Storage = {
  /**
   * 从本地存储读取数据
   * @param {string} key 存储键名
   * @returns {any} 解析后的数据（默认空数组）
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`读取存储[${key}]失败:`, e);
      return [];
    }
  },

  /**
   * 保存数据到本地存储
   * @param {string} key 存储键名
   * @param {any} data 要存储的数据
   * @returns {boolean} 是否保存成功
   */
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`保存存储[${key}]失败:`, e);
      return false;
    }
  },

  /**
   * 获取临期阈值（单独处理数值解析）
   * @returns {number} 临期阈值天数（默认3天）
   */
  getExpireThreshold() {
    try {
      const threshold = localStorage.getItem(STORAGE_KEYS.EXPIRE_THRESHOLD);
      return threshold ? parseInt(threshold) : 7;
    } catch (e) {
      console.error('读取临期阈值失败:', e);
      return 3;
    }
  },

  /**
   * 设置临期阈值
   * @param {number} value 阈值天数
   * @returns {boolean} 是否设置成功
   */
  setExpireThreshold(value) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPIRE_THRESHOLD, value);
      return true;
    } catch (e) {
      console.error('保存临期阈值失败:', e);
      return false;
    }
  },

  /**
   * 初始化默认数据（设置默认值）
   * @returns {object} 初始化后的基础数据对象
   */
  init() {
    let products = this.get(STORAGE_KEYS.PRODUCTS);
    if (products.length === 0) {
      products = [  // 测试商品（无数据时用）
        { id: 1, name: '牛奶', categoryId: 1, period: 1, unit: '天' },
        { id: 2, name: '矿泉水', categoryId: 4, period: 2, unit: '天' },
        { id: 3, name: '卫生纸', categoryId: 13, period: 3, unit: '天' }
      ];
      this.set(STORAGE_KEYS.PRODUCTS, products);
    }
    let shelfProductBatches = this.get(STORAGE_KEYS.SHELF_PRODUCTS_BATCHES)
    if (shelfProductBatches.length === 0) {
      shelfProductBatches = [
        { id: 1, shelfProductId: 1, produceDate: '2026-03-06', expireDate: '2026-03-07', batchnum: 5 },
        { id: 2, shelfProductId: 2, produceDate: '2026-03-06', expireDate: '2026-03-08', batchnum: 4 },
        { id: 3, shelfProductId: 3, produceDate: '2026-03-06', expireDate: '2026-03-07', batchnum: 3 },
      ]
      this.set(STORAGE_KEYS.SHELF_PRODUCTS_BATCHES, shelfProductBatches);
    }
    let shelfProducts = this.get(STORAGE_KEYS.SHELF_PRODUCTS);
    if (shelfProducts.length === 0) {
      shelfProducts = [
        { id: 1, shelfId: 1, productId: 1, max: 10 },
        { id: 2, shelfId: 1, productId: 2, max: 10 },
        { id: 3, shelfId: 2, productId: 1, max: 10 },
      ]
      this.set(STORAGE_KEYS.SHELF_PRODUCTS, shelfProducts);
    }
    let expireThreshold = this.getExpireThreshold()
    let shelves = this.get(STORAGE_KEYS.SHELVES);
    if (shelves.length === 0) {
      shelves = [
        { id: 1, name: '货架1' },
        { id: 2, name: '货架2' },
        { id: 3, name: '货架3' },
        { id: 4, name: '货架4' },
        { id: 5, name: '货架5' }];
      this.set(STORAGE_KEYS.SHELVES, shelves);
    }
    let categories = this.get(STORAGE_KEYS.CATEGORIES);
    if (categories.length === 0) {
      categories = [
        { id: 1, name: '牛奶' },
        { id: 2, name: '啤酒' },
        { id: 3, name: '饮料' },
        { id: 4, name: '矿泉水' },
        { id: 5, name: '槟榔' },
        { id: 6, name: '散装零食' },
        { id: 7, name: '糖果' },
        { id: 8, name: '饼干' },
        { id: 9, name: '薯片' },
        { id: 10, name: '玩具' },
        { id: 11, name: '雪糕' },
        { id: 12, name: '干果' },
        { id: 13, name: '生活用品' },
        { id: 14, name: '沐浴露' },
        { id: 15, name: '洗衣液' },
        { id: 16, name: '蚊香' },
        { id: 17, name: '洗手液' },
        { id: 18, name: '洗面奶' },
        { id: 19, name: '洗发露' },
        { id: 20, name: '牙刷' },
        { id: 21, name: '牙膏' },
        { id: 22, name: '毛巾' },
        { id: 23, name: '纸巾' },
        { id: 24, name: '卫生巾' },
        { id: 25, name: '洗洁精' },
        { id: 26, name: '洗衣粉' },
        { id: 27, name: '辣条' },
        { id: 28, name: '榨菜' },
        { id: 29, name: '瓜子' },
        { id: 30, name: '花生' },
        { id: 31, name: '面包' },
        { id: 32, name: '火腿肠' },
        { id: 33, name: '泡面' },
        { id: 34, name: '油' },
        { id: 35, name: '盐' },
        { id: 36, name: '罐头' },
        { id: 37, name: '酱油' },
        { id: 38, name: '蚝油' },
        { id: 39, name: '一次性内裤' },
        { id: 40, name: '充电器' },
        { id: 41, name: '手套' },
        { id: 42, name: '刷子' },
        { id: 43, name: '筷子' },
        { id: 44, name: '袜子' },
        { id: 45, name: '剃须刀' },
        { id: 46, name: '唇膏' },
        { id: 47, name: '白酒' },
        { id: 48, name: '红酒' },
        { id: 49, name: '电池' },
        { id: 50, name: '扑克牌' }
      ];
      this.set(STORAGE_KEYS.CATEGORIES, categories);
    }

    // 返回初始化后的完整数据
    return {
      shelves,
      products,
      shelfProducts,
      shelfProductBatches,
      pendingNew: [],
      expireThreshold,
      categories
    };
  },

  /**
   * 清空指定键的存储数据
   * @param {string} key 存储键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`清空存储[${key}]失败:`, e);
    }
  }
};