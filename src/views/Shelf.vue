<template>
  <div>
    <div class="page-header">
      <h2>货架清点</h2>
    </div>

    <el-row class="operation-bar">
      <el-button type="success" @click="openAddShelfModal">新增货架</el-button>
    </el-row>

    <div v-for="shelf in shelves" :key="shelf.id" class="shelf-item">
      <el-card shadow="formed" class="shelf-card">
        <template #header>
          <div class="shelf-header">
            <el-row class="shelf-title-row">
              <strong>{{ shelf.name }}</strong>
            </el-row>
            <el-row class="shelf-actions-row">
              <el-button type="primary" @click="openAddProductToShelf(shelf)">添加商品</el-button>
              <el-button type="warning" @click="openEditShelfModal(shelf)">修改名称</el-button>
              <el-button type="danger" @click="openDeleteShelf(shelf)">删除货架</el-button>
            </el-row>
          </div>
        </template>

        <div v-if="getProductsInShelf(shelf.id).length > 0">
          <div v-for="shelfProduct in getProductsInShelf(shelf.id)" :key="shelfProduct.id" class="product-item">
            <el-row :gutter="20">
              <el-col :span="16">
                <strong>[{{ shelfProduct.categoryName }}] {{ shelfProduct.productName }}</strong>
              </el-col>
              <el-col :span="8">
                <el-button type="warning" size="mini" @click="openAddBatchModal(shelfProduct)">
                  添加批次
                </el-button>
              </el-col>
            </el-row>

            <div class="batch-list">
              <div v-if="getProductBatches(shelfProduct.id).length === 0">
                <el-tag type="info">暂无批次记录</el-tag>
              </div>
              <div v-for="batch in getProductBatches(shelfProduct.id)" :key="batch.id" class="batch-item">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <span>{{ batch.produceDate }}</span>
                    <el-tag :type="getBatchStatus(batch.expireDate).cls" size="mini" class="status-tag">
                      {{ getBatchStatus(batch.expireDate).text }}
                    </el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-input-number
                      v-model="batch.batchnum"
                      :min="0"
                      :max="getBatchMaxQty(batch, shelfProduct)"
                      @change="updateBatchQty(batch.id, batch.batchnum, shelfProduct)"
                      size="mini"
                    ></el-input-number>
                  </el-col>
                  <el-col :span="4">
                    <el-button size="mini" type="danger" @click="openDeleteBatchModal(batch, shelfProduct)">
                      删除
                    </el-button>
                  </el-col>
                </el-row>
              </div>
            </div>

            <el-row class="stock-info">
              <el-col>
                库存总计：当前{{ getProductCurrentQty(shelfProduct) }}件 / 最大{{ shelfProduct.max }}件
              </el-col>
            </el-row>
            
            <el-row class="product-actions">
              <el-button size="mini" type="warning" @click="openEditMaxQtyModal(shelfProduct, shelfProduct.max)">
                修改最大容量
              </el-button>
              <el-button size="mini" type="danger" @click="openDeleteShelfProductModal(shelfProduct)">
                删除商品
              </el-button>
            </el-row>
          </div>
        </div>
        <div v-else class="empty-tip">
          <el-tag type="info">暂无商品，请点击"添加商品"按钮添加</el-tag>
        </div>
      </el-card>
    </div>

    <el-dialog
      title="新增货架"
      :visible.sync="addShelfModalVisible"
      width="380px"
    >
      <el-form :model="addShelfForm" :rules="addShelfRules" ref="addShelfFormRef">
        <el-form-item label="货架名称" prop="name">
          <el-input v-model="addShelfForm.name" placeholder="请输入货架名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addShelfModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNewShelf">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      :title="`修改货架名称（原：${editShelfOldName}）`"
      :visible.sync="editShelfModalVisible"
      width="380px"
    >
      <el-form :model="editShelfForm" :rules="editShelfRules" ref="editShelfFormRef">
        <el-form-item label="新货架名称" prop="newName">
          <el-input v-model="editShelfForm.newName" placeholder="请输入新的货架名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editShelfModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditShelf">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      :title="`为【${shelf.name}】添加商品`"
      :visible.sync="addProductModalVisible"
      width="380px"
    >
      <el-form :model="addProductForm" :rules="addProductRules" ref="addProductFormRef">
        <el-form-item label="选择商品" prop="productId">
          <el-select
            v-model="addProductForm.productId"
            placeholder="请选择商品"
            style="width: 100%"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="`[${getCategoryById(product.categoryId).name}] ${product.name} (保质期：${product.period}${product.unit})`"
              :value="product.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="货架最大容量" prop="max">
          <el-input-number
            v-model="addProductForm.max"
            :min="1"
            :step="1"
            placeholder="请输入最大存放数量"
          ></el-input-number>
          <span class="unit-text">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addProductModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddProductToShelf">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      :title="`为【${shelfProduct.productName}】添加批次`"
      :visible.sync="addBatchModalVisible"
      width="380px"
    >
      <el-form :model="addBatchForm" :rules="addBatchRules" ref="addBatchFormRef">
        <el-form-item label="生产日期" prop="produceDate">
          <el-date-picker
            v-model="addBatchForm.produceDate"
            type="date"
            placeholder="请选择生产日期"
            style="width: 100%"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="数量" prop="batchnum">
          <el-input-number
            v-model="addBatchForm.batchnum"
            :min="1"
            :max="getAddBatchMaxQty(shelfProduct)"
            :step="1"
            placeholder="请输入批次数量"
          ></el-input-number>
          <span class="unit-text">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addBatchModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddBatch">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      :title="`修改【${shelfProduct.productName}】最大容量`"
      :visible.sync="editMaxQtyModalVisible"
      width="380px"
    >
      <el-form :model="editMaxQtyForm" :rules="editMaxQtyRules" ref="editMaxQtyFormRef">
        <el-form-item label="新最大容量" prop="newMax">
          <el-input-number
            v-model="editMaxQtyForm.newMax"
            :min="1"
            :step="1"
            placeholder="请输入新的最大存放数量"
          ></el-input-number>
          <span class="unit-text">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editMaxQtyModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditMaxQty">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <el-dialog :visible.sync="deleteBatchModalVisible" width="380px">
      <strong>确定删除批次【{{ batch.produceDate }}】?</strong>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteBatchModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeleteBatch()">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <el-dialog :visible.sync="deleteShelfModalVisible" width="380px">
      <div class="delete-tip">
        <strong>确定删除货架【{{ shelf.name }}】?</strong>
        <div>该操作将删除：</div>
        <div>1. 该货架内的所有商品</div>
        <div>2. 该货架上商品的所有批次记录</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteShelfModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeleteShelf()">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <el-dialog :visible.sync="deleteShelfProductModalVisible" width="380px">
      <div class="delete-tip">
        <strong>确定删除此商品【{{ shelfProduct.productName }}】?</strong>
        <div>该操作将删除：</div>
        <div>该货架上该商品的所有批次记录</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteShelfProductModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeleteShelfProduct()">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
