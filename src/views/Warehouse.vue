<template>
  <div>
    <!-- 页面标题 -->
    <div class="page-header" style="display: flex; justify-content: center; margin-bottom: 20px">
      <h2>仓库管理</h2>
    </div>

    <!-- 商品批次管理模块 -->
    <div class="warehouse-module">
      <div class="filter-group">
        <span style="width: 100px; font-size: 16px; font-weight: 500">筛选分类：</span>
        <el-select
          v-model="filterCat"
          placeholder="全部"
          style="width: 200px"
        >
          <el-option label="全部" value=""></el-option>
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          ></el-option>
        </el-select>
        <el-button type="success" @click="openAddModal">添加新商品</el-button>
      </div>

      <!-- 商品列表 -->
      <div id="product-batch-list" class="product-list-container">
        <div v-if="filteredProducts.length === 0" class="empty-item">
          暂无商品，请先添加商品
        </div>
        <div
          v-else
          class="product-batch-item"
          v-for="(product, index) in filteredProducts"
          :key="product.id"
        >
          <div class="product-info">
            <div class="product-basic-info">
              <strong>[{{ product.category }}] {{ product.name }}</strong>
              <div style="font-size: 14px; color: #666; margin-top: 4px">
                标准保质期：{{ product.period }}{{ product.unit === "day" ? "天" : product.unit === "month" ? "月" : "年" }}
              </div>
            </div>
            <div class="product-actions">
              <el-button
                type="warning"
                size="mini"
                @click="openEditModal(product, index)"
              >修改商品</el-button>
              <el-button 
                type="danger" 
                size="mini" 
                @click="deleteProduct(product, index)"
                style="margin-left: 8px"
              >删除商品</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加商品弹窗 -->
    <el-dialog
      title="添加新商品"
      :visible.sync="addModalVisible"
      width="380px"
      @close="resetAddForm"
    >
      <el-form
        :model="addForm"
        :rules="formRules"
        ref="addFormRef"
        label-width="100px"
      >
        <el-form-item label="商品名" prop="name">
          <el-input
            v-model="addForm.name"
            placeholder="请输入商品名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="addForm.category" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标准保质期" prop="period">
          <el-input-number
            v-model="addForm.period"
            :min="1"
            style="width: 160px"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="addForm.unit"
            style="margin-left: 10px; width: 80px"
          >
            <el-option label="天" value="day"></el-option>
            <el-option label="月" value="month"></el-option>
            <el-option label="年" value="year"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddForm">保存商品</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改商品弹窗 -->
    <el-dialog
      title="修改商品"
      :visible.sync="editModalVisible"
      width="380px"
      @close="resetEditForm"
    >
      <el-form
        :model="editForm"
        :rules="formRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="商品名" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入商品名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标准保质期" prop="period">
          <el-input-number
            v-model="editForm.period"
            :min="1"
            style="width: 150px"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="editForm.unit"
            style="margin-left: 10px; width: 80px"
          >
            <el-option label="天" value="day"></el-option>
            <el-option label="月" value="month"></el-option>
            <el-option label="年" value="year"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditForm">保存修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import { generateId, calculateExpireDate, validateForm } from "@/utils/helpers";

