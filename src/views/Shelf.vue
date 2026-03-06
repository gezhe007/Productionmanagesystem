<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: center">
      <h2>货架清点</h2>
    </div>

    <!-- 顶部操作栏 -->
    <el-row type="flex" justify="end" style="margin: 15px 0">
      <el-button type="success" @click="openAddShelfModal">新增货架</el-button>
    </el-row>

    <!-- 货架列表 -->
    <div v-for="shelf in shelves" :key="shelf.id" class="shelf-item">
      <el-card shadow="formed" style="border: 1px solid #000">
        <template #header>
          <div>
            <el-row
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 20px;
                margin: 0 0 10px 0;
              "
            >
              <strong>{{ shelf.name }}</strong>
            </el-row>
            <el-row
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <el-button type="primary" @click="openAddProductToShelf(shelf)"
                >添加商品</el-button
              >
              <el-button type="warning" @click="openEditShelfModal(shelf)"
                >修改名称</el-button
              >
              <el-button type="danger" @click="deleteShelf(shelf)"
                >删除货架</el-button
              >
            </el-row>
          </div>
        </template>

        <!-- 货架商品列表 -->
        <div v-if="getProductsInShelf(shelf.id).length > 0">
          <div
            v-for="shelfProduct in getProductsInShelf(shelf.id)"
            :key="shelfProduct.id"
          >
            <el-row :gutter="20">
              <el-col :span="16">
                <strong
                  >[{{ getCategoryById(shelfProduct.categoryId).name }}]
                  {{ shelfProduct.name }}</strong
                >
              </el-col>
              <el-col :span="8">
                <el-button
                  type="warning"
                  size="mini"
                  @click="openAddBatchModal(shelf, shelfProduct.productId, shelfProduct.name)"
                >
                  添加批次
                </el-button>
              </el-col>
            </el-row>

            <!-- 商品批次列表 -->
            <div style="margin-top: 8px">
              <div v-if="getProductBatches(shelf.id, shelfProduct.productId).length === 0">
                <el-tag type="info">暂无批次记录</el-tag>
              </div>
              <div
                v-for="batch in getProductBatches(shelf.id, shelfProduct.productId)"
                :key="batch.id"
                style="
                  margin: 5px 0;
                  padding: 5px;
                  background: #f5f5f5;
                  border-radius: 4px;
                "
              >
                <el-row :gutter="10">
                  <el-col :span="12">
                    <!-- 批次基础信息 -->
                    <span style="font-weight: 400">{{
                      batch.produceDate
                    }}</span>
                    <el-tag
                      :type="batchStatus.cls"
                      size="mini"
                      style="margin-left: 8px"
                      v-if="(batchStatus = getBatchStatus(batch.expireDate))"
                    >
                      {{ batchStatus.text }}
                    </el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-input-number
                      v-model="batch.batchnum"
                      :min="0"
                      @change="updateBatchQty(batch.id, batch.batchnum)"
                      size="mini"
                    ></el-input-number>
                  </el-col>
                  <el-col :span="4">
                    <el-button
                      size="mini"
                      type="danger"
                      @click="openDeleteBatchModal(shelfProductBatch)"
                    >
                      删除
                    </el-button>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 库存信息 -->
            <el-row
              style="
                margin-top: 8px;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
              "
            >
              <el-col>
                库存总计：当前{{ getProductCurrentQty(shelf.id, shelfProduct.productId) }}件
                / 最大{{ getProductMaxQtyInShelf(shelf.id, shelfProduct.productId) }}件
              </el-col>
            </el-row>
            <el-row type="flex" justify="end">
              <el-button
                size="mini"
                type="warning"
                @click="
                  openEditMaxQtyModal(
                    shelf,
                    product,
                    getProductMaxQtyInShelf(shelf.id, shelfProduct.productId)
                  )
                "
              >
                修改最大容量
              </el-button>
              <el-button
                size="mini"
                type="danger"
                @click="deleteProductFromShelf(shelf, shelfProduct)"
              >
                删除商品
              </el-button>
            </el-row>
          </div>
        </div>
        <div v-else style="text-align: center; padding: 10px">
          <el-tag type="info">暂无商品，请点击"添加商品"按钮添加</el-tag>
        </div>
      </el-card>
    </div>

    <!-- 1. 新增货架弹窗 -->
    <el-dialog
      title="新增货架"
      :visible.sync="addShelfModalVisible"
      width="380px"
    >
      <el-form
        :model="addShelfForm"
        :rules="addShelfRules"
        ref="addShelfFormRef"
      >
        <el-form-item label="货架名称" prop="name">
          <el-input
            v-model="addShelfForm.name"
            placeholder="请输入货架名称"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addShelfModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNewShelf">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 2. 修改货架名称弹窗 -->
    <el-dialog
      :title="`修改货架名称（原：${editShelfOldName}）`"
      :visible.sync="editShelfModalVisible"
      width="380px"
    >
      <el-form
        :model="editShelfForm"
        :rules="editShelfRules"
        ref="editShelfFormRef"
      >
        <el-form-item label="新货架名称" prop="newName">
          <el-input
            v-model="editShelfForm.newName"
            placeholder="请输入新的货架名称"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editShelfModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditShelf">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 3. 添加商品到货架弹窗 -->
    <el-dialog
      :title="`为【${addProductToShelfName}】添加商品`"
      :visible.sync="addProductModalVisible"
      width="380px"
    >
      <el-form
        :model="addProductForm"
        :rules="addProductRules"
        ref="addProductFormRef"
      >
        <el-form-item label="选择商品" prop="productId">
          <el-select
            v-model="addProductForm.productId"
            placeholder="请选择商品"
            style="width: 100%"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="`[${product.category}] ${product.name} (保质期：${product.shelfLife}${product.shelfLifeUnit})`"
              :value="product.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="货架最大容量" prop="shelfMax">
          <el-input-number
            v-model="addProductForm.shelfMax"
            :min="1"
            :step="1"
            placeholder="请输入最大存放数量"
          ></el-input-number>
          <span style="font-size: 12px; margin-left: 5px">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addProductModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddProductToShelf"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 4. 添加批次弹窗 -->
    <el-dialog
      :title="`为【${addBatchProductName}】添加批次`"
      :visible.sync="addBatchModalVisible"
      width="380px"
    >
      <el-form
        :model="addBatchForm"
        :rules="addBatchRules"
        ref="addBatchFormRef"
      >
        <el-form-item label="生产日期" prop="produceDate">
          <el-date-picker
            v-model="addBatchForm.produceDate"
            type="date"
            placeholder="请选择生产日期"
            style="width: 100%"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="数量" prop="qty">
          <el-input-number
            v-model="addBatchForm.qty"
            :min="1"
            :step="1"
            placeholder="请输入批次数量"
          ></el-input-number>
          <span style="font-size: 12px; margin-left: 5px">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addBatchModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddBatch">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 5. 修改最大容量弹窗 -->
    <el-dialog
      :title="`修改【${editMaxQtyProductName}】最大容量`"
      :visible.sync="editMaxQtyModalVisible"
      width="380px"
    >
      <el-form
        :model="editMaxQtyForm"
        :rules="editMaxQtyRules"
        ref="editMaxQtyFormRef"
      >
        <el-form-item label="新最大容量" prop="newMax">
          <el-input-number
            v-model="editMaxQtyForm.newMax"
            :min="1"
            :step="1"
            placeholder="请输入新的最大存放数量"
          ></el-input-number>
          <span style="font-size: 12px; margin-left: 5px">件</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editMaxQtyModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditMaxQty">保存</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 6. 删除批次弹窗 -->
    <el-dialog :visible.sync="deleteBatchModalVisible" width="380px">
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteBatchModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmdelete(shelfProductBatch)"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
import {
  calculateExpireDate,
  calculateId,
  calculateAfterReplenishQty,
  validateForm,
} from "@/utils/helpers";

