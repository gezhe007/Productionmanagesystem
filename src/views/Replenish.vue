<template>
  <div>
    <!-- 页面标题 -->
    <div class="page-header" style="display: flex; justify-content: center">
      <h2>补货</h2>
    </div>
    <!-- 筛选条件 -->
    <div class="filter-group">
      筛选分类：
      <el-select v-model="filterCat" @change="renderTotal" placeholder="全部">
        <el-option label="全部" value=""></el-option>
        <el-option
          v-for="category in categories"
          :key="category"
          :label="category"
          :value="category"
        ></el-option>
      </el-select>
    </div>

    <!-- 补货内容 -->
    <div id="total-content">
      <div v-if="!hasReplenishData" class="item">无需补货</div>

      <div v-else v-for="shelf in shelves" :key="shelf">
        <div v-for="product in getProductsInShelf(shelf)" :key="product.id">
          <div v-if="calculateReplenishQty(shelf, product.id) > 0" class="item">
            <h4>
              [{{ product.category }}] {{ shelf }}→{{ product.name }}（需补
              {{ calculateReplenishQty(shelf, product.id) }} 件）
            </h4>

            <!-- 原有批次 -->
            <div><strong>原有批次（补货数量填0则不补）</strong></div>
            <div
              v-for="batch in getProductBatches(shelf, product.id)"
              :key="batch.batch"
              class="batch"
            >
              {{ batch.batch }} (当前库存：{{ batch.qty }}件) 补货数量：
              <el-input-number
                v-model="batch.addQty"
                :min="0"
                @input="
                  showReplenishPreview(
                    shelf,
                    product.id,
                    batch.batch,
                    batch.addQty
                  )
                "
                style="width: 100px"
              ></el-input-number>
              <div
                class="stock-preview"
                :id="`replenish-preview-${shelf}-${product.id}-${batch.batch}`"
                :style="{
                  color: getPreviewColor(
                    shelf,
                    product.id,
                    batch.qty,
                    batch.addQty
                  ),
                }"
              >
                补货后库存：{{ batch.qty + (batch.addQty || 0) }}件 /
                此货架该商品最大容量：{{ product.shelfMax }}件
                <span v-if="batch.qty + (batch.addQty || 0) > product.shelfMax"
                  >（超出此货架该商品最大容量）</span
                >
              </div>
            </div>

            <!-- 新批次 -->
            <div><strong>添加新批次</strong></div>
            <div class="batch">
              选择生产日期：
              <el-date-picker
                v-model="newBatchForm[product.id].produceDate"
                type="date"
                placeholder="选择生产日期"
                style="width: 180px"
              ></el-date-picker>
              <br />
              补货数量：
              <el-input-number
                v-model="newBatchForm[product.id].qty"
                :min="0"
                :value="calculateReplenishQty(shelf, product.id)"
                style="width: 100px"
              ></el-input-number>
              <el-button
                type="primary"
                size="mini"
                @click="addNewPending(product.id, shelf)"
                >添加这批</el-button
              >
            </div>

            <!-- 待上新批次 -->
            <div
              v-if="getPendingItems(product.id, shelf).length > 0"
              class="batch"
            >
              <strong>待上新批次：</strong>
            </div>
            <div
              v-for="(item, index) in getPendingItems(product.id, shelf)"
              :key="index"
              class="todo"
            >
              {{ item.batch }} → {{ item.qty }}件
              <el-button type="text" size="mini" @click="deletePending(index)"
                >删</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认补货按钮 -->
    <el-button
      type="danger"
      @click="confirmReplenish"
      :loading="confirmLoading"
      style="margin-top: 20px; width: 100%; padding: 10px 0"
    >
      确认全部补货上货架
    </el-button>
  </div>
</template>

<script>
import { Storage, STORAGE_KEYS } from "@/utils/storage";
import {
  calculateExpireDate,
  calculateReplenishQty,
  getProductsInShelf,
  calculateAfterReplenishQty,
  validateForm,
} from "@/utils/helpers";

