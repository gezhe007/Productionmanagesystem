<template>
  <div class="home-container">
    <!-- 新手引导组件 -->
    <GuideTip v-if="showGuide" @close="showGuide = false">
      <template #content>
        <ul>
          <li>首页展示所有临期/过期商品预警，点击颜色标签可快速识别状态</li>
          <li>「货架管理」：管理货架及货架上的商品/生产日期，清点使用</li>
          <li>「仓库管理」：管理商品信息、保质期设置</li>
          <li>「分类管理」：管理商品分类信息</li>
        </ul>
      </template>
    </GuideTip>

    <!-- 功能按钮区 -->
    <el-card class="function-card" style="margin: auto">
      <el-row :gutter="10" type="flex">
        <el-col :xs="12" :sm="6" :md="4">
          <el-button
            type="success"
            icon="el-icon-menu"
            size="medium"
            @click="$router.push('/shelf')"
            class="full-width-btn"
          >
            货架管理
          </el-button>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-button
            type="warning"
            icon="el-icon-s-shop"
            size="medium"
            @click="$router.push('/warehouse')"
            class="full-width-btn"
          >
            仓库管理
          </el-button>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-button
            type="primary"
            icon="el-icon-s-data"
            size="medium"
            @click="$router.push('/category')"
            class="full-width-btn"
          >
            分类管理
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 临期阈值设置 -->
    <el-card class="threshold-card" shadow="hover">
      <el-form
        :inline="true"
        :model="thresholdForm"
        class="threshold-form"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <!-- 左侧区域：输入框 + 提示文字 -->
        <div style="display: flex; align-items: center">
          <el-form-item label="临期天数：" label-width="82px">
            <el-input-number
              v-model="thresholdForm.days"
              :min="1"
              :max="30"
              @change="handleThresholdChange"
              size="mini"
              style="width: 100px"
            ></el-input-number>
          </el-form-item>
          <el-form-item v-if="thresholdMessage">
            <span class="success-text">{{ thresholdMessage }}</span>
          </el-form-item>
        </div>

        <!-- 右侧区域：保存按钮 -->
        <el-form-item>
          <el-button type="success" size="mini" icon="el-icon-check" @click="saveThreshold">
            保存设置
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert
        title="设置后，剩余保质期小于等于该天数的商品会被标记为临期/即将过期"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 10px; font-size: 14px"
      ></el-alert>
    </el-card>

    <!-- 保质期警告区域 -->
    <el-card class="warning-card">
      <div slot="header" class="clearfix">
        <span>⚠️ 保质期状态警告</span>
      </div>
      <div v-if="warnItems.length > 0" class="warn-list">
        <div
          v-for="(item, index) in warnItems"
          :key="index"
          :class="['warn-item', item.cls]"
        >
          {{ item.text }}
        </div>
      </div>
      <div v-else class="no-warning">
        <el-alert
          title="✅ 暂无临期或过期商品"
          type="success"
          :closable="false"
          show-icon
        ></el-alert>
      </div>
    </el-card>
  </div>
</template>

<script>
import GuideTip from "@/components/GuideTip.vue";
import { mapState, mapMutations } from "vuex";
import { getBatchStatus } from "@/utils/date";

export default {
  name: "Home",
  components: {
    GuideTip,
  },
  data() {
    return {
      showGuide: true, // 新手引导显示状态
      thresholdForm: {
        days: 3, // 默认临期提醒天数
      },
      thresholdMessage: "", // 设置成功提示
      warnItems: [], // 警告列表
    };
  },
  computed: {
    // 从Vuex获取状态
    ...mapState(["shelfBatches", "expireThreshold"]),
  },
  mounted() {
    // 初始化阈值
    this.thresholdForm.days = this.expireThreshold || 3;
    // 渲染警告区域
    this.renderWarningArea();
  },
  watch: {
    // 监听阈值变化，实时更新警告
    expireThreshold(newVal) {
      this.thresholdForm.days = newVal;
      this.renderWarningArea();
    },
  },
  methods: {
    // 映射Vuex的mutations
    ...mapMutations(["SET_EXPIRE_THRESHOLD", "UPDATE_SHELF_BATCHES"]),

    /**
     * 渲染保质期警告区域
     */
    renderWarningArea() {
      const warnItems = [];

      // 遍历所有货架批次，筛选出需要警告的商品
      this.shelfBatches.forEach((batch) => {
        const status = getBatchStatus(batch.expire, this.expireThreshold);
        if (status.days <= this.expireThreshold) {
          warnItems.push({
            text: `${batch.shelf}→${batch.product}(${batch.batch} ${status.text})`,
            cls: status.cls,
            days: status.days,
          });
        }
      });

      this.warnItems = warnItems;
    },

    /**
     * 保存临期提醒天数设置
     */
    saveThreshold() {
      const threshold = this.thresholdForm.days;

      // 保存到Vuex和本地存储
      this.SET_EXPIRE_THRESHOLD(threshold);

      // 更新警告显示
      this.renderWarningArea();

      // 显示成功提示
      this.thresholdMessage = "设置保存成功！";
      this.$message.success("临期提醒天数设置保存成功");

      // 3秒后清空提示
      setTimeout(() => {
        this.thresholdMessage = "";
      }, 3000);
    },

    /**
     * 处理阈值输入变化
     */
    handleThresholdChange(val) {
      if (val < 1) this.thresholdForm.days = 1;
      if (val > 30) this.thresholdForm.days = 30;
    },
  },
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.function-card {
  margin-bottom: 20px;
}

.full-width-btn {
  width: 100%;
}

.threshold-card {
  margin-bottom: 20px;
}

.threshold-form {
  align-items: center;
}

.success-text {
  color: #4caf50;
  margin-left: 10px;
}

.warning-card {
  margin-bottom: 20px;
}

.warn-list {
  padding: 10px 0;
}

.warn-item {
  padding: 8px 0;
  font-weight: bold;
}

.red {
  color: #f44336;
}

.yellow {
  color: #ff9800;
}

.green {
  color: #4caf50;
}

.no-warning {
  padding: 10px 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .home-container {
    padding: 10px;
  }

  .function-buttons {
    gap: 8px;
  }

  .full-width-btn {
    font-size: 14px;
    padding: 10px 0;
  }
}
</style>