<template>
  <div class="home-page">
    <h3>库存保质期状态总览</h3>

    <!-- 新手引导 -->
    <el-alert title="📌 新手引导" type="info" closable show-icon>
      <ul style="margin: 0; padding-left: 20px">
        <li>首页展示所有临期/过期商品预警，点击颜色标签可快速识别状态</li>
        <li>「货架管理」：管理货架及货架上的商品/生产日期，清点使用</li>
        <li>「仓库管理」：管理商品信息、保质期设置</li>
        <li>「分类管理」：管理商品分类信息</li>
      </ul>
    </el-alert>

    <!-- 功能按钮 -->
    <el-row :gutter="10" style="margin: 20px 0">
      <el-col :span="6">
        <el-button type="success" @click="$router.push('/shelf')"
          >货架管理</el-button
        >
      </el-col>
      <el-col :span="6">
        <el-button type="warning" @click="$router.push('/warehouse')"
          >仓库管理</el-button
        >
      </el-col>
      <el-col :span="6">
        <el-button type="info" @click="$router.push('/category')"
          >分类管理</el-button
        >
      </el-col>
    </el-row>

    <!-- 临期阈值设置 -->
    <el-card style="margin-bottom: 20px">
      <h4>临期提醒天数设置</h4>
      <el-form inline @submit.native.prevent>
        <el-form-item label="临期提醒天数：">
          <el-input-number
            v-model="threshold"
            :min="1"
            :max="30"
            style="width: 100px"
          ></el-input-number>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="saveThreshold">保存设置</el-button>
        </el-form-item>
      </el-form>
      <p style="margin: 5px 0; font-size: 14px; color: #666">
        设置后，剩余保质期小于等于该天数的商品会被标记为临期/即将过期
      </p>
    </el-card>

    <!-- 保质期警告区域 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>⚠️ 保质期警告</span>
        </div>
      </template>
      <div v-if="warnProducts.length > 0">
        <div
          v-for="item in warnProducts"
          :key="`${item.shelf}-${item.batch}`"
          :class="[
            'el-tag',
            item.status === 'expired' ? 'el-tag--danger' : 'el-tag--warning',
          ]"
          style="margin: 5px"
        >
          {{ item.shelf }}→{{ item.product }}({{ item.batch }}
          {{
            item.leftDays <= 0
              ? `已过期(${Math.abs(item.leftDays)}天)`
              : `即将过期(剩${item.leftDays}天)`
          }})
        </div>
      </div>
      <div v-else class="el-tag el-tag--success">✅ 暂无临期或过期商品</div>
    </el-card>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";

export default {
  name: "Home",
  data() {
    return {
      threshold: 3,
    };
  },
  computed: {
    ...mapState(["expireThreshold"]),
    ...mapGetters(["getExpireWarnProducts"]),
    warnProducts() {
      return this.getExpireWarnProducts;
    },
  },
  created() {
    // 初始化数据
    this.$store.dispatch("initData");
    this.threshold = this.expireThreshold;
  },
  methods: {
    ...mapMutations(["UPDATE_THRESHOLD"]),
    // 保存阈值设置
    saveThreshold() {
      this.UPDATE_THRESHOLD(this.threshold);
      this.$message.success("临期提醒天数设置保存成功！");
    },
  },
};
</script>

<style scoped>
.home-page {
  padding: 10px;
}
.card-header {
  font-weight: bold;
}
</style>