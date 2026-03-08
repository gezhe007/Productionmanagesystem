// src/store/index.js

import Vue from 'vue'
import Vuex from 'vuex'
import { Storage, STORAGE_KEYS } from '@/utils/storage.js'

Vue.use(Vuex)

// ========== 初始状态（从Storage初始化） ==========
const initData = Storage.init();
const state = {
  shelves: initData.shelves, // 货架列表
  products: initData.products,
  shelfProducts: initData.shelfProducts, // 货架-商品关联
  shelfProductBatches: initData.shelfProductBatches,   // 批次列表
  expireThreshold: initData.expireThreshold, // 临期阈值
  categories: initData.categories, // 商品分类
  // pendingNew 包含两个字段：form 用于保存各货架商品的临时表单；
  // list 保存将要真正提交的待补货项目。
  pendingNew: initData.pendingNew // 待新增数据临时存储
}

// ========== 同步变更（仅更新状态 + 调用Storage持久化） ==========
const mutations = {
  // 添加商品到列表
  ADD_PRODUCT(state, data) {
    state.products = [...state.products, data];
    Storage.set(STORAGE_KEYS.PRODUCTS, state.products)
  },
  // 更新货架列表
  UPDATE_SHELVES(state, data) {
    state.shelves = data;
    Storage.set(STORAGE_KEYS.SHELVES, data);
  },
  // 更新商品列表
  UPDATE_PRODUCTS(state, data) {
    state.products = data;
    Storage.set(STORAGE_KEYS.PRODUCTS, data);
  },

  // 更新货架-商品关联
  UPDATE_SHELF_PRODUCTS(state, data) {
    state.shelfProducts = data;
    Storage.set(STORAGE_KEYS.SHELF_PRODUCTS, data);
  },

  // 更新批次列表
  UPDATE_SHELF_PRODUCT_BATCHES(state, data) {
    state.shelfProductBatches = data;
    // 注意 key 名称与 storage.js 中定义保持一致
    Storage.set(STORAGE_KEYS.SHELF_PRODUCTS_BATCHES, data);
  },

  // 更新分类列表
  UPDATE_CATEGORIES(state, data) {
    state.categories = data;
    Storage.set(STORAGE_KEYS.CATEGORIES, data);
  },

  // 设置临期阈值
  SET_EXPIRE_THRESHOLD(state, value) {
    state.expireThreshold = value;
    Storage.setExpireThreshold(value);
  },

  // --- 补货模块相关辅助变更 ---
  // 初始化所有批次的 addQty 字段（保证存在且为 0）
  INIT_BATCH_ADD_QTY(state) {
    state.shelfProductBatches.forEach(b => {
      if (!('addQty' in b)) {
        Vue.set(b, 'addQty', 0);
      }
    });
  },

  // 修改指定批次的补货数量（仅更新状态，不持久化）
  UPDATE_BATCH_ADD_QTY(state, { batchId, addQty }) {
    state.shelfProductBatches = state.shelfProductBatches.map(b =>
      b.id === batchId ? { ...b, addQty } : b
    );
  },

  // 更新待补货表单数据
  UPDATE_NEW_BATCH_FORM(state, { shelfProductId, formData }) {
    if (!state.pendingNew) state.pendingNew = { form: {}, list: [] };
    if (!state.pendingNew.form) state.pendingNew.form = {};
    state.pendingNew.form = {
      ...state.pendingNew.form,
      [shelfProductId]: formData
    };
  },

  // 向待补货列表追加条目
  ADD_PENDING_ITEM(state, item) {
    if (!state.pendingNew) state.pendingNew = { form: {}, list: [] };
    if (!state.pendingNew.list) state.pendingNew.list = [];
    state.pendingNew.list.push(item);
  },

  // 根据货架商品 id 和索引删除待补货项
  DELETE_PENDING_ITEM(state, { shelfProductId, index }) {
    if (!state.pendingNew || !state.pendingNew.list) return;
    state.pendingNew.list = state.pendingNew.list.filter((v, idx) => {
      return !(v.shelfProductId === shelfProductId && idx === index);
    });
  },

  // 清空待补货相关数据
  CLEAR_PENDING_LIST(state) {
    if (state.pendingNew) {
      state.pendingNew.list = [];
      state.pendingNew.form = {};
    }
  },

  // 更新待新增数据
  UPDATE_PENDING_NEW(state, data) {
    state.pendingNew = data;
  },

  // 清空所有数据（重置）
  CLEAR_ALL_DATA(state) {
    // 重置状态为初始值
    state.shelves = [];
    state.products = [];
    state.shelfProducts = [];
    state.shelfProductBatches = [];
    state.expireThreshold = 7;
    state.categories = [];
    state.pendingNew = [];

    // 清空本地存储
    Object.values(STORAGE_KEYS).forEach(key => {
      Storage.remove(key);
    });

    // 重新初始化默认数据
    const newInitData = Storage.init();
    Object.assign(state, newInitData);
  }
}
// ========== 计算属性（简化组件数据获取） ==========
const getters = {
  // 获取临期阈值
  getExpireThreshold: (state) => state.expireThreshold,

  // 获取所有分类
  getAllCategories: (state) => state.categories,

  // 获取指定货架的商品列表（优化版）
  getProductsInShelf: (state, getter) => (shelfId) => {
    return state.shelfProducts
      .filter(sp => sp.shelfId === shelfId)
      .map(sp => {
        const product = state.products.find(p => p.id === sp.productId) || {};
        return {
          ...sp, // 货架关联信息
          productName: product.name,
          categoryName: getter.getCategoryById(product.categoryId).name,
          shelfName: getter.getShelfById(sp.shelfId).name,
          period: product.period,
          unit: product.unit
        };
      });
  },
  getBatchStatus: (state) => (expireDateStr) => {
    if (!expireDateStr) {
      return { cls: 'danger', text: '日期无效' };
    }

    const [y, m, d] = expireDateStr.split('-').map(Number);
    const expireDate = new Date(y, m - 1, d); // 本地 0 点
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expireDate - now) / 86400000);
    if (diffDays < 0) {
      return { cls: 'danger', text: '已过期' };
    } else if (diffDays <= state.expireThreshold) {
      return { cls: 'warning', text: `临期(${diffDays}天)` };
    } else {
      return { cls: 'success', text: `正常(${diffDays}天)` };
    }
  },
  // 获取商品批次（按过期日期排序）
  getProductBatches: (state) => (shelfProductId) => {
    return state.shelfProductBatches
      .filter((b) => b.shelfProductId === shelfProductId)
      .sort((a, b) => new Date(a.expireDate) - new Date(b.expireDate));
  },
  // 获取所有临期/过期批次（警告用）
  getWarnBatches: (state, getter) => {
    return state.shelfProductBatches.map(batch => {
      const [y, m, d] = batch.expireDate.split('-').map(Number);
      const expireDate = new Date(y, m - 1, d); // 本地 0 点
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expireDate - now) / 86400000);

      // 判定状态
      let status = { cls: 'success', text: '正常' };
      if (diffDays < 0) {
        status = { cls: 'danger', text: '已过期' };
      } else if (diffDays <= state.expireThreshold) {
        status = { cls: 'warning', text: `临期(${diffDays}天)` };
      }
      const shelfProduct = getter.getShelfProductById(batch.shelfProductId)
      const product = state.products.find(p => p.id === shelfProduct.productId);
      const shelf = state.shelves.find(s => s.id === shelfProduct.shelfId);
      return {
        ...batch,
        productName: product.name,
        shelfName: shelf.name,
        status,
        diffDays
      }
    }).filter(batch => batch.status.cls !== 'success').sort((a, b) => a.diffDays - b.diffDays); // 仅返回临期/过期
  },

  // 根据ID获取商品
  getProductById: (state) => (productId) => {
    return state.products.find(p => p.id === productId) || {};
  },
  getCategoryById: (state) => (categoryId) => {
    return state.categories.find(cat => cat.id === categoryId) || {};
  },
  getShelfById: (state) => (shelfId) => {
    return state.shelves.find(shelf => shelf.id === shelfId) || {};
  },
  getShelfProductById: (state) => (shelfProductId) => {
    return state.shelfProducts.find(shelfProduct => shelfProduct.id === shelfProductId) || {};
  },
  getShelfProductBatchById: (state) => (shelfProductBatchId) => {
    return state.shelfProductBatches.find(shelfProductBatch => shelfProductBatch.id === shelfProductBatchId) || {}
  },
  // 计算商品现有数量
  getProductCurrentQty: (state) => (shelfProduct) => {
    return state.shelfProductBatches
      .filter(b => b.shelfProductId === shelfProduct.id)
      .reduce((sum, b) => sum + (b.batchnum || 0), 0);
  },
  getBatchMaxQty: (state, getter) => (batch, shelfProduct) => {
    const allBatches = getter.getProductBatches(shelfProduct.id);
    if (!allBatches || allBatches.length === 0) {
      return shelfProduct.max || 0;
    }

    const otherBatchesTotal = allBatches.reduce((total, b) => {
      if (b.id !== batch.id) {
        total += b.batchnum || 0;
      }
      return total;
    }, 0);

    const maxAvailable = shelfProduct.max - otherBatchesTotal;
    return Math.max(maxAvailable, 0);
  },
  getAddBatchMaxQty: (state, getter) => (shelfProduct) => {
    const allBatches = getter.getProductBatches(shelfProduct.id) || [];
    const usedQty = allBatches.reduce((total, b) => total + (b.batchnum || 0), 0);
    return Math.max(shelfProduct.max - usedQty, 1); // 最小为1
  },
  getReplenishQty: (state) => (shelfProduct) => {
    if (!shelfProduct) return 0;
    const maxQty = shelfProduct.max || 10;

    const totalQty = state.shelfProductBatches
      .filter(b => b.shelfProductId === shelfProduct.id)
      .reduce((sum, b) => sum + (b.batchnum || 0), 0);

    // 补货数量 = 最大容量 - 当前库存（最小为0）
    return Math.max(0, maxQty - totalQty);
  }
}

export default new Vuex.Store({
  state,
  mutations,
  getters,
})