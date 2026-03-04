<template>
  <div class="shelf-page">
    <el-page-header
      content="货架管理"
      @back="$router.push('/')"
    ></el-page-header>

    <!-- 新手引导 -->
    <el-alert
      title="📌 新手引导"
      type="info"
      closable
      show-icon
      style="margin: 10px 0"
    >
      <ul style="margin: 0; padding-left: 20px">
        <li>
          货架管理页面负责清点货架上的货物数量以及生产日期，清点完毕后使用补货按钮快捷补货
        </li>
        <li>工作流：货架->数量、生产批次清点->补货</li>
      </ul>
    </el-alert>

    <!-- 顶部操作栏 -->
    <el-row :gutter="10" style="margin: 15px 0">
      <el-col :span="12">
        <el-button type="success" @click="openAddShelfModal"
          >新增货架</el-button
        >
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button type="warning" @click="$router.push('/replenish')"
          >补货</el-button
        >
      </el-col>
    </el-row>

    <!-- 货架列表 -->
    <div v-for="(shelf, index) in shelves" :key="index" class="shelf-item">
      <el-card>
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
                      :type="getBatchStatus(batch.expire).cls"
                      size="mini"
                    >
                      {{ getBatchStatus(batch.expire).text }}
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

            <!-- 库存信息 -->
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
                }}件 / 需补货{{ calculateReplenishQty(shelf, product.id) }}件
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

    <!-- 新增货架弹窗 -->
    <el-dialog
      title="新增货架"
      :visible.sync="addShelfModalVisible"
      width="400px"
    >
      <el-form :model="addShelfForm" :rules="addShelfRules" ref="addShelfForm">
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

    <!-- 其他弹窗（修改货架名称、添加商品、添加批次等）可参考此结构封装 -->
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
import { getBatchStatus, calculateReplenishQty } from "@/utils/date";
import { STORAGE_KEYS } from "@/utils/storage";

export default {
  name: "Shelf",
  data() {
    return {
      // 新增货架弹窗
      addShelfModalVisible: false,
      addShelfForm: {
        name: "",
      },
      addShelfRules: {
        name: [{ required: true, message: "请输入货架名称", trigger: "blur" }],
      },
      // 其他弹窗数据...
    };
  },
  computed: {
    ...mapState([
      "shelves",
      "products",
      "shelfProducts",
      "shelfBatches",
      "expireThreshold",
    ]),
    ...mapGetters(["getProductsInShelf"]),
  },
  methods: {
    ...mapMutations([
      "UPDATE_SHELVES",
      "UPDATE_SHELF_PRODUCTS",
      "UPDATE_SHELF_BATCHES",
    ]),
    // 获取批次状态
    getBatchStatus(expireDateStr) {
      return getBatchStatus(expireDateStr, this.expireThreshold);
    },
    // 获取商品批次
    getProductBatches(shelf, productId) {
      return this.shelfBatches
        .filter((b) => b.shelf === shelf && b.productId === productId)
        .sort((a, b) => new Date(a.expire) - new Date(b.expire));
    },
    // 获取商品总数量
    getProductTotalQty(shelf, productId) {
      return this.getProductBatches(shelf, productId).reduce(
        (sum, b) => sum + b.qty,
        0
      );
    },
    // 计算补货数量
    calculateReplenishQty(shelf, productId) {
      return calculateReplenishQty(
        shelf,
        productId,
        this.shelfProducts,
        this.shelfBatches
      );
    },
    // 打开新增货架弹窗
    openAddShelfModal() {
      this.addShelfForm.name = "";
      this.addShelfModalVisible = true;
    },
    // 保存新增货架
    saveNewShelf() {
      this.$refs.addShelfForm.validate((valid) => {
        if (valid) {
          if (this.shelves.includes(this.addShelfForm.name)) {
            this.$message.error("该货架名称已存在");
            return;
          }
          const newShelves = [...this.shelves, this.addShelfForm.name];
          this.UPDATE_SHELVES(newShelves);
          this.addShelfModalVisible = false;
          this.$message.success("货架添加成功");
        }
      });
    },
    // 更新批次数量
    updateBatchQty(shelf, productId, batch, qty) {
      const newBatches = this.shelfBatches.map((b) => {
        if (
          b.shelf === shelf &&
          b.productId === productId &&
          b.batch === batch
        ) {
          return { ...b, qty };
        }
        return b;
      });
      this.UPDATE_SHELF_BATCHES(newBatches);
      this.$message.success("数量已更新");
    },
    // 删除批次
    deleteBatch(shelf, productId, batch) {
      this.$confirm("确定删除该批次？", "提示", {
        type: "warning",
      }).then(() => {
        const newBatches = this.shelfBatches.filter(
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
    // 其他方法（修改货架名称、添加商品、删除商品等）可参考原生逻辑迁移...
    deleteShelf(index, shelfName) {
      // 统计关联数据
      const shelfProductCount = this.shelfProducts.filter(
        (sp) => sp.shelf === shelfName
      ).length;
      const shelfBatchCount = this.shelfBatches.filter(
        (b) => b.shelf === shelfName
      ).length;

      const confirmText = `确定删除货架【${shelfName}】？
该操作将删除：
1. 该货架下${shelfProductCount}个商品关联记录
2. ${shelfBatchCount}个货架批次记录
数据删除后无法恢复！`;

      this.$confirm(confirmText, "提示", {
        type: "warning",
      }).then(() => {
        const newShelves = this.shelves.filter((_, i) => i !== index);
        // 删除关联数据
        const newShelfProducts = this.shelfProducts.filter(
          (sp) => sp.shelf !== shelfName
        );
        const newShelfBatches = this.shelfBatches.filter(
          (b) => b.shelf !== shelfName
        );

        this.UPDATE_SHELVES(newShelves);
        this.UPDATE_SHELF_PRODUCTS(newShelfProducts);
        this.UPDATE_SHELF_BATCHES(newShelfBatches);

        this.$message.success("货架删除成功");
      });
    },
    // 打开添加商品到货架弹窗
    openAddProductToShelf(shelf) {
      // 后续封装商品选择弹窗...
      this.$message.info("商品选择弹窗待实现");
    },
    // 打开添加批次弹窗
    openAddBatchModal(shelf, productId, productName) {
      // 后续封装批次添加弹窗...
      this.$message.info("批次添加弹窗待实现");
    },
    // 打开修改最大容量弹窗
    openEditMaxQtyModal(shelf, productId, productName, currentMax) {
      // 后续封装修改最大容量弹窗...
      this.$message.info("修改最大容量弹窗待实现");
    },
    // 删除货架商品
    deleteProductFromShelf(shelf, productId, productName) {
      // 统计批次数量
      const batchCount = this.getProductBatches(shelf, productId).length;

      const confirmText = `确定从【${shelf}】删除商品【${productName}】？
该操作将删除：
1. 该商品在货架的关联记录
2. ${batchCount}个商品批次记录
数据删除后无法恢复！`;

      this.$confirm(confirmText, "提示", {
        type: "warning",
      }).then(() => {
        // 删除货架商品关联记录
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
    // 打开修改货架名称弹窗
    openEditShelfModal(index, shelfName) {
      // 后续封装修改货架名称弹窗...
      this.$message.info("修改货架名称弹窗待实现");
    },
  },
};
</script>

<style scoped>
.shelf-page {
  padding: 10px;
}
.shelf-item {
  margin-bottom: 15px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>