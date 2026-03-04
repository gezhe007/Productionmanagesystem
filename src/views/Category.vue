<template>
  <div>
    <!-- 页面标题 -->
    <div class="page-header" style="display: flex; justify-content: center">
      <h2>分类管理</h2>
    </div>

    <!-- 操作按钮 -->
    <div class="function-buttons">
      <el-button type="success" @click="openAddModal">新增分类</el-button>
    </div>

    <!-- 分类列表 -->
    <div id="category-list">
      <div v-if="categories.length === 0" class="item">暂无分类，请先添加</div>
      <div
        v-else
        class="item"
        v-for="(category, index) in categories"
        :key="index"
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <strong>{{ category }}</strong>
          <div class="shelf-actions">
            <el-button
              type="warning"
              size="mini"
              @click="openEditModal(index, category)"
              >修改</el-button
            >
            <el-button
              type="danger"
              size="mini"
              @click="deleteCategory(index, category)"
              >删除</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 新增分类弹窗 -->
    <el-dialog
      title="新增分类"
      :visible.sync="addModalVisible"
      width="400px"
      @close="resetAddForm"
    >
      <el-form
        :model="addForm"
        :rules="formRules"
        ref="addForm"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="addForm.name"
            placeholder="如：日用品、零食"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddForm">保存</el-button>
      </div>
    </el-dialog>

    <!-- 修改分类弹窗 -->
    <el-dialog
      title="修改分类"
      :visible.sync="editModalVisible"
      width="400px"
      @close="resetEditForm"
    >
      <el-form
        :model="editForm"
        :rules="formRules"
        ref="editForm"
        label-width="100px"
      >
        <el-form-item label="新分类名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="如：日用品、零食"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditForm">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { validateForm } from "@/utils/helpers";
export default {
  name: "Category",
  data() {
    return {
      // 弹窗状态
      addModalVisible: false,
      editModalVisible: false,

      // 表单数据
      addForm: {
        name: "",
      },
      editForm: {
        name: "",
        index: -1,
        oldName: "",
      },

      // 表单校验规则
      formRules: {
        name: [{ required: true, message: "请输入分类名称", trigger: "blur" }],
      },
    };
  },
  computed: {
    // 从Vuex全局状态中获取分类和商品数据（自动响应式更新）
    ...mapState(['categories', 'products'])
  },
  methods: {
    // 映射Vuex的mutations方法（用于更新全局状态）
    ...mapMutations([
      'UPDATE_CATEGORIES', // 更新分类列表
      'UPDATE_PRODUCTS'    // 更新商品列表
    ]),

    // 打开新增分类弹窗
    openAddModal() {
      this.resetAddForm();
      this.addModalVisible = true;
    },

    // 重置新增表单
    resetAddForm() {
      this.addForm = {
        name: "",
      };
      if (this.$refs.addForm) {
        this.$refs.addForm.resetFields();
      }
    },

    // 保存新增分类
    saveAddForm() {
      this.$refs.addForm.validate((valid) => {
        if (!valid) return;

        const categoryName = this.addForm.name.trim();
        const validateResult = validateForm({ 分类名称: categoryName });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        if (this.categories.includes(categoryName)) {
          this.$message.error("该分类已存在");
          return;
        }

        // 1. 新增分类（基于现有数组创建新数组，符合Vuex状态更新规范）
        const newCategories = [...this.categories, categoryName];
        // 2. 调用Vuex mutation更新全局状态（自动同步到本地存储）
        this.UPDATE_CATEGORIES(newCategories);

        this.$message.success("分类添加成功");
        this.addModalVisible = false;
      });
    },

    // 打开修改分类弹窗
    openEditModal(index, currentName) {
      this.editForm = {
        name: currentName,
        index: index,
        oldName: currentName,
      };
      this.editModalVisible = true;
    },

    // 重置编辑表单
    resetEditForm() {
      if (this.$refs.editForm) {
        this.$refs.editForm.resetFields();
      }
    },

    // 保存修改分类
    saveEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (!valid) return;

        const newName = this.editForm.name.trim();
        const validateResult = validateForm({ 新分类名称: newName });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }

        if (
          this.categories.includes(newName) &&
          this.categories[this.editForm.index] !== newName
        ) {
          this.$message.error("该分类已存在");
          return;
        }

        // 1. 更新分类名称（创建新数组，避免直接修改原数组）
        const oldName = this.editForm.oldName;
        const newCategories = [...this.categories];
        newCategories[this.editForm.index] = newName;

        // 2. 同步更新已有商品的分类（创建新数组）
        const newProducts = this.products.map((product) => {
          if (product.category === oldName) {
            return { ...product, category: newName };
          }
          return product;
        });

        // 3. 调用Vuex mutation更新全局状态（自动同步到本地存储）
        this.UPDATE_CATEGORIES(newCategories);
        this.UPDATE_PRODUCTS(newProducts);

        this.$message.success("分类修改成功");
        this.editModalVisible = false;
      });
    },

    // 删除分类
    deleteCategory(index, categoryName) {
      // 检查是否有商品使用该分类
      const hasProductUse = this.products.some(
        (p) => p.category === categoryName
      );
      if (hasProductUse) {
        this.$message.error("该分类仍有商品使用，无法删除");
        return;
      }

      this.$confirm(`确定删除分类【${categoryName}】？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          // 1. 删除分类（创建新数组）
          const newCategories = [...this.categories];
          newCategories.splice(index, 1);
          // 2. 调用Vuex mutation更新全局状态
          this.UPDATE_CATEGORIES(newCategories);

          this.$message.success("分类删除成功");
        })
        .catch(() => {
          this.$message.info("已取消删除");
        });
    },
  },
};
</script>

<style scoped>
.back-btn {
  margin-left: 10px;
  font-size: 14px;
}

.function-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.item {
  margin: 10px 0;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.shelf-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>