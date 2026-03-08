<template>
  <!-- 保质期警告区域 -->
  <el-card class="warning-card" shadow="formed">
    <div slot="header" class="clearfix">
      <span>⚠️ 保质期状态警告</span>
    </div>
    <!-- 临期阈值设置 -->
    <el-card class="threshold-card" shadow="formed">
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
              size="mini"
              style="width: 100px"
            ></el-input-number>
          </el-form-item>
        </div>

        <!-- 右侧区域：保存按钮 -->
        <el-form-item>
          <el-button
            style="width: 70px; padding: 8px 10px; border: 1px solid #000"
            type="success"
            size="mini"
            icon="el-icon-check"
            @click="saveThreshold"
          >
            保存
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
    <div v-if="warnItems.length > 0" class="warn-list">
      <div
        v-for="(item, index) in warnItems"
        :key="index"
        :class="['warn-item', item.cls]"
        :title="item.text"
      >
        <i :class="['el-icon', item.icon]"></i> {{ item.name }} | {{ item.status
        }}<br />{{ item.date }}
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
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";

export default {
  name: "Home",
  data() {
    return {
      thresholdForm: {
        days: 7, // 默认临期提醒天数
      },
      warnItems: [], // 警告列表
    };
  },
  computed: {
    ...mapState([
      "shelfBatches",
      "expireThreshold",
      "shelfProducts",
      "products",
    ]),
    ...mapGetters(["getWarnBatches"]),
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
    // 监听批次变化，实时更新警告
    shelfBatches: {
      deep: true,
      handler() {
        this.renderWarningArea();
      },
    },
    getWarnBatches: {
      deep: true,
      handler() {
        this.renderWarningArea();
      },
    },
  },
  methods: {
    ...mapMutations(["SET_EXPIRE_THRESHOLD", "UPDATE_SHELF_BATCHES"]),

    renderWarningArea() {
      this.warnItems = this.getWarnBatches.map((item) => ({
        name: `${item.shelfName} → ${item.productName}`,
        date: `【${item.produceDate} → ${item.expireDate}】`,
        status: `${item.status.text}`,
        cls: item.status.cls,
        icon:
          item.status.cls === "danger" ? "el-icon-error" : "el-icon-warning",
      }));
    },

    saveThreshold() {
      const threshold = this.thresholdForm.days;

      // 边界值校验
      if (threshold < 1) {
        this.$message.warning("临期天数不能小于1");
        return;
      }
      if (threshold > 30) {
        this.$message.warning("临期天数不能大于30");
        return;
      }

      // 保存到Vuex（自动同步到本地存储）
      this.SET_EXPIRE_THRESHOLD(threshold);

      // 更新警告显示
      this.renderWarningArea();

      // 显示成功提示
      this.$message.success("临期提醒天数设置保存成功");
    },
  },
};
</script>

<style scoped>
.function-card {
  margin-bottom: 20px;
}

.full-width-btn {
  width: 100%;
}

.threshold-card {
  margin-bottom: 20px;
  border: 1px solid #000;
  border-radius: 8px;
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
  border: 1px solid #000;
  border-radius: 8px;
}

.warn-list {
  padding: 10px 0;
  font-size: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.warn-item {
  padding: 10px 15px;
  font-size: 8px;
  font-weight: bold;
  border-bottom: 1px dashed #eee;
  border-radius: 4px;
  margin-bottom: 5px;
  background-color: #fafafa;
  transition: all 0.3s;
}

/* 匹配状态的颜色和图标 */
.danger {
  color: #f44336;
  border-left: 3px solid #f44336;
}

.warning {
  color: #ff9800;
  border-left: 3px solid #ff9800;
}

.success {
  color: #4caf50;
  border-left: 3px solid #4caf50;
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

  .warn-item {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>