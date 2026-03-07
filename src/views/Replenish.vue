<template>
  <div class="replenish-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>补货</h2>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-group">
      筛选分类：
      <el-select
        v-model="filterCat"
        placeholder="全部"
        @change="filterReplenishData"
      >
        <el-option label="全部" :value="0"></el-option>
        <el-option
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
          :value="category.id"
        ></el-option>
      </el-select>
    </div>

    <!-- 补货内容 -->
    <div id="total-content" class="content-container">
      <!-- 无需补货提示 -->
      <div v-if="!hasReplenishData" class="empty-tip">无需补货</div>

      <!-- 补货列表 -->
      <div
        v-else
        v-for="shelf in shelves"
        :key="shelf.id"
        class="shelf-section"
      >
        <div
          v-for="shelfProduct in getFilteredShelfProducts(shelf.id)"
          :key="shelfProduct.id"
          class="product-item"
        >
          <!-- 仅显示需要补货的商品 -->
          <div v-if="getReplenishQty(shelfProduct) > 0">
            <h4 class="product-title">
              [{{ shelfProduct.categoryName }}] {{ shelf.name }} →
              {{ shelfProduct.productName }} （需补
              {{ getReplenishQty(shelfProduct) }} 件）
            </h4>

            <!-- 原有批次 -->
            <div class="batch-section">
              <strong>原有批次（补货数量填0则不补）</strong>
              <div
                v-for="batch in getProductBatches(shelfProduct.id)"
                :key="batch.id"
                class="batch-item"
              >
                {{ batch.produceDate }} (当前库存：{{ batch.batchnum }}件)
                补货数量：
                <el-input-number
                  v-model="batch.addQty"
                  :min="0"
                  :max="calculateBatchMaxAddQty(shelfProduct, batch)"
                  style="width: 100px"
                  @change="updatePreview(shelfProduct, batch)"
                ></el-input-number>

                <!-- 补货预览 -->
                <div
                  class="stock-preview"
                  :style="{ color: getPreviewColor(shelfProduct, batch) }"
                >
                  补货后库存：{{ batch.batchnum + (batch.addQty || 0) }}件 /
                  此货架该商品最大容量：{{ shelfProduct.max }}件
                  <span
                    v-if="
                      batch.batchnum + (batch.addQty || 0) > shelfProduct.max
                    "
                    class="warning-text"
                  >
                    （超出此货架该商品最大容量）
                  </span>
                </div>
              </div>
            </div>

            <!-- 新批次 -->
            <div class="new-abatch-section">
              <strong>添加新批次</strong>
              <div class="batch-item">
                选择生产日期：
                <el-date-picker
                  v-model="newBatchForm[shelfProduct.id].produceDate"
                  type="date"
                  placeholder="选择生产日期"
                  style="width: 180px"
                  value-format="yyyy-MM-dd"
                ></el-date-picker>
                <br />
                补货数量：
                <el-input-number
                  v-model="newBatchForm[shelfProduct.id].batchnum"
                  :min="0"
                  :max="getReplenishQty(shelfProduct)"
                  style="width: 100px"
                ></el-input-number>
                <el-button
                  type="primary"
                  size="mini"
                  @click="addNewPending(shelfProduct)"
                  :disabled="
                    !newBatchForm[shelfProduct.id].produceDate ||
                    newBatchForm[shelfProduct.id].batchnum <= 0
                  "
                >
                  添加这批
                </el-button>
              </div>
            </div>

            <!-- 待上新批次 -->
            <div
              v-if="getPendingItems(shelfProduct.id).length > 0"
              class="pending-section"
            >
              <strong>待上新批次：</strong>
              <div
                v-for="(item, index) in getPendingItems(shelfProduct.id)"
                :key="index"
                class="todo-item"
              >
                {{ item.produceDate }} → {{ item.batchnum }}件
                <el-button
                  type="text"
                  size="mini"
                  @click="deletePending(shelfProduct.id, index)"
                  class="delete-btn"
                >
                  删
                </el-button>
              </div>
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
      :disabled="!hasReplenishData"
      class="confirm-btn"
    >
      确认全部补货上货架
    </el-button>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import {
  calculateExpireDate,
  calculateAfterReplenishQty,
  validateForm,
  calculateId,
} from "@/utils/helpers";

