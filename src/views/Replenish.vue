<template>
  <div class="replenish-page">
    <div class="content-container">
      <el-empty v-if="!hasReplenishData">无需补货</el-empty>

      <template v-else>
        <div
          v-for="item in replenishItems"
          :key="item.shelfProduct.id"
          class="product-item"
        >
          <ReplenishItem
            :shelf-product="item.shelfProduct"
            :product-name="item.productName"
            :category-name="item.categoryName"
            :replenish-qty="item.replenishQty"
            :total-after-qty="item.totalAfterQty"
            :preview-color="item.previewColor"
            :new-batch-max-qty="item.newBatchMaxQty"
            :existing-batches="item.existingBatches"
            :pending-items="item.pendingItems"
            :new-batch-form="newBatchForm[item.shelfProduct.id]"
            @update-form="updateNewBatchForm"
            @add-pending="addNewPending"
            @delete-pending="deletePending"
          />
        </div>
      </template>
    </div>

    <div class="btn-group">
      <el-button
        type="danger"
        @click="confirmReplenish"
        :loading="confirmLoading"
        :disabled="!hasReplenishData"
      >
        确认补货
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import { calculateId } from "@/utils/helpers";
import ReplenishItem from "@/components/ReplenishItem.vue";

export default {
  name: "Replenish",
  components: { ReplenishItem },
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

    // 核心优化：生成所有需要补货的商品列表，包含所有计算好的数据
    replenishItems() {
      const items = [];
      this.shelves.forEach((shelf) => {
        const shelfProducts = this.getProductsInShelf(shelf.id) || [];
        shelfProducts.forEach((sp) => {
          const replenishQty = this.getReplenishQty(sp);
          if (replenishQty <= 0) return; // 跳过无需补货的商品

          const currentQty = this.getProductCurrentQty(sp);
          const pendingQty = this.getPendingItems(sp.id).reduce(
            (sum, i) => sum + (i.batchnum || 0),
            0
          );
          const totalAfterQty = currentQty + pendingQty;

          const oldAdd = this.shelfProductBatches
            .filter((b) => b.shelfProductId === sp.id)
            .reduce((sum, b) => sum + (b.addQty || 0), 0);
          const newBatchMaxQty = Math.max(
            0,
            sp.max - currentQty - oldAdd - pendingQty
          );

          items.push({
            shelfProduct: sp,
            productName: sp.productName,
            categoryName: sp.categoryName,
            replenishQty,
            totalAfterQty,
            previewColor: totalAfterQty > sp.max ? "#f44336" : "#007aff",
            newBatchMaxQty,
            existingBatches: this.getProductBatches(sp.id),
            pendingItems: this.getPendingItems(sp.id),
          });
        });
      });
      return items;
    },

    hasReplenishData() {
      return this.replenishItems.length > 0 || this.pendingList.length > 0;
    },
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
        if (!this.newBatchForm[sp.id]) {
          this.UPDATE_NEW_BATCH_FORM({
            shelfProductId: sp.id,
            formData: { produceDate: "", batchnum: 0 },
          });
        }
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

    getPendingItems(shelfProductId) {
      return this.pendingList.filter(
        (x) => x.shelfProductId === shelfProductId
      );
    },

    // 添加待补货批次（实际逻辑移到子组件，通过事件触发）
    addNewPending({ shelfProduct, form, expireDate }) {
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

    deletePending({ shelfProductId, index }) {
      this.DELETE_PENDING_ITEM({ shelfProductId, index });
      this.$message.success("已删除");
    },

    async confirmReplenish() {
      // ... 与原代码相同，无需修改
      this.confirmLoading = true;
      try {
        if (this.pendingList.length === 0) {
          this.$message.warning("没有需要补货的内容");
          this.confirmLoading = false;
          return;
        }

        let batches = [...this.shelfProductBatches];

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
    shelfProducts: {
      handler() {
        this.initNewBatchForm();
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style scoped>
.content-container {
  min-height: 200px;
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
  border-radius: 8px;
  border: 1px solid #000;
}

/* 新增：商品卡片黑色边框 */
.product-item {
  border: 1px solid #000;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>