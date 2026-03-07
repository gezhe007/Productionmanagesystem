<template>
  <div class="replenish-page">
    <div class="page-header">
      <h2>补货</h2>
    </div>

    <div id="total-content" class="content-container">
      <div v-if="!hasReplenishData" class="empty-tip">无需补货</div>

      <div
        v-else
        v-for="shelf in shelves"
        :key="shelf.id"
        class="shelf-section"
      >
        <div
          v-for="shelfProduct in filteredShelfProductsMap[shelf.id]"
          :key="shelfProduct.id"
          class="product-item"
        >
          <div v-if="getReplenishQty(shelfProduct) > 0">
            <h4 class="product-title">
              [{{ shelfProduct.categoryName }}] {{ shelf.name }} →
              {{ shelfProduct.productName }} （需补
              {{ getReplenishQty(shelfProduct) }} 件）
            </h4>

            <div
              class="stock-preview"
              :style="{ color: getPreviewColor(shelfProduct) }"
            >
              补货后库存：{{ getTotalAfterQty(shelfProduct) }}件 /
              此货架该商品最大容量：{{ shelfProduct.max }}件
              <span
                v-if="getTotalAfterQty(shelfProduct) > shelfProduct.max"
                class="warning-text"
              >
                （超出此货架该商品最大容量）
              </span>
            </div>

            <div class="batch-section">
              <div
                v-for="batch in getProductBatches(shelfProduct.id)"
                :key="batch.id"
                class="batch-item"
              >
                {{ batch.produceDate }} (库存：{{ batch.batchnum }}件)
              </div>
            </div>

            <div class="new-batch-section" v-if="newBatchForm[shelfProduct.id]">
              <strong>按批次补货</strong>
              <div class="batch-item">
                选择生产日期：
                <input
                  type="date"
                  v-model="newBatchForm[shelfProduct.id].produceDate"
                  style="width: 200px; padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; height: 40px; font-size: 16px;"
                />
                <br />
                补货数量：
                <el-input-number
                  v-model.number="newBatchForm[shelfProduct.id].batchnum"
                  :min="0"
                  :max="getNewBatchMaxQty(shelfProduct)"
                  placeholder="0"
                  style="width: 180px"
                  @change="
                    updateNewBatchForm(shelfProduct.id, 'batchnum', $event)
                  "
                ></el-input-number>
                <el-button
                  type="primary"
                  size="mini"
                  @click="addNewPending(shelfProduct)"
                  :disabled="
                    !newBatchForm[shelfProduct.id]?.produceDate ||
                    newBatchForm[shelfProduct.id]?.batchnum <= 0
                  "                  style="align-self: flex-end;"                >
                  添加这批
                </el-button>
              </div>
            </div>

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
                  ×
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="btn-group">
      <el-button
        type="danger"
        @click="confirmReplenish"
        :loading="confirmLoading"
        :disabled="!hasReplenishData"
      >
        确认全部补货上货架
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import {
  calculateExpireDate,
  validateForm,
  calculateId,
} from "@/utils/helpers";

