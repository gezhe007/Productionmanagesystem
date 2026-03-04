<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: center">
      <h2>货架清点</h2>
    </div>

    <!-- 顶部操作栏（已删除补货按钮） -->
    <el-row :gutter="10" style="margin: 15px 0">
      <el-col :span="12">
        <el-button type="success" @click="openAddShelfModal"
          >新增货架</el-button
        >
      </el-col>
      <el-col :span="12" style="text-align: right">
        <!-- 已移除补货按钮 -->
      </el-col>
    </el-row>

    <!-- 货架列表 -->
    <div v-for="(shelf, index) in shelves" :key="index" class="shelf-item">
      <el-card shadow="formed">
        <template #header>
          <div class="card-header">
            <span
              ><strong>{{ shelf }}</strong></span
            >
            <el-button-group size="mini">
              <el-button type="primary" @click="openAddProductToShelf(shelf)"
                >添加商品</el-button
              >
              <el-button
                type="warning"
                @click="openEditShelfModal(index, shelf)"
                >修改名称</el-button
              >
              <el-button type="danger" @click="deleteShelf(index, shelf)"
                >删除</el-button
              >
            </el-button-group>
          </div>
        </template>

        <!-- 货架商品列表 -->
        <div v-if="getProductsInShelf(shelf).length > 0">
          <div
            v-for="product in getProductsInShelf(shelf)"
            :key="product.id"
            style="
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #eee;
            "
          >
            <el-row :gutter="10">
              <el-col :span="18">
                <strong>[{{ product.category }}] {{ product.name }}</strong>
              </el-col>
              <el-col :span="6" style="text-align: right">
                <el-button
                  size="mini"
                  type="warning"
                  @click="openAddBatchModal(shelf, product.id, product.name)"
                >
                  添加批次
                </el-button>
              </el-col>
            </el-row>

            <!-- 商品批次列表 -->
            <div style="margin-top: 8px">
              <span style="font-size: 14px; font-weight: bold">现有批次：</span>
              <div v-if="getProductBatches(shelf, product.id).length === 0">
                <el-tag type="info" size="mini">暂无批次记录</el-tag>
              </div>
              <div
                v-for="batch in getProductBatches(shelf, product.id)"
                :key="batch.batch"
                style="
                  margin: 5px 0;
                  padding: 5px;
                  background: #f5f5f5;
                  border-radius: 4px;
                "
              >
                <el-row :gutter="10">
                  <el-col :span="12">
                    {{ batch.batch }}
                    <el-tag
                      :type="getBatchStatusFn(batch.expire).cls"
                      size="mini"
                    >
                      {{ getBatchStatusFn(batch.expire).text }}
                    </el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-input-number
                      v-model="batch.qty"
                      :min="0"
                      @change="
                        updateBatchQty(
                          shelf,
                          product.id,
                          batch.batch,
                          batch.qty
                        )
                      "
                      size="mini"
                      style="width: 100px"
                    ></el-input-number>
                    <span style="font-size: 12px">件</span>
                  </el-col>
                  <el-col :span="4">
                    <el-button
                      size="mini"
                      type="danger"
                      @click="deleteBatch(shelf, product.id, batch.batch)"
                    >
                      删除
                    </el-button>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 库存信息（已移除补货相关文案） -->
            <el-row
              style="
                margin-top: 8px;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <el-col :span="16">
                库存：当前{{ getProductTotalQty(shelf, product.id) }}件 / 最大{{
                  product.shelfMax
                }}件
              </el-col>
              <el-col :span="8" style="text-align: right">
                <el-button
                  size="mini"
                  type="warning"
                  @click="
                    openEditMaxQtyModal(
                      shelf,
                      product.id,
                      product.name,
                      product.shelfMax
                    )
                  "
                >
                  修改最大容量
                </el-button>
                <el-button
                  size="mini"
                  type="danger"
                  @click="
                    deleteProductFromShelf(shelf, product.id, product.name)
                  "
                >
                  删除商品
                </el-button>
              </el-col>
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
      width="400px"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="addShelfModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNewShelf">保存</el-button>
      </div>
    </el-dialog>

    <!-- 2. 修改货架名称弹窗 -->
    <el-dialog
      :title="`修改货架名称（原：${editShelfOldName}）`"
      :visible.sync="editShelfModalVisible"
      width="400px"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="editShelfModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditShelf">保存</el-button>
      </div>
    </el-dialog>

    <!-- 3. 添加商品到货架弹窗 -->
    <el-dialog
      :title="`为【${addProductToShelfName}】添加商品`"
      :visible.sync="addProductModalVisible"
      width="500px"
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
              :label="`[${product.category}] ${product.name}`"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="addProductModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddProductToShelf"
          >保存</el-button
        >
      </div>
    </el-dialog>

    <!-- 4. 添加批次弹窗 -->
    <el-dialog
      :title="`为【${addBatchProductName}】添加批次`"
      :visible.sync="addBatchModalVisible"
      width="500px"
    >
      <el-form
        :model="addBatchForm"
        :rules="addBatchRules"
        ref="addBatchFormRef"
      >
        <el-form-item label="批次编号" prop="batch">
          <el-input
            v-model="addBatchForm.batch"
            placeholder="如：20260304-001"
          ></el-input>
        </el-form-item>
        <el-form-item label="过期日期" prop="expire">
          <el-date-picker
            v-model="addBatchForm.expire"
            type="date"
            placeholder="请选择过期日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="addBatchModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddBatch">保存</el-button>
      </div>
    </el-dialog>

    <!-- 5. 修改最大容量弹窗 -->
    <el-dialog
      :title="`修改【${editMaxQtyProductName}】最大容量`"
      :visible.sync="editMaxQtyModalVisible"
      width="400px"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="editMaxQtyModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditMaxQty">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
