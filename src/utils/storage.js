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
      products = [
        { id: 1, name: '牛奶', categoryId: 1, period: 7, unit: '天' },    // 保质期7天
        { id: 2, name: '矿泉水', categoryId: 3, period: 365, unit: '天' }, // 保质期365天
        { id: 3, name: '饼干', categoryId: 7, period: 6, unit: '月' },     // 保质期6个月
        { id: 4, name: '洗衣液', categoryId: 13, period: 3, unit: '年' }   // 保质期3年
      ];
      this.set(STORAGE_KEYS.PRODUCTS, products);
    }

    let shelfProductBatches = this.get(STORAGE_KEYS.SHELF_PRODUCTS_BATCHES);
    if (shelfProductBatches.length === 0) {
      shelfProductBatches = [
        // 牛奶：两个批次，一个正常，一个临期（便于测试提醒）
        { id: 1, shelfProductId: 1, produceDate: '2026-03-05', expireDate: '2026-03-12', batchnum: 20 },
        { id: 2, shelfProductId: 1, produceDate: '2026-03-01', expireDate: '2026-03-08', batchnum: 10 },
        // 矿泉水：一个批次
        { id: 3, shelfProductId: 2, produceDate: '2025-03-01', expireDate: '2026-03-01', batchnum: 50 },
        // 饼干：两个批次，一个临期，一个正常
        { id: 4, shelfProductId: 3, produceDate: '2025-09-08', expireDate: '2026-03-08', batchnum: 30 },
        { id: 5, shelfProductId: 3, produceDate: '2025-12-01', expireDate: '2026-06-01', batchnum: 20 },
        // 洗衣液：一个批次
        { id: 6, shelfProductId: 4, produceDate: '2023-01-01', expireDate: '2026-01-01', batchnum: 15 }
      ];
      this.set(STORAGE_KEYS.SHELF_PRODUCTS_BATCHES, shelfProductBatches);
    }

    let shelfProducts = this.get(STORAGE_KEYS.SHELF_PRODUCTS);
    if (shelfProducts.length === 0) {
      shelfProducts = [
        { id: 1, shelfId: 1, productId: 1, max: 50 },   // 牛奶 → 饮料区
        { id: 2, shelfId: 1, productId: 2, max: 100 },  // 矿泉水 → 饮料区
        { id: 3, shelfId: 2, productId: 3, max: 80 },   // 饼干 → 零食区
        { id: 4, shelfId: 3, productId: 4, max: 40 }    // 洗衣液 → 日用品区
      ];
      this.set(STORAGE_KEYS.SHELF_PRODUCTS, shelfProducts);
    }

    let expireThreshold = this.getExpireThreshold();

    let shelves = this.get(STORAGE_KEYS.SHELVES);
    if (shelves.length === 0) {
      shelves = [
        { id: 1, name: '饮料区' },
        { id: 2, name: '零食区' },
        { id: 3, name: '日用品区' }
      ];
      this.set(STORAGE_KEYS.SHELVES, shelves);
    }

    let categories = this.get(STORAGE_KEYS.CATEGORIES);
    if (categories.length === 0) {
      categories = [
        { id: 1, name: '乳制品' },
        { id: 2, name: '饮料' },
        { id: 3, name: '矿泉水/纯净水' },
        { id: 4, name: '啤酒' },
        { id: 5, name: '白酒/洋酒' },
        { id: 6, name: '红酒/果酒' },
        { id: 7, name: '休闲零食' },
        { id: 8, name: '方便食品' },
        { id: 9, name: '粮油调味' },
        { id: 10, name: '速冻食品' },
        { id: 11, name: '熟食/面包' },
        { id: 12, name: '槟榔' },
        { id: 13, name: '个人护理' },
        { id: 14, name: '女性护理' },
        { id: 15, name: '家居清洁' },
        { id: 16, name: '纸品' },
        { id: 17, name: '日用百货' },
        { id: 18, name: '小家电/五金' },
        { id: 19, name: '玩具' },
        { id: 20, name: '文体用品' }
      ];
      this.set(STORAGE_KEYS.CATEGORIES, categories);
    }

    // 返回初始化后的完整数据
    return {
      shelves,
      products,
      shelfProducts,
      shelfProductBatches,
      pendingNew: {
        form: {},
        list: []
      },
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