export default {
  name: "Replenish",
  data() {
    return {
      confirmLoading: false,
    };
  },
  computed: {
    ...mapState([
      "shelves",
      "products",
      "shelfProducts",
      "shelfProductBatches",
      "expireThreshold",
      "pendingNew",
    ]),

    ...mapGetters([
      "getProductsInShelf",
      "getProductBatches",
      "getProductCurrentQty",
      "getReplenishQty",
      "getBatchMaxQty",
    ]),

    newBatchForm() {
      return this.pendingNew.form || {};
    },

    pendingList() {
      return this.pendingNew.list || [];
    },

    // 缓存筛选结果，性能大幅提升
    filteredShelfProductsMap() {
      const map = {};
      this.shelves.forEach((shelf) => {
        const all = this.getProductsInShelf(shelf.id) || [];
        map[shelf.id] = all;
      });
      return map;
    },

    // 优化：是否有需要补货
    hasReplenishData() {
      const hasNeed = Object.values(this.filteredShelfProductsMap).some(
        (list) => list.some((sp) => this.getReplenishQty(sp) > 0)
      );
      return hasNeed || this.pendingList.length > 0;
    },
  },
  created() {
    // 提前在组件创建阶段初始化表单，避免首次渲染时出现 undefined
    this.initNewBatchForm();
  },
  mounted() {
    // 额外初始化一次（]当状态来自异步更新时也能保持一致）
    this.initNewBatchForm();

  },
  methods: {
    ...mapMutations([
      "UPDATE_SHELF_PRODUCT_BATCHES",
      "UPDATE_NEW_BATCH_FORM",
      "ADD_PENDING_ITEM",
      "DELETE_PENDING_ITEM",
      "CLEAR_PENDING_LIST",
    ]),

    initNewBatchForm() {
      this.shelfProducts.forEach((sp) => {
        this.UPDATE_NEW_BATCH_FORM({
          shelfProductId: sp.id,
          formData: { produceDate: "", batchnum: 0 },
        });
      });
    },

    updateNewBatchForm(shelfProductId, field, value) {
      const current = this.newBatchForm[shelfProductId] || {
        produceDate: "",
        batchnum: 0,
      };
      this.UPDATE_NEW_BATCH_FORM({
        shelfProductId,
        formData: { ...current, [field]: value },
      });
    },

    getPreviewColor(shelfProduct) {
      const totalAfter = this.getTotalAfterQty(shelfProduct);
      return totalAfter > shelfProduct.max ? "#f44336" : "#007aff";
    },

    getPendingItems(shelfProductId) {
      return this.pendingList.filter(
        (x) => x.shelfProductId === shelfProductId
      );
    },

    // 计算补货后该商品的总库存（所有批次 + 待补货）
    getTotalAfterQty(shelfProduct) {
      const current = this.getProductCurrentQty(shelfProduct);
      const pendingQty = this.getPendingItems(shelfProduct.id).reduce(
        (sum, i) => sum + (i.batchnum || 0),
        0
      );
      return current + pendingQty;
    },

    // 计算新批次可输入最大数值（考虑旧批次补货与待补货项）
    getNewBatchMaxQty(shelfProduct) {
      const current = this.getProductCurrentQty(shelfProduct);
      const oldAdd = this.shelfProductBatches
        .filter(b => b.shelfProductId === shelfProduct.id)
        .reduce((sum, b) => sum + (b.addQty || 0), 0);
      const pendingQty = this.getPendingItems(shelfProduct.id).reduce(
        (sum, i) => sum + (i.batchnum || 0),
        0
      );
      const maxVal = shelfProduct.max - current - oldAdd - pendingQty;
      return Math.max(0, maxVal);
    },


    addNewPending(shelfProduct) {
      const form = this.newBatchForm[shelfProduct.id];
      const product = this.products.find(
        (p) => p.id === shelfProduct.productId
      );

      const check = validateForm({
        生产日期: form.produceDate,
        批次数量: form.batchnum,
      });
      if (!check.valid) {
        this.$message.error(check.message);
        return;
      }

      const expireDate = calculateExpireDate(
        form.produceDate,
        product.period,
        product.unit
      );
      if (!expireDate) {
        this.$message.error("保质期计算失败");
        return;
      }

      const current = this.getProductCurrentQty(shelfProduct);
      // 统计已有待添加数量，避免多次添加造成溢出
      const pendingQty = this.getPendingItems(shelfProduct.id).reduce(
        (sum, x) => sum + (x.batchnum || 0),
        0
      );

      if (current + pendingQty + form.batchnum > shelfProduct.max) {
        this.$confirm(
          `补货总量将超出最大容量 ${shelfProduct.max} 件，是否继续？`,
          "警告",
          { type: "warning" }
        ).then(() => {
          this.doAddPending(shelfProduct, form, expireDate);
        });
        return;
      }

      this.doAddPending(shelfProduct, form, expireDate);
    },

    doAddPending(shelfProduct, form, expireDate) {
      this.ADD_PENDING_ITEM({
        shelfProductId: shelfProduct.id,
        shelfId: shelfProduct.shelfId,
        productId: shelfProduct.productId,
        produceDate: form.produceDate,
        expireDate,
        batchnum: form.batchnum,
      });

      this.UPDATE_NEW_BATCH_FORM({
        shelfProductId: shelfProduct.id,
        formData: { produceDate: "", batchnum: 0 },
      });

      this.$message.success("已加入待补货");
    },

    deletePending(shelfProductId, index) {
      this.DELETE_PENDING_ITEM({ shelfProductId, index });
      this.$message.success("已删除");
    },

    async confirmReplenish() {
      this.confirmLoading = true;
      try {
        // 检查是否有实际补货内容
        if (this.pendingList.length === 0) {
          this.$message.warning("没有需要补货的内容");
          this.confirmLoading = false;
          return;
        }

        let batches = [...this.shelfProductBatches];

        // 新批次合并
        this.pendingList.forEach((item) => {
          const exist = batches.find(
            (b) =>
              b.shelfProductId === item.shelfProductId &&
              b.produceDate === item.produceDate
          );
          if (exist) {
            exist.batchnum += item.batchnum;
          } else {
            batches.push({
              id: calculateId(batches),
              shelfProductId: item.shelfProductId,
              shelfId: item.shelfId,
              productId: item.productId,
              produceDate: item.produceDate,
              expireDate: item.expireDate,
              batchnum: item.batchnum,
            });
          }
        });

        const final = batches.filter((b) => b.batchnum > 0);
        this.UPDATE_SHELF_PRODUCT_BATCHES(final);
        this.CLEAR_PENDING_LIST();
        // 重新初始化新批次表单，确保按钮重新出现
        this.initNewBatchForm();

        this.$message.success("补货成功");
      } catch (err) {
        console.error(err);
        this.$message.error("补货失败");
      } finally {
        this.confirmLoading = false;
      }
    },
  },
  watch: {
    // 如果货架商品变动，则重新初始化表单
    shelfProducts: {
      handler() {
        this.initNewBatchForm();
      },
      deep: true,
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
  border: 1px solid #000;
  padding: 10px 15px;
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
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.batch-item {
  margin: 10px 0;
  padding: 8px 0;
  font-size: 14px;
  color: #555;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.batch-section .batch-item {
  background-color: #f5f5f5;
  padding: 8px 10px;
}
.stock-preview {
  margin-top: 5px;
  font-size: 13px;
  padding-left: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
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
  font-size: 30px;
}
.btn-group {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
.btn-group > .el-button {
  flex: 1;
  padding: 12px 0;
  font-size: 16px;
}
</style>