export default {
  name: "Replenish",
  data() {
    return {
      // 数据状态
      shelves: [],
      products: [],
      shelfProducts: [],
      shelfBatches: [],
      categories: [],
      pendingNew: [],
      expireThreshold: 3,
      showGuide: true,
      confirmLoading: false,

      // 筛选条件
      filterCat: "",

      // 表单数据
      newBatchForm: {},

      // 临时数据
      batchAddQty: {},
    };
  },
  computed: {
    // 是否有补货数据
    hasReplenishData() {
      for (const shelf of this.shelves) {
        const productsInShelf = getProductsInShelf(
          shelf,
          this.shelfProducts,
          this.products
        );
        const filteredProducts = this.filterCat
          ? productsInShelf.filter((p) => p.category === this.filterCat)
          : productsInShelf;

        for (const product of filteredProducts) {
          if (
            calculateReplenishQty(
              shelf,
              product.id,
              this.shelfBatches,
              this.shelfProducts
            ) > 0
          ) {
            return true;
          }
        }
      }
      return false;
    },
  },
  mounted() {
    // 初始化数据
    const initData = Storage.init();
    this.shelves = initData.shelves;
    this.products = initData.products;
    this.shelfProducts = initData.shelfProducts;
    this.shelfBatches = initData.shelfBatches;
    this.categories = initData.categories;
    this.pendingNew = initData.pendingNew;
    this.expireThreshold = initData.expireThreshold;

    // 初始化表单
    this.products.forEach((product) => {
      this.$set(this.newBatchForm, product.id, {
        produceDate: "",
        qty: 0,
      });
    });

    // 初始化批次补货数量
    this.shelfBatches.forEach((batch) => {
      this.$set(batch, "addQty", 0);
    });

    // 渲染补货列表
    this.renderTotal();
  },
  methods: {
    // 渲染补货汇总
    renderTotal() {
      // 由模板自动渲染
    },

    // 获取商品批次
    getProductBatches(shelf, productId) {
      return this.shelfBatches
        .filter((b) => b.shelf === shelf && b.productId === productId)
        .sort((a, b) => new Date(a.expire) - new Date(b.expire));
    },

    // 获取货架商品
    getProductsInShelf(shelf) {
      const products = getProductsInShelf(
        shelf,
        this.shelfProducts,
        this.products
      );
      return this.filterCat
        ? products.filter((p) => p.category === this.filterCat)
        : products;
    },

    // 计算补货数量
    calculateReplenishQty(shelf, productId) {
      return calculateReplenishQty(
        shelf,
        productId,
        this.shelfBatches,
        this.shelfProducts
      );
    },

    // 获取待补货项
    getPendingItems(productId, shelf) {
      return this.pendingNew.filter(
        (x) => x.productId === productId && x.shelf === shelf
      );
    },

    // 添加新批次到待补货列表
    addNewPending(productId, shelf) {
      const product = this.products.find((p) => p.id === productId);
      if (!product) {
        this.$message.error("商品不存在");
        return;
      }

      const produceDate = this.newBatchForm[productId].produceDate;
      const qty = this.newBatchForm[productId].qty;

      const validateResult = validateForm({
        生产日期: produceDate,
        批次数量: qty,
      });

      if (!validateResult.valid) {
        this.$message.error(validateResult.message);
        return;
      }

      // 计算过期日期
      const expireDateStr = calculateExpireDate(
        produceDate,
        product.period,
        product.unit
      );

      // 检查商品是否在货架中
      const isInShelf = this.shelfProducts.some(
        (sp) => sp.shelf === shelf && sp.productId === productId
      );
      if (!isInShelf) {
        this.$message.error("该商品不在此货架，无法添加批次");
        return;
      }

      // 添加到待补货列表
      this.pendingNew.push({
        productId,
        product: product.name,
        shelf,
        batch: produceDate,
        qty,
        expire: expireDateStr,
      });

      // 重置表单
      this.newBatchForm[productId] = {
        produceDate: "",
        qty: 0,
      };

      this.$message.success("批次已添加到待补货列表");
    },

    // 删除待补货项
    deletePending(index) {
      this.pendingNew.splice(index, 1);
      this.$message.success("待补货批次已删除");
    },

    // 确认补货
    confirmReplenish() {
      this.confirmLoading = true;

      if (this.pendingNew.length === 0 && !this.hasOldBatchReplenish()) {
        this.confirmLoading = false;
        this.$message.error("暂无需要补货的批次");
        return;
      }

      try {
        // 更新原有批次数量
        this.shelves.forEach((shelf) => {
          const productIds = this.shelfProducts
            .filter((sp) => sp.shelf === shelf)
            .map((sp) => sp.productId);

          productIds.forEach((productId) => {
            this.shelfBatches
              .filter((b) => b.shelf === shelf && b.productId === productId)
              .forEach((batch) => {
                const addQty = batch.addQty || 0;
                if (addQty > 0) {
                  batch.qty += addQty;
                  batch.addQty = 0; // 重置添加数量
                }
              });
          });
        });

        // 处理新批次
        this.pendingNew.forEach((item) => {
          const existingBatch = this.shelfBatches.find(
            (b) =>
              b.shelf === item.shelf &&
              b.productId === item.productId &&
              b.batch === item.batch
          );

          if (existingBatch) {
            existingBatch.qty += item.qty;
          } else {
            this.shelfBatches.push(item);
          }
        });

        // 清理数量为0的批次
        this.shelfBatches = this.shelfBatches.filter((batch) => batch.qty > 0);

        // 保存数据
        Storage.set(STORAGE_KEYS.SHELF_BATCHES, this.shelfBatches);

        // 清空待补货列表
        this.pendingNew = [];

        this.$message.success("全部补货上架成功！");
      } catch (e) {
        console.error("补货失败:", e);
        this.$message.error("补货失败，请重试");
      } finally {
        this.confirmLoading = false;
      }
    },

    // 检查是否有原有批次需要补货
    hasOldBatchReplenish() {
      let hasReplenish = false;

      this.shelves.forEach((shelf) => {
        const productIds = this.shelfProducts
          .filter((sp) => sp.shelf === shelf)
          .map((sp) => sp.productId);

        productIds.forEach((productId) => {
          this.shelfBatches
            .filter((b) => b.shelf === shelf && b.productId === productId)
            .forEach((batch) => {
              const addQty = batch.addQty || 0;
              if (addQty > 0) hasReplenish = true;
            });
        });
      });

      return hasReplenish;
    },

    // 显示补货预览
    showReplenishPreview(shelf, productId, batch, addQty) {
      // 由模板自动计算显示
    },

    // 获取预览文字颜色
    getPreviewColor(shelf, productId, currentQty, addQty) {
      const product = this.products.find((p) => p.id === productId);
      const shelfProduct = this.shelfProducts.find(
        (sp) => sp.shelf === shelf && sp.productId === productId
      );
      const maxQty = shelfProduct ? shelfProduct.max : 0;
      const afterQty = currentQty + (addQty || 0);

      return afterQty > maxQty ? "#f44336" : "#007aff";
    },
  },
};
</script>

<style scoped>
.back-btn {
  margin-left: 10px;
  font-size: 14px;
}

.guide-tip {
  background: #e6f7ff;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 4px solid #007aff;
  font-size: 14px;
}

.close-guide {
  float: right;
  cursor: pointer;
  color: #999;
  font-size: 16px;
}

.close-guide:hover {
  color: #f44336;
}

.filter-group {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.item {
  margin: 10px 0;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.batch {
  margin-left: 15px;
  font-size: 14px;
  color: #555;
  padding: 8px 0;
}

.todo {
  background: #e6f7ff;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  border-left: 3px solid #007aff;
}

.stock-preview {
  color: #007aff;
  font-size: 13px;
  margin-top: 4px;
}
</style>