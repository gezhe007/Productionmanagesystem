<template>
  <div>
    <div
      class="page-header"
      style="display: flex; justify-content: center; margin-bottom: 20px"
    >
      <h2>仓库管理</h2>
      <el-button type="success" @click="CLEAR_ALL_DATA">清空所有数据</el-button>
    </div>

    <div class="warehouse-module">
      <div class="filter-group">
        <span style="width: 100px; font-size: 16px; font-weight: 500"
          >筛选分类：</span
        >
        <!-- 修复1：筛选下拉框绑定分类ID（数字），而非整个对象 -->
        <el-select v-model="filterCatId" placeholder="全部" style="width: 200px">
          <el-option label="全部" :value="0"></el-option>
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          ></el-option>
        </el-select>
        <el-button type="success" @click="openAddModal">添加新商品</el-button>
      </div>

      <div id="product-batch-list" class="product-list-container">
        <div v-if="filteredProducts.length === 0" class="empty-item">
          暂无商品，请先添加商品
        </div>
        <div
          v-else
          class="product-batch-item"
          v-for="product in filteredProducts"
          :key="product.id"
        >
          <el-row type="flex" justify="space-between">
            <el-col :span="10">
              <strong>[{{ product.category.name }}] {{ product.name }}</strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px">
                标准保质期：{{ product.period }}{{ product.unit }}
              </div>
            </el-col>
            <el-col :span="1">
              <el-button
                type="warning"
                size="mini"
                @click="openEditModal(product)"
                >修改</el-button
              >
            </el-col>
            <el-col :span="6">
              <el-button
                type="danger"
                size="mini"
                @click="openDeleteModal(product)"
                style="margin-left: 8px"
                >删除</el-button
              ></el-col>
          </el-row>
        </div>
      </div>
    </div>

    <el-dialog
      title="添加新商品"
      :visible.sync="addModalVisible"
      width="380px"
      @close="resetAddForm"
    >
      <el-form
        :model="product"
        :rules="formRules"
        ref="addFormRef"
        label-width="100px"
      >
        <el-form-item label="商品名" prop="name">
          <el-input
            v-model="product.name"
            placeholder="请输入商品名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <!-- 修复2：弹窗下拉框绑定分类ID（数字），而非对象 -->
          <el-select v-model="product.categoryId" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标准保质期" prop="period">
          <el-input-number
            v-model="product.period"
            :min="1"
            style="width: 150px"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="product.unit"
            style="margin-left: 10px; width: 80px"
          >
            <el-option label="天" value="天"></el-option>
            <el-option label="月" value="月"></el-option>
            <el-option label="年" value="年"></el-option>
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

    <el-dialog
      title="修改商品"
      :visible.sync="editModalVisible"
      width="380px"
      @close="resetEditForm"
    >
      <el-form
        :model="product"
        :rules="formRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="商品名" prop="name">
          <el-input
            v-model="product.name"
            placeholder="请输入商品名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <!-- 修复2：弹窗下拉框绑定分类ID（数字），而非对象 -->
          <el-select v-model="product.categoryId" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标准保质期" prop="period">
          <el-input-number
            v-model="product.period"
            :min="1"
            style="width: 150px"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="product.unit"
            style="margin-left: 10px; width: 80px"
          >
            <el-option label="天" value="天"></el-option>
            <el-option label="月" value="月"></el-option>
            <el-option label="年" value="年"></el-option>
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
    <el-dialog
      :visible.sync="deleteModalVisible"
      width="350px"
      @close="deleteModalVisible = false"
      ><div style="margin: 10px 30px; font-size: 17px">
        <strong>确定删除商品【{{ product.name }}】?</strong>
        <div style="text-align: left">该操作将删除：</div>
        <div>1. 该商品在货架的关联记录</div>
        <div>2. 货架上该商品相关的批次记录</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDelete">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapMutations, mapState, mapGetters } from "vuex";
import { generateId, calculateExpireDate, validateForm } from "@/utils/helpers";