export default {
  name: "Warehouse",
  data() {
    return {
      // 筛选条件
      filterCat: "",

      // 弹窗状态
      addModalVisible: false,
      editModalVisible: false,

      // 表单数据
      addForm: {
        name: "",
        category: "",
        period: "",
        unit: "day",
      },
      editForm: {
        id: "",
        name: "",
        category: "",
        period: "",
        unit: "day",
        index: -1,
      },

      // 表单校验规则
      formRules: {
        name: [
          { required: true, message: "请输入商品名称", trigger: "blur" },
          { min: 1, max: 50, message: "商品名称长度需在1-50个字符之间", trigger: "blur" }
        ],
        category: [
          { required: true, message: "请选择分类", trigger: "change" },
        ],
        period: [
          { required: true, message: "请输入保质期数值", trigger: "blur" },
          { type: "number", min: 1, message: "保质期必须大于0", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    // 从Vuex映射状态（替代直接读取Storage）
    ...mapState([
      "products",
      "categories",
      "shelfBatches",
      "shelfProducts",
      "expireThreshold"
    ]),
    // 筛选后的商品列表
    filteredProducts() {
      if (!this.filterCat) return this.products;
      return this.products.filter((p) => p.category === this.filterCat);
    },
  },
  methods: {
    // 映射Vuex的mutation方法
    ...mapMutations([
      "UPDATE_PRODUCTS",
      "UPDATE_SHELF_BATCHES",
      "UPDATE_SHELF_PRODUCTS"
    ]),

    // ========== 商品添加 ==========
    // 打开添加商品弹窗
    openAddModal() {
      this.resetAddForm();
      this.addModalVisible = true;
    },

    // 重置添加表单
    resetAddForm() {
      this.addForm = {
        name: "",
        category: "",
        period: "",
        unit: "day",
      };
      this.$nextTick(() => {
        if (this.$refs.addFormRef) {
          this.$refs.addFormRef.resetFields();
        }
      });
    },

    // 保存添加商品
    saveAddForm() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return;

        // 通用表单校验
        const validateResult = validateForm({
          商品名: this.addForm.name.trim(),
          分类: this.addForm.category,
          保质期数值: this.addForm.period,
        });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        // 校验商品名称是否重复
        const isNameExist = this.products.some(
          p => p.name.trim() === this.addForm.name.trim()
        );
        if (isNameExist) {
          this.$message.error("该商品名称已存在，请更换名称");
          return;
        }

        // 构建新商品数据
        const newProduct = {
          id: generateId("prod"),
          name: this.addForm.name.trim(),
          category: this.addForm.category,
          period: this.addForm.period,
          unit: this.addForm.unit,
          // 兼容货架页面的字段命名
          shelfLife: this.addForm.period,
          shelfLifeUnit: this.addForm.unit
        };

        // 更新Vuex状态（自动同步到本地存储）
        const newProducts = [...this.products, newProduct];
        this.UPDATE_PRODUCTS(newProducts);

        this.$message.success("商品添加成功");
        this.addModalVisible = false;
      });
    },

    // ========== 商品编辑 ==========
    // 打开编辑商品弹窗
    openEditModal(product, index) {
      this.editForm = {
        id: product.id,
        name: product.name,
        category: product.category,
        period: product.period || product.shelfLife, // 兼容字段
        unit: product.unit || product.shelfLifeUnit, // 兼容字段
        index: index,
      };
      this.editModalVisible = true;
      this.$nextTick(() => {
        if (this.$refs.editFormRef) {
          this.$refs.editFormRef.resetFields();
        }
      });
    },

    // 重置编辑表单
    resetEditForm() {
      this.editForm = {
        id: "",
        name: "",
        category: "",
        period: "",
        unit: "day",
        index: -1,
      };
    },

    // 保存编辑商品
    saveEditForm() {
      this.$refs.editFormRef.validate(async (valid) => {
        if (!valid) return;

        // 通用表单校验
        const validateResult = validateForm({
          商品名: this.editForm.name.trim(),
          分类: this.editForm.category,
          保质期数值: this.editForm.period,
        });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        // 校验商品名称是否重复（排除自身）
        const isNameExist = this.products.some(
          (p, idx) => p.name.trim() === this.editForm.name.trim() && idx !== this.editForm.index
        );
        if (isNameExist) {
          this.$message.error("该商品名称已存在，请更换名称");
          return;
        }

        const productId = this.editForm.id;
        // 1. 更新商品基础信息
        const newProducts = [...this.products];
        newProducts[this.editForm.index] = {
          ...newProducts[this.editForm.index],
          name: this.editForm.name.trim(),
          category: this.editForm.category,
          period: this.editForm.period,
          unit: this.editForm.unit,
          shelfLife: this.editForm.period, // 同步兼容字段
          shelfLifeUnit: this.editForm.unit // 同步兼容字段
        };

        // 2. 同步更新所有关联批次的过期日期
        const newShelfBatches = this.shelfBatches.map((batch) => {
          if (batch.productId === productId && batch.produceDate) {
            // 重新计算过期日期
            const expireDateStr = calculateExpireDate(
              batch.produceDate,
              this.editForm.period,
              this.editForm.unit
            );
            return {
              ...batch,
              expire: expireDateStr,
              productName: this.editForm.name.trim() // 同步更新批次中的商品名称
            };
          }
          return batch;
        });

        // 3. 同步更新货架商品关联信息
        const newShelfProducts = this.shelfProducts.map((sp) => {
          if (sp.productId === productId) {
            return {
              ...sp,
              name: this.editForm.name.trim(),
              category: this.editForm.category,
              shelfLife: this.editForm.period,
              shelfLifeUnit: this.editForm.unit
            };
          }
          return sp;
        });

        // 批量更新Vuex状态
        this.UPDATE_PRODUCTS(newProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.$message.success("商品修改成功，已同步更新所有关联批次信息");
        this.editModalVisible = false;
      });
    },

    // ========== 商品删除 ==========
    deleteProduct(product, index) {
      const productId = product.id;

      // 统计关联数据
      const shelfProductCount = this.shelfProducts.filter(
        (sp) => sp.productId === productId
      ).length;
      const shelfBatchCount = this.shelfBatches.filter(
        (b) => b.productId === productId
      ).length;

      this.$confirm(
        `确定删除商品【${product.name}】？\n该操作将删除：\n1. 该商品在${shelfProductCount}个货架的关联记录\n2. ${shelfBatchCount}个商品批次记录\n数据删除后无法恢复！`,
        "删除确认",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning",
          dangerMode: true
        }
      ).then(() => {
        // 1. 删除商品
        const newProducts = this.products.filter((_, idx) => idx !== index);
        
        // 2. 删除关联的货架商品记录
        const newShelfProducts = this.shelfProducts.filter(
          (sp) => sp.productId !== productId
        );

        // 3. 删除关联的批次记录
        const newShelfBatches = this.shelfBatches.filter(
          (b) => b.productId !== productId
        );

        // 批量更新Vuex状态
        this.UPDATE_PRODUCTS(newProducts);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.$message.success(`商品【${product.name}】已成功删除`);
      }).catch(() => {
        this.$message.info("已取消删除操作");
      });
    },
  },
};
</script>

<style scoped>
.warehouse-module {
  margin: 15px 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.filter-group {
  margin: 10px 0 20px 0;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.product-list-container {
  width: 100%;
}

.product-batch-item {
  margin: 10px 0;
  padding: 15px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.product-batch-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #dcdcdc;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.product-basic-info {
  flex: 1;
}

.product-actions {
  display: flex;
  align-items: center;
}

.empty-item {
  margin: 10px 0;
  padding: 40px 0;
  border: 1px dashed #e0e0e0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

/* 适配小屏幕 */
@media (max-width: 768px) {
  .product-info {
    flex-direction: column;
    align-items: flex-start;
  }
  .product-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>