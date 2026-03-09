<template>
  <div
    style="
      padding: 20px;
      border: 1px solid #000;
      border-radius: 8px;
      background-color: #fff;
    "
  >
    <el-row type="flex" justify="end">
      <el-button
        style="border: 1px solid #000;margin-bottom: 2px;"
        type="success"
        @click="openAddModal"
        >新增分类</el-button
      >
    </el-row>

    <!-- 分类列表 -->
    <div>
      <div v-if="getCategoriesSorted.length === 0" class="item">
        暂无分类，请先添加
      </div>
      <div
        v-else
        class="item"
        v-for="category in getCategoriesSorted"
        :key="category.id"
      >
        <el-collapse
          ><el-collapse-item :title="category.name"
            ><el-row
              type="flex"
              justify="space-between"
              style="margin-top: 20px"
              ><el-col :span="8"
                ><el-button
                  type="warning"
                  size="mini"
                  style="border: 1px solid #000"
                  @click="openEditModal(category)"
                  >修改</el-button
                ></el-col
              ><el-col :span="8">
                <el-button
                  type="danger"
                  size="mini"
                  style="border: 1px solid #000"
                  @click="openDeleteModal(category)"
                  >删除</el-button
                ></el-col
              ></el-row
            ></el-collapse-item
          ></el-collapse
        >
      </div>
    </div>

    <!-- 新增分类弹窗 -->
    <el-dialog
      title="新增分类"
      :visible.sync="addModalVisible"
      width="320px"
      style="border: 1px solid #000"
      @close="resetAddForm"
    >
      <el-form
        :model="category"
        :rules="formRules"
        ref="addFormRef"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="category.name"
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
      width="320px"
      @close="resetEditForm"
    >
      <el-form
        :model="category"
        :rules="formRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="新分类名称" prop="name">
          <el-input
            v-model="category.name"
            placeholder="如：日用品、零食"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditForm">保存</el-button>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="deleteModalVisible"
      width="320px"
      @close="deleteModalVisible = false"
      ><div style="margin: 10px 30px; font-size: 17px; text-align: center">
        <strong>确定删除分类【{{ category.name }}】?</strong>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteModalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDelete(category)"
            >确定</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import { validateForm, calculateId } from "@/utils/helpers";
export default {
  name: "Category",
  data() {
    return {
      // 弹窗状态
      addModalVisible: false,
      editModalVisible: false,
      deleteModalVisible: false,
      category: {
        id: "",
        name: "",
      },
      // 表单校验规则
      formRules: {
        name: [{ required: true, message: "请输入分类名称", trigger: "blur" }],
      },
    };
  },
  computed: {
    // 从Vuex全局状态中获取分类和商品数据（自动响应式更新）
    ...mapState(["categories", "products"]),
    getCategoriesSorted() {
      const sortByIdDesc = (a, b) => b.id - a.id;
      return [...this.categories].sort(sortByIdDesc);
    },
  },
  methods: {
    ...mapMutations([
      "UPDATE_CATEGORIES", // 更新分类列表
      "UPDATE_PRODUCTS", // 更新商品列表
    ]),

    openAddModal() {
      this.resetAddForm();
      this.addModalVisible = true;
    },

    // 重置新增表单
    resetAddForm() {
      if (this.$refs.addFormRef) {
        this.$refs.addFormRef.clearValidate();
      }
      if (!this.addModalVisible) {
        this.category = {
          id: "",
          name: "",
        };
      }
    },

    // 保存新增分类
    saveAddForm() {
      this.$refs.addFormRef.validate((valid) => {
        if (!valid) return;

        const categoryName = this.category.name.trim();
        const validateResult = validateForm({ 分类名称: categoryName });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }
        const exists = this.categories.some(
          (c) => c.name.trim().toLowerCase() === categoryName.toLowerCase()
        );
        if (exists) {
          this.$message.error("该分类已存在");
          return;
        }
        const newCategoryId = calculateId(this.categories);

        const newCategory = {
          id: newCategoryId,
          name: categoryName,
        };
        const newCategories = [...this.categories, newCategory];
        this.UPDATE_CATEGORIES(newCategories);

        this.$message.success(`分类【${newCategory.name}】添加成功`);
        this.addModalVisible = false;
      });
    },

    // 打开修改分类弹窗
    openEditModal(category) {
      this.category = { ...category };
      this.editModalVisible = true;
    },

    // 重置编辑表单
    resetEditForm() {
      if (this.$refs.editFormRef) {
        this.$refs.editFormRef.clearValidate();
      }
    },

    // 保存修改分类
    saveEditForm() {
      this.$refs.editFormRef.validate((valid) => {
        if (!valid) return;

        const newName = this.category.name.trim();
        const validateResult = validateForm({ 新分类名称: newName });

        if (!validateResult.valid) {
          this.$message.error(validateResult.message);
          return;
        }
        const exists = this.categories.some(
          (c) => c.name.trim().toLowerCase() === newName.toLowerCase()
        );
        if (exists) {
          this.$message.error("该分类已存在");
          return;
        }
        const newCategory = this.category;
        const newCategories = this.categories.map((category) => {
          if (category.id === this.category.id) {
            return newCategory;
          }
          return category;
        });

        // 3. 调用Vuex mutation更新全局状态（自动同步到本地存储）
        this.UPDATE_CATEGORIES(newCategories);

        this.$message.success(`分类【${newCategory.name}】修改成功`);
        this.editModalVisible = false;
      });
    },
    openDeleteModal(category) {
      this.category = { ...category };
      this.deleteModalVisible = true;
    },
    // 删除分类
    confirmDelete(category) {
      const hasProductUse = this.products.some(
        (p) => p.categoryId === category.id
      );
      if (hasProductUse) {
        this.$message.error("该分类仍有商品使用，无法删除");
        return;
      }
      const newCategories = this.categories.filter(
        (category) => category.id !== this.category.id
      );
      this.UPDATE_CATEGORIES(newCategories);
      this.$message.success(`删除分类【${this.category.name}】成功！`);
      this.deleteModalVisible = false;
    },
  },
};
</script>

<style scoped>
.item {
  margin: 10px 0;
  padding: 15px;
  border: 1px solid #000000;
  border-radius: 8px;
  transition: all 0.2s ease;
}
</style>