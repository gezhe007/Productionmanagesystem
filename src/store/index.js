import Vue from 'vue'
import Vuex from 'vuex'
import { StorageUtil, STORAGE_KEYS } from '@/utils/storage'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        shelves: [],          // 货架列表
        products: [],         // 商品列表
        shelfProducts: [],    // 货架商品关联表
        shelfBatches: [],     // 货架批次
        pendingNew: [],       // 待补货列表
        expireThreshold: 3,   // 临期阈值
        categories: []        // 分类列表
    },
    mutations: {
        // 初始化数据
        INIT_DATA(state, data) {
            state.shelves = data.shelves;
            state.products = data.products;
            state.shelfProducts = data.shelfProducts;
            state.shelfBatches = data.shelfBatches;
            state.pendingNew = data.pendingNew;
            state.expireThreshold = data.expireThreshold;
            state.categories = data.categories;
        },

        // 更新临期阈值
        UPDATE_THRESHOLD(state, value) {
            state.expireThreshold = value;
            StorageUtil.setExpireThreshold(value);
        },

        // 更新货架列表
        UPDATE_SHELVES(state, shelves) {
            state.shelves = shelves;
            StorageUtil.set(STORAGE_KEYS.SHELVES, shelves);
        },

        // 更新商品列表
        UPDATE_PRODUCTS(state, products) {
            state.products = products;
            StorageUtil.set(STORAGE_KEYS.PRODUCTS, products);
        },

        // 更新货架商品关联表
        UPDATE_SHELF_PRODUCTS(state, shelfProducts) {
            state.shelfProducts = shelfProducts;
            StorageUtil.set(STORAGE_KEYS.SHELF_PRODUCTS, shelfProducts);
        },

        // 更新货架批次
        UPDATE_SHELF_BATCHES(state, shelfBatches) {
            state.shelfBatches = shelfBatches;
            StorageUtil.set(STORAGE_KEYS.SHELF_BATCHES, shelfBatches);
        },

        // 更新待补货列表
        UPDATE_PENDING_NEW(state, pendingNew) {
            state.pendingNew = pendingNew;
        },

        // 更新分类列表
        UPDATE_CATEGORIES(state, categories) {
            state.categories = categories;
            StorageUtil.set(STORAGE_KEYS.CATEGORIES, categories);
        }
    },
    actions: {
        // 初始化数据
        initData({ commit }) {
            const data = StorageUtil.init();
            commit('INIT_DATA', data);
        }
    },
    getters: {
        // 获取货架中的商品列表
        getProductsInShelf: (state) => (shelf) => {
            return state.shelfProducts
                .filter(sp => sp.shelf === shelf)
                .map(sp => {
                    const product = state.products.find(p => p.id === sp.productId);
                    return product ? { ...product, shelfMax: sp.max } : null;
                })
                .filter(p => p);
        },

        // 获取临期/过期商品
        getExpireWarnProducts: (state) => {
            const warnItems = [];
            state.shelfBatches.forEach(batch => {
                const now = new Date();
                const expireDate = new Date(batch.expire);
                const leftDays = Math.ceil((expireDate - now) / 86400000);
                if (leftDays <= state.expireThreshold) {
                    warnItems.push({
                        shelf: batch.shelf,
                        product: batch.product,
                        batch: batch.batch,
                        leftDays,
                        status: leftDays <= 0 ? 'expired' : 'warning'
                    });
                }
            });
            return warnItems;
        }
    }
})