// src/utils/storage.js

// ========== 统一存储键名常量 ==========
export const STORAGE_KEYS = {
  PRODUCTS: 'products',
  SHELF_PRODUCTS: 'shelfProducts',
  SHELF_BATCHES: 'shelfBatches',
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
        { id: 'p1', name: '方便面', category: '食品', period: 1, unit: '天' },
        { id: 'p2', name: '矿泉水', category: '饮品', period: 1, unit: '天' },
        { id: 'p3', name: '卫生纸', category: '日用品', period: 1, unit: '天' }
      ];
      this.set(STORAGE_KEYS.PRODUCTS, products);
    }
    let shelfBatches = this.get(STORAGE_KEYS.SHELF_BATCHES)
    if (shelfBatches.length===0){
      shelfBatches = []
      this.set(STORAGE_KEYS.SHELF_BATCHES, shelfBatches);
    }
    let shelfProducts = this.get(STORAGE_KEYS.SHELF_PRODUCTS);
    if (shelfBatches.length===0){
      shelfBatches = []
      this.set(STORAGE_KEYS.SHELF_PRODUCTS, shelfProducts);
    }
    let expireThreshold = this.getExpireThreshold()
    let shelves = this.get(STORAGE_KEYS.SHELVES);
    if (shelves.length === 0) {
      shelves = ['货架1', '货架2', '货架3', '货架4', '货架5'];
      this.set(STORAGE_KEYS.SHELVES, shelves);
    }
    let categories = this.get(STORAGE_KEYS.CATEGORIES);
    if (categories.length === 0) {
      categories = [
        '牛奶', '啤酒', '饮料', '矿泉水', '槟榔', '散装零食', '糖果', '饼干', '薯片', '玩具', '雪糕', '干果',
        '生活用品', '沐浴露', '洗衣液', '蚊香', '洗手液', '洗面奶', '洗发露', '牙刷', '牙膏', '毛巾', '纸巾', '卫生巾', '洗洁精',
        '洗衣粉', '辣条', '榨菜', '瓜子', '花生', '面包', '火腿肠', '泡面', '油', '盐', '罐头', '酱油', '蚝油', '一次性内裤', '充电器',
        '手套', '刷子', '筷子', '袜子', '剃须刀', '唇膏', '白酒', '红酒', '电池', '扑克牌'
      ];
      this.set(STORAGE_KEYS.CATEGORIES, categories);
    }

    // 返回初始化后的完整数据
    return {
      shelves,
      products,
      shelfProducts,
      shelfBatches,
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