export default {
  name: "Replenish",
  data() {
    return {
      // 筛选条件
      filterCat: 0,

      // 表单数据
      newBatchForm: {},

      // 待补货列表（临时存储，不存入Vuex）
      pendingNew: [],

      // 加载状态
      confirmLoading: false,
    };
  },
  computed: {
    // 映射Vuex状态
    ...mapState([
      "shelves",
      "products",
      "categories",
      "shelfProducts",
      "shelfProductBatches",
      "expireThreshold",
    ]),

    // 映射Vuex getters
    ...mapGetters([
      "getProductsInShelf",
      "getProductBatches",
      "getProductCurrentQty",
      "getReplenishQty",
      "getBatchStatus",
      "getCategoryById",
      "getProductById",
      "getShelfById",
    ]),

    /**
     * 是否有需要补货的数据
     */
    hasReplenishData() {
      // 检查是否有需要补货的商品
      for (const shelf of this.shelves) {
        const shelfProducts = this.getFilteredShelfProducts(shelf.id);
        for (const sp of shelfProducts) {
          if (this.getReplenishQty(sp) > 0) {
            return true;
          }
        }
      }
      // 检查待补货列表或原有批次补货
      return this.pendingNew.length > 0 || this.hasOldBatchReplenish();
    },
  },
  created() {
    // 初始化新批次表单
    this.initNewBatchForm();

    // 初始化批次补货数量
    this.initBatchAddQty();
  },
  methods: {
    // 映射Vuex mutations
    ...mapMutations(["UPDATE_SHELF_PRODUCT_BATCHES"]),

    /**
     * 初始化新批次表单
     */
    initNewBatchForm() {
      this.shelfProducts.forEach((sp) => {
        this.$set(this.newBatchForm, sp.id, {
          produceDate: "",
          batchnum: 0,
        });
      });
    },

    /**
     * 初始化批次补货数量
     */
    initBatchAddQty() {
      // 为每个批次添加addQty属性（临时用，不持久化）
      this.shelfProductBatches.forEach((batch) => {
        if (!batch.hasOwnProperty("addQty")) {
          this.$set(batch, "addQty", 0);
        }
      });
    },

    /**
     * 获取筛选后的货架商品列表
     */
    getFilteredShelfProducts(shelfId) {
      const allProducts = this.getProductsInShelf(shelfId) || [];

      // 筛选分类
      if (this.filterCat && this.filterCat !== 0) {
        return allProducts.filter((sp) => sp.categoryId === this.filterCat);
      }

      return allProducts;
    },

    /**
     * 筛选补货数据
     */
    filterReplenishData() {
      this.$forceUpdate();
    },

    /**
     * 计算单个批次最大可补货数量
     */
    calculateBatchMaxAddQty(shelfProduct, batch) {
      const currentTotal = this.getProductCurrentQty(shelfProduct);
      const maxQty = shelfProduct.max;
      const availableQty = maxQty - currentTotal;

      return Math.max(0, availableQty);
    },

    /**
     * 更新补货预览
     */
    updatePreview(shelfProduct, batch) {
      // 限制补货数量不超过可补货总量
      const maxAddQty = this.calculateBatchMaxAddQty(shelfProduct, batch);
      if (batch.addQty > maxAddQty) {
        batch.addQty = maxAddQty;
        this.$message.warning(`最多只能补货${maxAddQty}件`);
      }
    },

    /**
     * 获取预览文字颜色
     */
    getPreviewColor(shelfProduct, batch) {
      const afterQty = batch.batchnum + (batch.addQty || 0);
      return afterQty > shelfProduct.max ? "#f44336" : "#007aff";
    },

    /**
     * 获取待补货项
     */
    getPendingItems(shelfProductId) {
      return this.pendingNew.filter((x) => x.shelfProductId === shelfProductId);
    },

    /**
     * 添加新批次到待补货列表
     */
    addNewPending(shelfProduct) {
      const form = this.newBatchForm[shelfProduct.id];
      const product = this.getProductById(shelfProduct.productId);

      // 使用工具函数进行表单验证
      const validateResult = validateForm({
        生产日期: form.produceDate,
        批次数量: form.batchnum,
      });

      if (!validateResult.valid) {
        this.$message.error(validateResult.message);
        return;
      }

      // 使用工具函数计算过期日期
      const expireDate = calculateExpireDate(
        form.produceDate,
        product.period,
        product.unit
      );

      if (!expireDate) {
        this.$message.error("计算过期日期失败，请检查商品保质期配置");
        return;
      }

      // 检查是否超过最大容量
      const currentTotal = this.getProductCurrentQty(shelfProduct);
      const afterAddTotal = currentTotal + form.batchnum;

      if (afterAddTotal > shelfProduct.max) {
        this.$confirm(
          `补货后将超出最大容量(${shelfProduct.max}件)，是否继续？`,
          "警告",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        ).then(() => {
          this.addPendingItem(shelfProduct, form, expireDate);
        });
        return;
      }

      this.addPendingItem(shelfProduct, form, expireDate);
    },

    /**
     * 实际添加待补货项
     */
    addPendingItem(shelfProduct, form, expireDate) {
      // 添加到待补货列表
      this.pendingNew.push({
        shelfProductId: shelfProduct.id,
        shelfId: shelfProduct.shelfId,
        productId: shelfProduct.productId,
        produceDate: form.produceDate,
        expireDate: expireDate,
        batchnum: form.batchnum,
      });

      // 重置表单
      this.newBatchForm[shelfProduct.id] = {
        produceDate: "",
        batchnum: 0,
      };

      this.$message.success("批次已添加到待补货列表");
    },

    /**
     * 删除待补货项
     */
    deletePending(shelfProductId, index) {
      const pendingItems = this.getPendingItems(shelfProductId);
      if (pendingItems[index]) {
        this.pendingNew = this.pendingNew.filter(
          (item) => item !== pendingItems[index]
        );
        this.$message.success("待补货批次已删除");
      }
    },

    /**
     * 检查是否有原有批次需要补货
     */
    hasOldBatchReplenish() {
      return this.shelfProductBatches.some((batch) => batch.addQty > 0);
    },

    /**
     * 确认补货
     */
    confirmReplenish() {
      this.confirmLoading = true;

      try {
        // 1. 复制当前批次数据（避免直接修改Vuex状态）
        let updatedBatches = [...this.shelfProductBatches];

        // 2. 更新原有批次数量
        updatedBatches = updatedBatches.map((batch) => {
          if (batch.addQty > 0) {
            // 移除addQty属性，只保留batchnum
            const { addQty, ...newBatch } = batch;
            return {
              ...newBatch,
              batchnum: batch.batchnum + batch.addQty,
            };
          }
          return batch;
        });

        // 3. 处理新批次
        this.pendingNew.forEach((item) => {
          const existingBatch = updatedBatches.find(
            (b) =>
              b.shelfProductId === item.shelfProductId &&
              b.produceDate === item.produceDate
          );

          if (existingBatch) {
            // 已有批次，更新数量
            existingBatch.batchnum += item.batchnum;
          } else {
            // 新增批次（使用工具函数生成ID）
            updatedBatches.push({
              id: calculateId(updatedBatches),
              shelfProductId: item.shelfProductId,
              shelfId: item.shelfId,
              productId: item.productId,
              produceDate: item.produceDate,
              expireDate: item.expireDate,
              batchnum: item.batchnum,
            });
          }
        });

        // 4. 过滤掉数量为0的批次
        const finalBatches = updatedBatches.filter(
          (batch) => batch.batchnum > 0
        );

        // 5. 更新Vuex（会自动同步到本地存储）
        this.UPDATE_SHELF_PRODUCT_BATCHES(finalBatches);

        // 6. 清空待补货列表
        this.pendingNew = [];

        this.$message.success("全部补货上架成功！");
      } catch (e) {
        console.error("补货失败:", e);
        this.$message.error("补货失败，请重试");
      } finally {
        this.confirmLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.replenish-page {
  padding: 15px;
}

.page-header {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.filter-group {
  margin: 10px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.content-container {
  min-height: 200px;
}

.empty-tip {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 16px;
}

.shelf-section {
  margin-bottom: 30px;
}

.product-item {
  margin-bottom: 20px;
}

.product-title {
  margin: 0 0 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  color: #333;
}

.batch-section,
.new-batch-section,
.pending-section {
  margin-bottom: 15px;
  padding-left: 10px;
}

.batch-item {
  margin: 10px 0;
  padding: 8px 0;
  font-size: 14px;
  color: #555;
}

.stock-preview {
  margin-top: 5px;
  font-size: 13px;
  padding-left: 10px;
}

.warning-text {
  color: #f44336;
  font-weight: bold;
}

.todo-item {
  background: #e6f7ff;
  padding: 8px 10px;
  margin: 5px 0;
  border-radius: 4px;
  border-left: 3px solid #007aff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-btn {
  color: #f44336;
}

.confirm-btn {
  margin-top: 20px;
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}
</style>