import { calculateExpireDate, calculateId, validateForm } from "@/utils/helpers";

export default {
  name: "Shelf",
  data() {
    return {
      id: 0,
      shelf: {},
      batch: {},
      shelfProduct: {},
      addShelfModalVisible: false,
      addShelfForm: { name: "" },
      addShelfRules: {
        name: [{ required: true, message: "请输入货架名称", trigger: "blur" }],
      },
      editShelfModalVisible: false,
      editShelfOldName: "",
      editShelfForm: { newName: "" },
      editShelfRules: {
        newName: [{ required: true, message: "请输入新的货架名称", trigger: "blur" }],
      },
      addProductModalVisible: false,
      addProductForm: { productId: "", max: 10 },
      addProductRules: {
        productId: [{ required: true, message: "请选择商品", trigger: "change" }],
        max: [
          { required: true, message: "请输入最大容量", trigger: "blur" },
          { type: "number", min: 1, message: "最大容量必须大于0", trigger: "blur" },
        ],
      },
      addBatchModalVisible: false,
      addBatchForm: { produceDate: "", batchnum: 1 },
      addBatchRules: {
        produceDate: [{ required: true, message: "请选择生产日期", trigger: "change" }],
        batchnum: [
          { required: true, message: "请输入数量", trigger: "blur" },
          { type: "number", min: 1, message: "数量必须大于0", trigger: "blur" },
        ],
      },
      editMaxQtyModalVisible: false,
      editMaxQtyForm: { newMax: 0 },
      editMaxQtyRules: {
        newMax: [
          { required: true, message: "请输入新的最大容量", trigger: "blur" },
          { type: "number", min: 1, message: "最大容量必须大于0", trigger: "blur" },
        ],
      },
      deleteBatchModalVisible: false,
      deleteShelfModalVisible: false,
      deleteShelfProductModalVisible: false,
    };
  },
  computed: {
    ...mapState(["shelves", "products", "shelfProducts", "shelfProductBatches", "expireThreshold"]),
    ...mapGetters([
      "getBatchStatus",
      "getProductBatches",
      "getProductsInShelf",
      "getProductCurrentQty",
      "getAddBatchMaxQty",
      "getBatchMaxQty",
      "getProductMaxQtyInShelf",
      "getCategoryById",
      "getProductById",
      "getShelfProductById",
      "getShelfById",
    ]),
  },
  methods: {
    resetForm(refName, formData) {
      this.$nextTick(() => {
        const formRef = this.$refs[refName];
        if (formRef) {
          formRef.clearValidate();
        }
        Object.keys(formData).forEach((key) => {
          if (key === "name" || key === "newName" || key === "produceDate") {
            formData[key] = "";
          } else if (key === "max" || key === "batchnum") {
            formData[key] = 1;
          } else if (key === "newMax") {
            formData[key] = 0;
          } else if (key === "productId") {
            formData[key] = "";
          }
        });
      });
    },

    checkShelfNameExist(name) {
      return this.shelves.some((s) => s.name === name);
    },

    ...mapMutations(["UPDATE_SHELVES", "UPDATE_SHELF_PRODUCTS", "UPDATE_SHELF_PRODUCT_BATCHES"]),

    openAddShelfModal() {
      this.addShelfModalVisible = true;
      this.resetForm("addShelfFormRef", this.addShelfForm);
    },
    
    saveNewShelf() {
      this.$refs.addShelfFormRef.validate(async (valid) => {
        if (!valid) return;

        const shelfName = this.addShelfForm.name.trim();
        const validateResult = validateForm({ 货架名称: shelfName });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        if (this.checkShelfNameExist(shelfName)) {
          this.$message.error("该货架名称已存在");
          return;
        }
        
        const newShelfId = calculateId(this.shelves);
        const newShelf = { id: newShelfId, name: shelfName };
        const newShelves = [...this.shelves, newShelf];
        this.UPDATE_SHELVES(newShelves);

        this.addShelfModalVisible = false;
        this.$message.success("货架添加成功");
      });
    },

    openEditShelfModal(shelf) {
      this.id = shelf.id;
      this.editShelfOldName = shelf.name;
      this.editShelfModalVisible = true;
      this.resetForm("editShelfFormRef", this.editShelfForm);
    },
    
    saveEditShelf() {
      this.$refs.editShelfFormRef.validate((valid) => {
        if (!valid) return;

        const newName = this.editShelfForm.newName.trim();
        const validateResult = validateForm({ 新货架名称: newName });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        if (newName === this.editShelfOldName) {
          this.$message.info("新名称与原名称一致，无需修改");
          this.editShelfModalVisible = false;
          return;
        }

        if (this.checkShelfNameExist(newName)) {
          this.$message.error("该货架名称已存在");
          return;
        }

        const newShelf = { id: this.id, name: newName };
        const newShelves = this.shelves.map((shelf) => shelf.id === this.id ? newShelf : shelf);
        this.UPDATE_SHELVES(newShelves);

        this.editShelfModalVisible = false;
        this.$message.success("货架名称修改成功");
      });
    },

    openAddProductToShelf(shelf) {
      this.shelf = { ...shelf };
      this.addProductModalVisible = true;
      this.resetForm("addProductFormRef", this.addProductForm);
    },
    
    saveAddProductToShelf() {
      this.$refs.addProductFormRef.validate((valid) => {
        if (!valid) return;

        const { productId, max } = this.addProductForm;
        const shelfId = this.shelf.id;

        const validateResult = validateForm({ 商品: productId, 最大容量: max });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        const isExist = this.shelfProducts.some(sp => sp.shelfId === shelfId && sp.productId === productId);
        if (isExist) {
          this.$message.error("该商品已添加到当前货架");
          return;
        }

        const product = this.getProductById(productId);
        if (!product) {
          this.$message.error("商品不存在");
          return;
        }

        const newShelfProductId = calculateId(this.shelfProducts);
        const newShelfProduct = {
          id: newShelfProductId,
          shelfId: shelfId,
          productId: productId,
          max: max,
        };
        const newShelfProducts = [...this.shelfProducts, newShelfProduct];
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.addProductModalVisible = false;
        this.$message.success(`商品【${product.name}】已添加到货架【${this.shelf.name}】`);
      });
    },

    openAddBatchModal(shelfProduct) {
      this.shelfProduct = { ...shelfProduct };
      this.addBatchModalVisible = true;
      this.resetForm("addBatchFormRef", this.addBatchForm);
      const allBatches = this.getProductBatches(shelfProduct.id) || [];
      const usedQty = allBatches.reduce((total, b) => total + (b.batchnum || 0), 0);
      const maxAvailable = shelfProduct.max - usedQty;
      this.addBatchForm.batchnum = maxAvailable > 0 ? maxAvailable : 1;
    },
    
    saveAddBatch() {
      this.$refs.addBatchFormRef.validate((valid) => {
        if (!valid) return;

        const { produceDate, batchnum } = this.addBatchForm;
        const validateResult = validateForm({ 生产日期: produceDate, 数量: batchnum });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }
        
        const isBatchExist = this.shelfProductBatches.some(b => b.produceDate === produceDate);
        if (isBatchExist) {
          this.$message.error(`该生产日期(${produceDate})的批次已存在`);
          return;
        }
        
        const period = this.shelfProduct.period;
        const unit = this.shelfProduct.unit;
        const expireDate = calculateExpireDate(produceDate, period, unit);
        
        if (!expireDate) {
          this.$message.error("过期日期计算失败，请检查商品保质期配置");
          return;
        }
        
        const shelfProductId = this.shelfProduct.id;
        const newSPBId = calculateId(this.shelfProductBatches);
        const newShelfProductBatch = {
          id: newSPBId,
          shelfProductId: shelfProductId,
          produceDate: produceDate,
          expireDate: expireDate,
          batchnum: batchnum,
        };
        
        const newShelfProductBatches = [...this.shelfProductBatches, newShelfProductBatch];
        this.UPDATE_SHELF_PRODUCT_BATCHES(newShelfProductBatches);
        
        this.addBatchModalVisible = false;
        this.$message.success(`商品【${this.shelfProduct.productName}】批次【${produceDate}】添加成功`);
      });
    },

    openEditMaxQtyModal(shelfProduct, currentMax) {
      this.shelfProduct = { ...shelfProduct };
      this.editMaxQtyModalVisible = true;
      this.resetForm("editMaxQtyFormRef", this.editMaxQtyForm);
      this.$nextTick(() => {
        this.editMaxQtyForm.newMax = currentMax;
      });
    },
    
    saveEditMaxQty() {
      this.$refs.editMaxQtyFormRef.validate((valid) => {
        if (!valid) return;

        const { newMax } = this.editMaxQtyForm;
        const validateResult = validateForm({ 新最大容量: newMax });
        
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        const currentQty = this.getProductCurrentQty(this.shelfProduct);
        if (newMax < currentQty) {
          this.$message.warning(`新最大容量不能小于当前库存(${currentQty}件)`);
          return;
        }

        const newShelfProducts = this.shelfProducts.map(sp => 
          sp.id === this.shelfProduct.id ? { ...sp, max: newMax } : sp
        );
        
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.editMaxQtyModalVisible = false;
        this.$message.success(`最大容量修改为${newMax}件`);
      });
    },

    updateBatchQty(batchId, batchnum, shelfProduct) {
      if (!batchId || batchnum < 0) {
        this.$message.error("参数错误，无法更新数量");
        return;
      }
      
      const newBatches = this.shelfProductBatches.map(b => 
        b.id === batchId ? { ...b, batchnum } : b
      );
      
      this.UPDATE_SHELF_PRODUCT_BATCHES(newBatches);
    },
    
    openDeleteShelf(shelf) {
      this.shelf = { ...shelf };
      this.deleteShelfModalVisible = true;
    },
    
    confirmDeleteShelf() {
      const shelfId = this.shelf.id;
      const newShelves = this.shelves.filter(s => s.id !== shelfId);
      const newShelfProducts = this.shelfProducts.filter(sp => sp.shelfId !== shelfId);
      const newShelfProductBatches = this.shelfProductBatches.filter(
        b => this.getShelfProductById(b.shelfProductId).shelfId !== shelfId
      );

      this.UPDATE_SHELVES(newShelves);
      this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
      this.UPDATE_SHELF_PRODUCT_BATCHES(newShelfProductBatches);
      
      this.$message.success(`【${this.shelf.name}】删除成功`);
      this.deleteShelfModalVisible = false;
    },
    
    openDeleteBatchModal(batch, shelfProduct) {
      this.batch = { ...batch };
      this.shelfProduct = { ...shelfProduct };
      this.deleteBatchModalVisible = true;
    },
    
    confirmDeleteBatch() {
      const batchId = this.batch.id;
      const newShelfProductBatches = this.shelfProductBatches.filter(spb => spb.id !== batchId);
      
      this.deleteBatchModalVisible = false;
      this.$message.success(
        `商品【${this.shelfProduct.productName}】的【${this.batch.produceDate}】批次已删除`
      );
      
      this.UPDATE_SHELF_PRODUCT_BATCHES(newShelfProductBatches);
    },
    
    openDeleteShelfProductModal(shelfProduct) {
      this.shelfProduct = { ...shelfProduct };
      this.deleteShelfProductModalVisible = true;
    },
    
    confirmDeleteShelfProduct() {
      const shelfProductId = this.shelfProduct.id;
      const newShelfProducts = this.shelfProducts.filter(sp => sp.id !== shelfProductId);
      const newShelfProductBatches = this.shelfProductBatches.filter(spb => spb.shelfProductId !== shelfProductId);
      
      this.deleteShelfProductModalVisible = false;
      this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
      this.UPDATE_SHELF_PRODUCT_BATCHES(newShelfProductBatches);
      
      this.$message.success(
        `商品【${this.shelfProduct.productName}】已成功从【${this.shelfProduct.shelfName}】删除`
      );
    },
  },
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: center;
}

.operation-bar {
  display: flex;
  justify-content: flex-end;
  margin: 15px 0;
}

.shelf-item {
  margin-bottom: 15px;
}

.shelf-card {
  border: 1px solid #000;
}

.shelf-header {
  width: 100%;
}

.shelf-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  margin: 0 0 10px 0;
}

.shelf-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-item {
  margin-bottom: 15px;
}

.batch-list {
  margin-top: 8px;
}

.batch-item {
  margin: 5px 0;
  padding: 5px;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-tag {
  margin-left: 8px;
}

.stock-info {
  margin-top: 8px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-tip {
  text-align: center;
  padding: 10px;
}

.unit-text {
  font-size: 12px;
  margin-left: 5px;
}

.delete-tip {
  margin: 10px 30px;
  font-size: 17px;
  text-align: left;
}

.dialog-footer {
  text-align: right;
}
</style>