export default {
  name: "Shelf",
  data() {
    return {
      // 1. 新增货架弹窗
      addShelfModalVisible: false,
      addShelfForm: { name: "" },
      addShelfRules: {
        name: [{ required: true, message: "请输入货架名称", trigger: "blur" }],
      },

      // 2. 修改货架名称弹窗
      editShelfModalVisible: false,
      editShelfOldName: "",
      editShelfForm: { newName: "" },
      editShelfRules: {
        newName: [
          { required: true, message: "请输入新的货架名称", trigger: "blur" },
        ],
      },

      // 3. 添加商品到货架弹窗
      addProductModalVisible: false,
      addProductToShelfName: "",
      addProductForm: { productId: "", shelfMax: 10 },
      addProductRules: {
        productId: [
          { required: true, message: "请选择商品", trigger: "change" },
        ],
        shelfMax: [
          { required: true, message: "请输入最大容量", trigger: "blur" },
          {
            type: "number",
            min: 1,
            message: "最大容量必须大于0",
            trigger: "blur",
          },
        ],
      },

      // 4. 添加批次弹窗
      addBatchModalVisible: false,
      addBatchShelfName: "",
      addBatchProductId: "",
      addBatchProductName: "",
      addBatchForm: { produceDate: "", qty: 1 },
      addBatchRules: {
        produceDate: [
          { required: true, message: "请选择生产日期", trigger: "change" },
        ],
        qty: [
          { required: true, message: "请输入数量", trigger: "blur" },
          { type: "number", min: 1, message: "数量必须大于0", trigger: "blur" },
        ],
      },
      // 5. 修改最大容量弹窗
      editMaxQtyModalVisible: false,
      editMaxQtyForm: { newMax: 0 },
      editMaxQtyRules: {
        newMax: [
          { required: true, message: "请输入新的最大容量", trigger: "blur" },
          {
            type: "number",
            min: 1,
            message: "最大容量必须大于0",
            trigger: "blur",
          },
        ],
      },
      deleteBatchModalVisible: false,
    };
  },
  computed: {
    // 从Vuex映射全局状态
    ...mapState([
      "shelves",
      "products",
      "shelfProducts",
      "shelfProductBatches",
      "expireThreshold",
    ]),
    // 从Vuex映射计算属性
    ...mapGetters([
      "getBatchStatus",
      "getProductBatches",
      "getProductsInShelf",
      "getProductCurrentQty",
      "getProductMaxQtyInShelf",
      "getCategoryById",
      "getProductById",
    ]),
  },
  methods: {
    // ========== 通用工具方法 ==========
    // 重置表单
    resetForm(refName, formData) {
      this.$nextTick(() => {
        const formRef = this.$refs[refName];
        if (formRef) {
          formRef.clearValidate();
        }
        // 重置表单数据
        Object.keys(formData).forEach((key) => {
          formData[key] =
            key === "shelfMax" || key === "qty"
              ? 10
              : key === "newMax"
              ? 0
              : "";
        });
      });
    },

    // 校验货架名称是否重复
    checkShelfNameExist(name) {
      return this.shelves.some((s) => s.name === name);
    },

    // ========== 映射Vuex方法 ==========
    ...mapMutations([
      "UPDATE_SHELVES",
      "UPDATE_SHELF_PRODUCTS",
      "UPDATE_SHELF_PRODUCT_BATCHES",
    ]),

    // ========== 1. 新增货架 ==========
    openAddShelfModal() {
      
      this.addShelfModalVisible = true;
      this.resetForm("addShelfFormRef", this.addShelfForm);
    },
    saveNewShelf() {
      this.$refs.addShelfFormRef.validate(async (valid) => {
        if (!valid) return;

        const shelfName = this.addShelfForm.name.trim();
        // 入参校验
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
        const newShelf = {
          id: newShelfId,
          name: shelfName,
        };
        const newShelves = [...this.shelves, newShelf];
        this.UPDATE_SHELVES(newShelves);

        this.addShelfModalVisible = false;
        this.$message.success("货架添加成功");
      });
    },

    // ========== 2. 修改货架名称 ==========
    openEditShelfModal(shelf) {
      this.editShelfOldName=shelf.name;
      this.editShelfModalVisible = true;
      this.resetForm("editShelfFormRef", this.editShelfForm);
    },
    saveEditShelf() {
      this.$refs.editShelfFormRef.validate((valid) => {
        if (!valid) return;

        const newName = this.editShelfForm.newName.trim();
        // 入参校验
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

        // 1. 更新货架列表
        const newShelves = [...this.shelves];
        newShelves[this.editShelfIndex] = newName;
        this.UPDATE_SHELVES(newShelves);

        // 2. 更新货架-商品关联
        const newShelfProducts = this.shelfProducts.map((sp) =>
          sp.shelf === this.editShelfOldName ? { ...sp, shelf: newName } : sp
        );
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        // 3. 更新批次关联
        const newShelfProductBatches = this.shelfProductBatches.map((b) =>
          b.shelf === this.editShelfOldName ? { ...b, shelf: newName } : b
        );
        this.UPDATE_SHELF_BATCHES(newShelfProductBatches);

        this.editShelfModalVisible = false;
        this.$message.success("货架名称修改成功");
      });
    },

    // ========== 3. 添加商品到货架 ==========
    openAddProductToShelf(shelf) {
      this.addProductToShelfName = shelf;
      this.addProductModalVisible = true;
      this.resetForm("addProductFormRef", this.addProductForm);
    },
    saveAddProductToShelf() {
      this.$refs.addProductFormRef.validate((valid) => {
        if (!valid) return;

        const { productId, shelfMax } = this.addProductForm;
        const shelf = this.addProductToShelfName;

        // 入参校验
        const validateResult = validateForm({
          商品: productId,
          最大容量: shelfMax,
        });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        // 检查商品是否已添加
        const isExist = this.shelfProducts.some(
          (sp) => sp.shelf === shelf && sp.productId === productId
        );
        if (isExist) {
          this.$message.error("该商品已添加到当前货架");
          return;
        }

        // 获取商品详情
        const product = this.products.find((p) => p.id === productId);
        if (!product) {
          this.$message.error("商品不存在");
          return;
        }

        // 添加关联记录
        const newShelfProducts = [
          ...this.shelfProducts,
          {
            shelf,
            productId,
            shelfMax,
            name: product.name,
            category: product.category,
            shelfLife: product.shelfLife,
            shelfLifeUnit: product.shelfLifeUnit,
          },
        ];
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.addProductModalVisible = false;
        this.$message.success(
          `商品【${product.name}】已添加到货架【${shelf}】`
        );
      });
    },

    openAddBatchModal(shelf, productId, productName) {
      this.addBatchShelfName = shelf;
      this.addBatchProductId = productId;
      this.addBatchProductName = productName;
      this.addBatchModalVisible = true;
      this.resetForm("addBatchFormRef", this.addBatchForm);
    },
    // ========== 4. 添加批次 ==========
    saveAddBatch() {
      this.$refs.addBatchFormRef.validate((valid) => {
        if (!valid) return;

        const { produceDate, qty } = this.addBatchForm;
        const shelf = this.addBatchShelfName;
        const productId = this.addBatchProductId;

        // 入参校验
        const validateResult = validateForm({
          生产日期: produceDate,
          数量: qty,
        });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        // 调试日志（可选，便于定位问题）
        console.log("当前批次参数：", { shelf, productId, produceDate });
        console.log("全局商品列表：", this.products);

        // 检查批次是否已存在
        const isBatchExist = this.shelfProductBatches.some(
          (b) =>
            b.shelf === shelf &&
            b.productId === productId &&
            b.batch === produceDate
        );
        if (isBatchExist) {
          this.$message.error(`该生产日期(${produceDate})的批次已存在`);
          return;
        }

        // 修复点1：优先从货架商品关联表中获取商品信息（兜底方案）
        let product = this.products.find((p) => p.id === productId);
        // 如果全局商品列表找不到，从货架商品关联表中找
        if (!product) {
          const shelfProduct = this.shelfProducts.find(
            (sp) => sp.shelf === shelf && sp.productId === productId
          );
          if (shelfProduct) {
            // 用货架商品信息构建临时商品对象（保证保质期字段可用）
            product = {
              id: shelfProduct.productId,
              name: shelfProduct.name,
              category: shelfProduct.category,
              shelfLife: shelfProduct.shelfLife,
              shelfLifeUnit: shelfProduct.shelfLifeUnit,
              period: shelfProduct.period,
              unit: shelfProduct.unit,
            };
          }
        }

        // 修复点2：更精准的错误提示
        if (!product) {
          this.$message.error(
            `未找到ID为【${productId}】的商品，请检查商品是否已删除`
          );
          return;
        }

        // 兼容 period/unit 和 shelfLife/shelfLifeUnit 两种字段命名
        const shelfLife = product.shelfLife || product.period;
        const shelfLifeUnit = product.shelfLifeUnit || product.unit;

        if (!shelfLife || !shelfLifeUnit) {
          this.$message.error("该商品未配置保质期信息，无法添加批次");
          return;
        }

        // 自动计算过期日期
        const expireDate = calculateExpireDate(
          produceDate,
          shelfLife,
          shelfLifeUnit
        );
        if (!expireDate) {
          this.$message.error("过期日期计算失败，请检查商品保质期配置");
          return;
        }

        // 添加批次记录
        const newShelfProductBatches = [
          ...this.shelfProductBatches,
          {
            shelf,
            productId,
            batch: produceDate,
            produceDate: produceDate,
            expireDate: expireDate,
            qty,
            // 补充商品名称，便于后续展示
            productName: product.name,
          },
        ];
        this.UPDATE_SHELF_BATCHES(newshelfProductBatches);

        this.addBatchModalVisible = false;
        this.$message.success(`生产日期【${produceDate}】的批次添加成功`);
      });
    },

    // ========== 5. 修改最大容量 ==========
    openEditMaxQtyModal(shelf, product, currentMax) {
      this.editMaxQtyShelfName = shelf.name;
      this.editMaxQtyProductId = product.id;
      this.editMaxQtyProductName = product.name;
      this.editMaxQtyForm.newMax = currentMax;
      this.editMaxQtyModalVisible = true;
      this.resetForm("editMaxQtyFormRef", this.editMaxQtyForm);
    },
    saveEditMaxQty() {
      this.$refs.editMaxQtyFormRef.validate((valid) => {
        if (!valid) return;

        const { newMax } = this.editMaxQtyForm;
        const shelf = this.editMaxQtyShelfName;
        const productId = this.editMaxQtyProductId;

        // 入参校验
        const validateResult = validateForm({ 新最大容量: newMax });
        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        // 更新最大容量
        const newShelfProducts = this.shelfProducts.map((sp) =>
          sp.shelf === shelf && sp.productId === productId
            ? { ...sp, shelfMax: newMax }
            : sp
        );
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.editMaxQtyModalVisible = false;
        this.$message.success(`最大容量修改为${newMax}件`);
      });
    },

    // ========== 通用操作 ==========
    // 更新批次数量
    updateBatchQty(batchId, batchnum) {
      // 入参校验
      if (!batchId || batchnum < 0) {
        this.$message.error("参数错误，无法更新数量");
        return;
      }

      const newBatches = this.shelfProductBatches.map((b) =>
        b.id === batchId ? { ...b, batchnum } : b
      );
      this.UPDATE_SHELF_PRODUCT_BATCHES(newBatches);
    },

    // 删除批次
    deleteBatch(batch) {
      // 入参校验
      if (batch) {
        this.$message.error("参数错误，无法删除批次");
        return;
      }

      this.$confirm(
        `确定删除生产日期【${batch.produceDate}】的批次？`,
        "提示",
        {
          type: "warning",
        }
      ).then(() => {
        const newBatches = this.shelfProductBatches.filter(
          (b) =>
            !(
              b.shelf === shelf &&
              b.productId === productId &&
              b.batch === batch
            )
        );
        this.UPDATE_SHELF_BATCHES(newBatches);
        this.$message.success("批次已删除");
      });
    },

    // 删除货架
    deleteShelf(index, shelfName) {
      // 入参校验
      if (index < 0 || !shelfName) {
        this.$message.error("参数错误，无法删除货架");
        return;
      }

      // 统计关联数据
      const shelfProductCount = this.shelfProducts.filter(
        (sp) => sp.shelf === shelfName
      ).length;
      const shelfBatchCount = this.shelfProductBatches.filter(
        (b) => b.shelf === shelfName
      ).length;

      const confirmText = `确定删除货架【${shelfName}】？
该操作将删除：
1. 该货架下${shelfProductCount}个商品关联记录
2. ${shelfBatchCount}个货架批次记录
数据删除后无法恢复！`;

      this.$confirm(confirmText, "提示", { type: "warning" }).then(() => {
        // 删除货架及关联数据
        const newShelves = this.shelves.filter((_, i) => i !== index);
        const newShelfProducts = this.shelfProducts.filter(
          (sp) => sp.shelf !== shelfName
        );
        const newshelfProductBatches = this.shelfProductBatches.filter(
          (b) => b.shelf !== shelfName
        );

        this.UPDATE_SHELVES(newShelves);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.UPDATE_SHELF_BATCHES(newshelfProductBatches);

        this.$message.success("货架删除成功");
      });
    },
    openDeleteBatchModal(shelfProductBatch) {
      deleteBatchModalVisible = true;
    },
    // 删除货架商品
    //     deleteProductFromShelf(shelf, productId, productName) {
    //       // 入参校验
    //       if (!shelf || !productId || !productName) {
    //         this.$message.error("参数错误，无法删除商品");
    //         return;
    //       }

    //       const batchCount = this.getProductBatches(shelf, productId).length;
    //       const confirmText = `确定从【${shelf}】删除商品【${productName}】？
    // 该操作将删除：
    // 1. 该商品在货架的关联记录
    // 2. ${batchCount}个商品批次记录
    // 数据删除后无法恢复！`;

    //       this.$confirm(confirmText, "提示", { type: "warning" }).then(() => {
    //         // 删除关联数据
    //         const newShelfProducts = this.shelfProducts.filter(
    //           (sp) => !(sp.shelf === shelf && sp.productId === productId)
    //         );
    //         const newshelfProductBatches = this.shelfProductBatches.filter(
    //           (b) => !(b.shelf === shelf && b.productId === productId)
    //         );

    //         this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
    //         this.UPDATE_SHELF_BATCHES(newshelfProductBatches);

    //         this.$message.success(`商品【${productName}】已从货架【${shelf}】删除`);
    //       });
    // },
  },
};
</script>

<style scoped>
.shelf-item {
  margin-bottom: 15px;
}
.dialog-footer {
  text-align: right;
}
</style>