// 导入工具函数（建议将工具函数统一放在@/utils/helpers.js）
import { getBatchStatus } from "@/utils/helpers";

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
      editShelfIndex: -1,
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
        ],
      },

      // 4. 添加批次弹窗
      addBatchModalVisible: false,
      addBatchShelfName: "",
      addBatchProductId: "",
      addBatchProductName: "",
      addBatchForm: { batch: "", expire: "", qty: 1 },
      addBatchRules: {
        batch: [{ required: true, message: "请输入批次编号", trigger: "blur" }],
        expire: [
          { required: true, message: "请选择过期日期", trigger: "change" },
        ],
        qty: [{ required: true, message: "请输入数量", trigger: "blur" }],
      },

      // 5. 修改最大容量弹窗
      editMaxQtyModalVisible: false,
      editMaxQtyShelfName: "",
      editMaxQtyProductId: "",
      editMaxQtyProductName: "",
      editMaxQtyForm: { newMax: 0 },
      editMaxQtyRules: {
        newMax: [
          { required: true, message: "请输入新的最大容量", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    // 从Vuex映射全局状态
    ...mapState([
      "shelves",
      "products",
      "shelfProducts",
      "shelfBatches",
      "expireThreshold",
    ]),
    // 从Vuex映射计算属性
    ...mapGetters(["getProductsInShelf"]),
  },
  methods: {
    // 映射Vuex的mutation方法
    ...mapMutations([
      "UPDATE_SHELVES",
      "UPDATE_SHELF_PRODUCTS",
      "UPDATE_SHELF_BATCHES",
    ]),

    // 封装批次状态判断（基于工具函数）
    getBatchStatusFn(expireDateStr) {
      return getBatchStatus(expireDateStr, this.expireThreshold);
    },

    // 获取商品批次（按过期日期排序）
    getProductBatches(shelf, productId) {
      return this.shelfBatches
        .filter((b) => b.shelf === shelf && b.productId === productId)
        .sort((a, b) => new Date(a.expire) - new Date(b.expire));
    },

    // 计算商品总库存数量
    getProductTotalQty(shelf, productId) {
      return this.getProductBatches(shelf, productId).reduce(
        (sum, b) => sum + b.qty,
        0
      );
    },

    // ========== 1. 新增货架 ==========
    openAddShelfModal() {
      this.addShelfForm.name = "";
      this.addShelfModalVisible = true;
      this.$nextTick(() => {
        this.$refs.addShelfFormRef?.clearValidate();
      });
    },
    saveNewShelf() {
      this.$refs.addShelfFormRef.validate((valid) => {
        if (!valid) return;

        const shelfName = this.addShelfForm.name.trim();
        if (!shelfName) {
          this.$message.error("货架名称不能为空");
          return;
        }
        if (this.shelves.includes(shelfName)) {
          this.$message.error("该货架名称已存在");
          return;
        }

        // 更新Vuex状态（自动同步到本地存储）
        const newShelves = [...this.shelves, shelfName];
        this.UPDATE_SHELVES(newShelves);

        this.addShelfModalVisible = false;
        this.$message.success("货架添加成功");
      });
    },

    // ========== 2. 修改货架名称 ==========
    openEditShelfModal(index, shelfName) {
      this.editShelfIndex = index;
      this.editShelfOldName = shelfName;
      this.editShelfForm.newName = shelfName;
      this.editShelfModalVisible = true;
      this.$nextTick(() => {
        this.$refs.editShelfFormRef?.clearValidate();
      });
    },
    saveEditShelf() {
      this.$refs.editShelfFormRef.validate((valid) => {
        if (!valid) return;

        const newName = this.editShelfForm.newName.trim();
        if (!newName) {
          this.$message.error("货架名称不能为空");
          return;
        }
        if (newName === this.editShelfOldName) {
          this.$message.info("新名称与原名称一致，无需修改");
          this.editShelfModalVisible = false;
          return;
        }
        if (this.shelves.includes(newName)) {
          this.$message.error("该货架名称已存在");
          return;
        }

        // 1. 更新货架列表
        const newShelves = [...this.shelves];
        newShelves[this.editShelfIndex] = newName;
        this.UPDATE_SHELVES(newShelves);

        // 2. 更新货架-商品关联的货架名称
        const newShelfProducts = this.shelfProducts.map((sp) => 
          sp.shelf === this.editShelfOldName ? { ...sp, shelf: newName } : sp
        );
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        // 3. 更新批次关联的货架名称
        const newShelfBatches = this.shelfBatches.map((b) => 
          b.shelf === this.editShelfOldName ? { ...b, shelf: newName } : b
        );
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.editShelfModalVisible = false;
        this.$message.success("货架名称修改成功");
      });
    },

    // ========== 3. 添加商品到货架 ==========
    openAddProductToShelf(shelf) {
      this.addProductToShelfName = shelf;
      this.addProductForm = { productId: "", shelfMax: 10 };
      this.addProductModalVisible = true;
      this.$nextTick(() => {
        this.$refs.addProductFormRef?.clearValidate();
      });
    },
    saveAddProductToShelf() {
      this.$refs.addProductFormRef.validate((valid) => {
        if (!valid) return;

        const { productId, shelfMax } = this.addProductForm;
        const shelf = this.addProductToShelfName;

        // 检查商品是否已添加到该货架
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

        // 添加货架-商品关联
        const newShelfProducts = [
          ...this.shelfProducts,
          {
            shelf,
            productId,
            shelfMax,
            name: product.name,
            category: product.category,
          },
        ];
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);

        this.addProductModalVisible = false;
        this.$message.success(`商品【${product.name}】已添加到货架【${shelf}】`);
      });
    },

    // ========== 4. 添加批次 ==========
    openAddBatchModal(shelf, productId, productName) {
      this.addBatchShelfName = shelf;
      this.addBatchProductId = productId;
      this.addBatchProductName = productName;
      this.addBatchForm = { batch: "", expire: "", qty: 1 };
      this.addBatchModalVisible = true;
      this.$nextTick(() => {
        this.$refs.addBatchFormRef?.clearValidate();
      });
    },
    saveAddBatch() {
      this.$refs.addBatchFormRef.validate((valid) => {
        if (!valid) return;

        const { batch, expire, qty } = this.addBatchForm;
        const shelf = this.addBatchShelfName;
        const productId = this.addBatchProductId;

        // 检查批次是否已存在
        const isBatchExist = this.shelfBatches.some(
          (b) => b.shelf === shelf && b.productId === productId && b.batch === batch
        );
        if (isBatchExist) {
          this.$message.error("该批次已存在");
          return;
        }

        // 添加批次记录
        const newShelfBatches = [
          ...this.shelfBatches,
          { shelf, productId, batch, expire, qty },
        ];
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.addBatchModalVisible = false;
        this.$message.success(`批次【${batch}】添加成功`);
      });
    },

    // ========== 5. 修改最大容量 ==========
    openEditMaxQtyModal(shelf, productId, productName, currentMax) {
      this.editMaxQtyShelfName = shelf;
      this.editMaxQtyProductId = productId;
      this.editMaxQtyProductName = productName;
      this.editMaxQtyForm.newMax = currentMax;
      this.editMaxQtyModalVisible = true;
      this.$nextTick(() => {
        this.$refs.editMaxQtyFormRef?.clearValidate();
      });
    },
    saveEditMaxQty() {
      this.$refs.editMaxQtyFormRef.validate((valid) => {
        if (!valid) return;

        const { newMax } = this.editMaxQtyForm;
        const shelf = this.editMaxQtyShelfName;
        const productId = this.editMaxQtyProductId;

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
    updateBatchQty(shelf, productId, batch, qty) {
      const newBatches = this.shelfBatches.map((b) => 
        b.shelf === shelf && b.productId === productId && b.batch === batch
          ? { ...b, qty }
          : b
      );
      this.UPDATE_SHELF_BATCHES(newBatches);
      this.$message.success("数量已更新");
    },

    // 删除批次
    deleteBatch(shelf, productId, batch) {
      this.$confirm("确定删除该批次？", "提示", { type: "warning" }).then(() => {
        const newBatches = this.shelfBatches.filter(
          (b) => !(b.shelf === shelf && b.productId === productId && b.batch === batch)
        );
        this.UPDATE_SHELF_BATCHES(newBatches);
        this.$message.success("批次已删除");
      });
    },

    // 删除货架（含关联数据）
    deleteShelf(index, shelfName) {
      // 统计关联数据
      const shelfProductCount = this.shelfProducts.filter(sp => sp.shelf === shelfName).length;
      const shelfBatchCount = this.shelfBatches.filter(b => b.shelf === shelfName).length;

      const confirmText = `确定删除货架【${shelfName}】？
该操作将删除：
1. 该货架下${shelfProductCount}个商品关联记录
2. ${shelfBatchCount}个货架批次记录
数据删除后无法恢复！`;

      this.$confirm(confirmText, "提示", { type: "warning" }).then(() => {
        // 删除货架
        const newShelves = this.shelves.filter((_, i) => i !== index);
        // 删除关联的商品和批次
        const newShelfProducts = this.shelfProducts.filter(sp => sp.shelf !== shelfName);
        const newShelfBatches = this.shelfBatches.filter(b => b.shelf !== shelfName);

        this.UPDATE_SHELVES(newShelves);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.$message.success("货架删除成功");
      });
    },

    // 删除货架商品（含批次）
    deleteProductFromShelf(shelf, productId, productName) {
      const batchCount = this.getProductBatches(shelf, productId).length;
      const confirmText = `确定从【${shelf}】删除商品【${productName}】？
该操作将删除：
1. 该商品在货架的关联记录
2. ${batchCount}个商品批次记录
数据删除后无法恢复！`;

      this.$confirm(confirmText, "提示", { type: "warning" }).then(() => {
        // 删除商品关联
        const newShelfProducts = this.shelfProducts.filter(
          (sp) => !(sp.shelf === shelf && sp.productId === productId)
        );
        // 删除批次记录
        const newShelfBatches = this.shelfBatches.filter(
          (b) => !(b.shelf === shelf && b.productId === productId)
        );

        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.$message.success(`商品【${productName}】已从货架【${shelf}】删除`);
      });
    },
  },
};
</script>

<style scoped>
.shelf-item {
  margin-bottom: 15px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-footer {
  text-align: right;
}
</style>