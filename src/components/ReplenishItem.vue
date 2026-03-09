<template>
  <div>
    <h4 class="product-title">
      [{{ categoryName }}] → {{ productName }} （需补
      {{ replenishQty }} 件）
    </h4>

    <div class="stock-preview" :style="{ color: previewColor }">
      补货后库存：{{ totalAfterQty }}件 / 此货架该商品最大容量：{{
        shelfProduct.max
      }}件
      <span v-if="totalAfterQty > shelfProduct.max" class="warning-text">
        （超出此货架该商品最大容量）
      </span>
    </div>

    <div class="batch-section">
      <div v-for="batch in existingBatches" :key="batch.id" class="batch-item">
        {{ batch.produceDate }} (库存：{{ batch.batchnum }}件)
      </div>
    </div>

    <div class="new-batch-section" v-if="localForm">
      <el-collapse>
        <el-collapse-item title="添加批次(请点击)" class="batch-collapse-item">
          <div class="new-batch-form">
            选择生产日期：
            <el-date-picker
              v-model="localForm.produceDate"
              type="date"
              placeholder="选择生产日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              :picker-options="datePickerOptions"
              @change="handleDateChange"
            ></el-date-picker>
            <el-row> 补货数量： </el-row>
            <el-row type="flex" justify="space-between"
              ><el-col :span="8"
                ><el-input-number
                  v-model.number="localForm.batchnum"
                  :min="0"
                  :max="newBatchMaxQty"
                  placeholder="0"
                  size="mini"
                  style="width: 140px"
                  class="qty-input"
                  @change="handleNumberChange"
                ></el-input-number>
              </el-col>
              <el-col :span="8"
                ><el-button
                  type="primary"
                  size="mini"
                  style="margin-left: 10px; border: 1px solid #000; width: 60px"
                  @click="handleAdd"
                  :disabled="!localForm.produceDate || localForm.batchnum <= 0"
                  class="add-btn"
                >
                  添加
                </el-button></el-col
              >
            </el-row>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-if="pendingItems.length > 0" class="pending-section">
      <strong>待上新批次：</strong>
      <div v-for="(item, index) in pendingItems" :key="index" class="todo-item">
        {{ item.produceDate }} → {{ item.batchnum }}件
        <el-button
          type="text"
          size="mini"
          @click="deleteItem(index)"
          class="delete-btn"
        >
          ×
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { calculateExpireDate, validateForm } from "@/utils/helpers";

export default {
  name: "ReplenishItem",
  props: {
    shelfProduct: { type: Object, required: true },
    productName: { type: String, required: true },
    categoryName: { type: String, required: true },
    replenishQty: { type: Number, required: true },
    totalAfterQty: { type: Number, required: true },
    previewColor: { type: String, required: true },
    newBatchMaxQty: { type: Number, required: true },
    existingBatches: { type: Array, default: () => [] },
    pendingItems: { type: Array, default: () => [] },
    newBatchForm: {
      type: Object,
      default: () => ({ produceDate: "", batchnum: 0 }),
    },
  },
  data() {
    return {
      localForm: { ...this.newBatchForm }, // 局部拷贝，避免直接修改 prop
    };
  },
  watch: {
    newBatchForm: {
      handler(val) {
        this.localForm = { ...val };
      },
      deep: true,
    },
  },
  computed: {
    datePickerOptions() {
      return {
        disabledDate(time) {
          // 只允许选择今天及以前的日期
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return time.getTime() > today.getTime();
        },
      };
    },
  },
  methods: {
    handleDateChange(val) {
      this.$emit("update-form", {
        shelfProductId: this.shelfProduct.id,
        field: "produceDate",
        value: val,
      });
    },
    handleNumberChange(val) {
      this.$emit("update-form", {
        shelfProductId: this.shelfProduct.id,
        field: "batchnum",
        value: val,
      });
    },
    handleAdd() {
      const product = this.$parent.products.find(
        (p) => p.id === this.shelfProduct.productId
      );
      const check = validateForm({
        生产日期: this.localForm.produceDate,
        批次数量: this.localForm.batchnum,
      });
      if (!check.valid) {
        this.$message.error(check.message);
        return;
      }

      const expireDate = calculateExpireDate(
        this.localForm.produceDate,
        product.period,
        product.unit
      );
      if (!expireDate) {
        this.$message.error("保质期计算失败");
        return;
      }

      this.$emit("add-pending", {
        shelfProduct: this.shelfProduct,
        form: this.localForm,
        expireDate,
      });
    },
    deleteItem(index) {
      this.$emit("delete-pending", {
        shelfProductId: this.shelfProduct.id,
        index,
      });
    },
  },
};
</script>

<style scoped>
/* 整体卡片风格 */
.product-title {
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 库存预览区域 */
.stock-preview {
  font-size: 14px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid;
  transition: border-color 0.2s;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.warning-text {
  color: #f44336;
  font-weight: 500;
  background-color: rgba(244, 67, 54, 0.1);
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 12px;
  margin-left: 4px;
  white-space: nowrap;
}

/* 现有批次区域 */
.batch-section {
  margin-bottom: 20px;
}
.batch-section .batch-item {
  background-color: #f5f5f5;
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #555;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.new-batch-section {
  margin-bottom: 20px;
}
.batch-collapse-item {
  border: 1px solid #ddd !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.batch-collapse-item >>> .el-collapse-item__header {
  padding: 12px 16px;
  font-weight: 500;
  background-color: #fafafa;
  border-bottom: 1px solid #eee;
  border-radius: 8px 8px 0 0;
}
.batch-collapse-item >>> .el-collapse-item__wrap {
  background-color: white;
  border-radius: 0 0 8px 8px;
}
.batch-collapse-item >>> .el-collapse-item__content {
  padding: 16px;
}

/* 新增批次表单容器 */
.new-batch-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.new-batch-form .el-date-picker,
.new-batch-form .el-input-number {
  width: 100%;
}
.new-batch-form .add-btn {
  align-self: flex-end;
  width: 100px;
}

/* 待上新批次区域 */
.pending-section {
  margin-top: 16px;
  padding: 12px;
  background-color: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}
.pending-section strong {
  display: block;
  margin-bottom: 8px;
  color: #e65100;
  font-size: 14px;
}
.todo-item {
  background: white;
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 6px;
  border: 1px solid #ffe0b2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  transition: box-shadow 0.2s;
}
.todo-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.delete-btn {
  color: #f44336;
  font-size: 20px;
  padding: 4px 8px;
}
.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .product-title {
    font-size: 15px;
  }
  .stock-preview {
    font-size: 13px;
    padding: 8px 10px;
  }
  .batch-section .batch-item {
    font-size: 13px;
    padding: 6px 10px;
  }
  .new-batch-form {
    gap: 12px;
  }
  .new-batch-form .add-btn {
    width: 100%;
  }
  .todo-item {
    font-size: 13px;
  }
}
</style>