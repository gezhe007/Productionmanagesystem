<template>
  <div class="product-search-container">
    <el-input
      v-model="searchKeyword"
      :placeholder="placeholder"
      clearable
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup.enter="handleEnter"
      ref="searchInput"
    ></el-input>

    <!-- 搜索建议下拉框 -->
    <el-dropdown-menu
      class="search-suggestions"
      ref="suggestions"
      v-show="showSuggestions && filteredProducts.length > 0"
    >
      <el-dropdown-item
        v-for="(product, index) in filteredProducts"
        :key="index"
        @click.native="selectProduct(product)"
        :class="{ highlight: index === hoverIndex }"
        @mouseenter="hoverIndex = index"
      >
        {{ product.name }} [{{ product.category }}]
      </el-dropdown-item>
    </el-dropdown-menu>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "ProductSearch",
  props: {
    // 搜索框占位符
    placeholder: {
      type: String,
      default: "输入商品名搜索...",
    },
    // 是否只搜索指定分类（可选）
    category: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      searchKeyword: "", // 搜索关键词
      showSuggestions: false, // 是否显示建议列表
      filteredProducts: [], // 筛选后的商品列表
      hoverIndex: -1, // 鼠标悬浮的建议项索引
      blurTimer: null, // 失焦延迟定时器
    };
  },
  computed: {
    // 从Vuex获取商品列表
    ...mapState(["products"]),
  },
  methods: {
    // 输入事件：筛选商品
    handleInput() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (!keyword) {
        this.filteredProducts = [];
        this.showSuggestions = false;
        return;
      }

      // 筛选商品（支持名称/分类搜索，可过滤指定分类）
      this.filteredProducts = this.products.filter((product) => {
        const matchKeyword =
          product.name.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword);
        const matchCategory = this.category
          ? product.category === this.category
          : true;
        return matchKeyword && matchCategory;
      });

      // 排序：开头匹配优先 → 名称长度优先
      this.filteredProducts.sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(keyword) ? 0 : 1;
        const bStartsWith = b.name.toLowerCase().startsWith(keyword) ? 0 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
        return a.name.length - b.name.length;
      });

      this.showSuggestions = true;
    },
    // 聚焦事件：显示建议列表
    handleFocus() {
      if (this.searchKeyword) {
        this.handleInput();
      }
    },
    // 失焦事件：延迟隐藏建议列表（避免点击建议项时直接隐藏）
    handleBlur() {
      this.blurTimer = setTimeout(() => {
        this.showSuggestions = false;
      }, 200);
    },
    // 回车事件：选中第一个建议项
    handleEnter() {
      if (this.filteredProducts.length > 0) {
        this.selectProduct(this.filteredProducts[0]);
      }
    },
    // 选中商品：触发父组件事件，清空搜索框
    selectProduct(product) {
      this.searchKeyword = product.name;
      this.showSuggestions = false;
      // 向父组件传递选中的商品信息
      this.$emit("select", product);
      // 清空定时器（避免失焦隐藏）
      clearTimeout(this.blurTimer);
    },
    // 清空搜索框（供父组件调用）
    clear() {
      this.searchKeyword = "";
      this.filteredProducts = [];
      this.showSuggestions = false;
    },
    // 获取当前选中的关键词（供父组件调用）
    getKeyword() {
      return this.searchKeyword;
    },
  },
  beforeDestroy() {
    clearTimeout(this.blurTimer);
  },
};
</script>

<style scoped>
.product-search-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 999;
  margin: 0;
  padding: 0;
}

.el-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-dropdown-item.highlight {
  background: #e6f7ff;
  color: #1890ff;
}

.el-dropdown-item:hover {
  background: #f5f5f5;
}
</style>