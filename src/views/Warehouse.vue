<template>
  <div>
    <!-- <el-button type="success" @click="CLEAR_ALL_DATA">恢复默认值</el-button> -->
    <div class="warehouse-module">
      <el-row type="flex" justify="space-between">
        <el-col :span="12">
          <el-select
            v-model="filterCatId"
            placeholder="全部"
            style="width: 130px; border: 1px solid #000; border-radius: 4px"
          >
            <el-option label="全部" :value="0"></el-option>
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option> </el-select
        ></el-col>
        <el-col :span="10"
          ><el-button
            style="border: 1px solid #000"
            type="success"
            @click="openAddModal"
            >添加新商品</el-button
          ></el-col
        >
      </el-row>

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
          <el-collapse>
            <el-collapse-item :title="getProductsTitle(product)">
              <div style="margin-bottom: 10px">
                保质期：{{ product.period }} {{ product.unit }}
              </div>
              <el-row type="flex" justify="space-between">
                <el-col :span="8">
                  <el-button
                    type="warning"
                    size="mini"
                    style="border: 1px solid #000"
                    @click="openEditModal(product)"
                    >修改</el-button
                  >
                </el-col>
                <el-col :span="7">
                  <el-button
                    type="danger"
                    size="mini"
                    @click="openDeleteModal(product)"
                    style="margin-left: 8px; border: 1px solid #000"
                    >删除</el-button
                  ></el-col
                >
              </el-row></el-collapse-item
            >
          </el-collapse>
        </div>
      </div>
    </div>

    <el-dialog
      title="添加新商品"
      :visible.sync="addModalVisible"
      width="320px"
      style="text-align: center"
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
          <el-select v-model="product.categoryId" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="保质期" prop="period">
          <el-input-number
            v-model="product.period"
            :min="1"
            style="width: 100px"
            size="mini"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="product.unit"
            size="mini"
            style="margin-left: 10px; width: 60px"
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
      width="320px"
      style="text-align: center"
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
        <el-form-item label="保质期" prop="period">
          <el-input-number
            v-model="product.period"
            :min="1"
            style="width: 100px"
            size="mini"
            placeholder="数字"
          ></el-input-number>
          <el-select
            v-model="product.unit"
            size="mini"
            style="margin-left: 10px; width: 60px"
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
      width="320px"
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
import { mapMutations, mapState, mapGetters, mapActions } from "vuex";
import {
  calculateId,
  calculateExpireDate,
  validateForm,
} from "@/utils/helpers";

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
          {
            type: "number",
            min: 1,
            message: "请选择有效分类",
            trigger: "change",
          },
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
      "shelfProductBatches",
      "shelfProducts",
      "expireThreshold",
    ]),
    ...mapGetters([
      "getProductById",
      "getCategoryById",
      "getShelfById",
      "getShelfProductById",
    ]),
    filteredProducts() {
      const sortByIdDesc = (a, b) => b.id - a.id;

      if (this.filterCatId === 0) {
        return [...this.products].sort(sortByIdDesc);
      }
      return this.products
        .filter((p) => p.categoryId === this.filterCatId)
        .sort(sortByIdDesc);
    },
  },
  methods: {
    ...mapMutations([
      "ADD_PRODUCT",
      "CLEAR_ALL_DATA",
      "UPDATE_PRODUCTS",
      "UPDATE_SHELF_PRODUCTS",
      "UPDATE_SHELF_PRODUCT_BATCHES",
    ]),
    ...mapActions(["updateProduct"]),
    getProductsTitle(product) {
      return `[${this.getCategoryById(product.categoryId).name}]
                ${product.name}`;
    },
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
          categoryId: "",
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
          分类: this.product.categoryId,
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

        const newProductId = calculateId(this.products);

        // 修复2：组装商品数据时，把categoryId转为分类对象
        const newProduct = {
          id: newProductId,
          name: this.product.name.trim(),
          categoryId: this.product.categoryId,
          period: this.product.period,
          unit: this.product.unit,
        };
        this.ADD_PRODUCT(newProduct);
        this.$message.success("商品添加成功");
        this.addModalVisible = false;
      });
    },

    openEditModal(product) {
      this.resetEditForm();
      // 修复2：编辑时把分类对象转为categoryId
      this.product = {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
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
          分类: this.product.categoryId,
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
        const newProduct = {
          id: productId,
          name: this.product.name.trim(),
          categoryId: this.product.categoryId,
          period: this.product.period,
          unit: this.product.unit,
        };
        const newShelfProductBatches = this.shelfProductBatches.map((batch) => {
          if (
            this.getShelfProductById(batch.shelfProductId).productId ===
              productId &&
            batch.produceDate
          ) {
            const expireDateStr = calculateExpireDate(
              batch.produceDate,
              this.product.period,
              this.product.unit
            );
            return {
              ...batch,
              expireDate: expireDateStr,
            };
          }
          return batch;
        });

        this.updateProduct(newProduct);

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
      const newShelfProductBatches = this.shelfProductBatches.filter(
        (b) => this.getShelfProductById(b.shelfProductId).productId !== productId
      );
      this.UPDATE_PRODUCTS(newProducts);
      this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
      this.UPDATE_SHELF_PRODUCT_BATCHES(newShelfProductBatches);
      this.$message.success(`商品【${this.product.name}】已成功删除`);
      this.deleteModalVisible = false;
    },
  },
};
</script>

<style scoped>
.warehouse-module {
  padding: 20px;
  border: 1px solid #000;
  border-radius: 8px;
  background-color: #fff;
}

.product-list-container {
  width: 100%;
}

.product-batch-item {
  margin: 10px 0;
  padding: 15px;
  border: 1px solid #000000;
  border-radius: 8px;
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