export default {
  name: "Warehouse",
  data() {
    return {
      // 修复1：筛选值改为数字类型（0代表全部）
      filterCatId: 0,

      addModalVisible: false,
      editModalVisible: false,
      deleteModalVisible: false,
      product: {
        id: "",
        name: "",
        // 修复2：用categoryId（数字）替代category（对象）
        categoryId: 0,
        period: "",
        unit: "天",
      },
      formRules: {
        name: [
          { required: true, message: "请输入商品名称", trigger: "blur" },
          {
            min: 1,
            max: 50,
            message: "商品名称长度需在1-50个字符之间",
            trigger: "blur",
          },
        ],
        // 修复2：验证规则改为categoryId
        categoryId: [
          { required: true, message: "请选择分类", trigger: "change" },
          { type: "number", min: 1, message: "请选择有效分类", trigger: "change" }
        ],
        period: [
          { required: true, message: "请输入保质期数值", trigger: "blur" },
          {
            type: "number",
            min: 1,
            message: "保质期必须大于0",
            trigger: "blur",
          },
        ],
      },
    };
  },
  computed: {
    ...mapState([
      "products",
      "categories",
      "shelfBatches",
      "shelfProducts",
      "expireThreshold",
    ]),
    ...mapGetters(["getProductById"]),
    filteredProducts() {
      // 修复1：筛选逻辑改为基于categoryId
      if (this.filterCatId === 0) return this.products;
      return this.products.filter((p) => p.category.id === this.filterCatId);
    },
    // 辅助：根据ID快速查找分类对象
    getCategoryById() {
      return (id) => this.categories.find(cat => cat.id === id) || {};
    }
  },
  methods: {
    ...mapMutations([
      "ADD_PRODUCT",
      "CLEAR_ALL_DATA",
      "UPDATE_PRODUCTS",
      "UPDATE_SHELF_PRODUCTS",
      "UPDATE_SHELF_BATCHES",
    ]),

    openAddModal() {
      this.resetAddForm();
      this.addModalVisible = true;
    },

    resetAddForm() {
      this.$nextTick(() => {
        if (this.$refs.addFormRef) {
          this.$refs.addFormRef.clearValidate();
        }
      });
      if (!this.addModalVisible) {
        this.product = {
          id: "",
          name: "",
          categoryId: 0,
          period: "",
          unit: "天",
        };
      }
    },

    saveAddForm() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return;

        // 修复2：验证逻辑改为categoryId
        const validateResult = validateForm({
          商品名: this.product.name.trim(),
          分类: this.getCategoryById(this.product.categoryId),
          保质期数值: this.product.period,
        });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        const isNameExist = this.products.some(
          (p) => p.name.trim() === this.product.name.trim()
        );
        if (isNameExist) {
          this.$message.error("该商品名称已存在，请更换名称");
          return;
        }

        const newProductId = this.products.length > 0 
          ? this.products[this.products.length - 1].id + 1 
          : 1;

        // 修复2：组装商品数据时，把categoryId转为分类对象
        const newProduct = {
          id: newProductId,
          name: this.product.name.trim(),
          category: this.getCategoryById(this.product.categoryId),
          period: this.product.period,
          unit: this.product.unit,
        };
        this.ADD_PRODUCT(newProduct);
        this.$message.success("商品添加成功");
        console.log(newProduct);
        this.addModalVisible = false;
      });
    },

    openEditModal(product) {
      this.resetEditForm();
      // 修复2：编辑时把分类对象转为categoryId
      this.product = {
        id: product.id,
        name: product.name,
        categoryId: product.category.id,
        period: product.period,
        unit: product.unit,
      };
      this.editModalVisible = true;
    },

    resetEditForm() {
      this.$nextTick(() => {
        if (this.$refs.editFormRef) {
          this.$refs.editFormRef.clearValidate();
        }
      });
    },

    saveEditForm() {
      this.$refs.editFormRef.validate(async (valid) => {
        if (!valid) return;

        // 修复2：验证逻辑改为categoryId
        const validateResult = validateForm({
          商品名: this.product.name.trim(),
          分类: this.getCategoryById(this.product.categoryId),
          保质期数值: this.product.period,
        });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }
        const isNameExist = this.products.some(
          (p) =>
            p.name.trim() === this.product.name.trim() &&
            p.id !== this.product.id
        );
        if (isNameExist) {
          this.$message.error("该商品名称已存在，请更换名称");
          return;
        }

        const productId = this.product.id;
        // 修复2：组装新商品数据时，把categoryId转为分类对象
        const newProduct = {
          id: productId,
          name: this.product.name.trim(),
          category: this.getCategoryById(this.product.categoryId),
          period: this.product.period,
          unit: this.product.unit,
        };
        const newProducts = this.products.map((product) => {
          if (product.id === productId) {
            return newProduct;
          }
          return product;
        });

        const newShelfBatches = this.shelfBatches.map((batch) => {
          if (batch.productId === productId && batch.produceDate) {
            const expireDateStr = calculateExpireDate(
              batch.produceDate,
              this.product.period,
              this.product.unit
            );
            return {
              ...batch,
              expire: expireDateStr,
              productName: this.product.name.trim(),
            };
          }
          return batch;
        });

        const newShelfProducts = this.shelfProducts.map((sp) => {
          if (sp.productId === productId) {
            return {
              ...sp,
              name: this.product.name.trim(),
              category: newProduct.category,
              shelfLife: this.product.period,
              shelfLifeUnit: this.product.unit,
            };
          }
          return sp;
        });

        this.UPDATE_PRODUCTS(newProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.$message.success("商品修改成功，已同步更新所有关联批次信息");
        this.editModalVisible = false;
      });
    },
    openDeleteModal(product) {
      this.product = { ...product };
      this.deleteModalVisible = true;
    },
    confirmDelete() {
      const productId = this.product.id;
      const newProducts = this.products.filter((p) => p.id !== productId);
      const newShelfProducts = this.shelfProducts.filter(
        (sp) => sp.productId !== productId
      );
      const newShelfBatches = this.shelfBatches.filter(
        (b) => b.productId !== productId
      );
      this.UPDATE_PRODUCTS(newProducts);
      this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
      this.UPDATE_SHELF_BATCHES(newShelfBatches);
      this.$message.success(`商品【${this.product.name}】已成功删除`);
      this.deleteModalVisible = false;
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