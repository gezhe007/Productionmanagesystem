<template>
  <transition name="el-fade-in-linear">
    <div
      v-show="visible"
      class="custom-alert"
      :class="`alert-${type}`"
      :style="{ top: `${top}px`, right: `${right}px` }"
    >
      <i :class="iconClass" v-if="showIcon"></i>
      <span class="alert-content">{{ message }}</span>
      <span class="close-btn" @click="close" v-if="closable">×</span>
    </div>
  </transition>
</template>

<script>
export default {
  name: "CustomAlert",
  props: {
    // 提示消息
    message: {
      type: String,
      required: true,
    },
    // 提示类型：success/error/warning/info
    type: {
      type: String,
      default: "success",
      validator: (val) => ["success", "error", "warning", "info"].includes(val),
    },
    // 自动关闭时间（毫秒，0表示不自动关闭）
    duration: {
      type: Number,
      default: 3000,
    },
    // 是否显示图标
    showIcon: {
      type: Boolean,
      default: true,
    },
    // 是否可关闭
    closable: {
      type: Boolean,
      default: true,
    },
    // 弹窗位置：top
    top: {
      type: Number,
      default: 20,
    },
    // 弹窗位置：right
    right: {
      type: Number,
      default: 20,
    },
  },
  data() {
    return {
      visible: true, // 是否显示
      timer: null, // 自动关闭定时器
    };
  },
  computed: {
    // 图标类名
    iconClass() {
      const iconMap = {
        success: "el-icon-success",
        error: "el-icon-error",
        warning: "el-icon-warning",
        info: "el-icon-info",
      };
      return iconMap[this.type];
    },
  },
  mounted() {
    // 自动关闭逻辑
    if (this.duration > 0) {
      this.timer = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  },
  methods: {
    // 关闭弹窗
    close() {
      this.visible = false;
      clearTimeout(this.timer);
      // 触发关闭事件，供父组件清理
      this.$emit("close");
      // 动画结束后销毁组件（可选）
      setTimeout(() => {
        this.$emit("destroy");
      }, 300);
    },
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  },
};
</script>

<style scoped>
.custom-alert {
  position: fixed;
  padding: 12px 20px;
  border-radius: 6px;
  z-index: 9999;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  max-width: 300px;
  animation: slideIn 0.3s ease;
}

/* 不同类型的背景色 */
.alert-success {
  background: #52c41a;
}

.alert-error {
  background: #f5222d;
}

.alert-warning {
  background: #faad14;
}

.alert-info {
  background: #1890ff;
}

/* 图标样式 */
.custom-alert i {
  margin-right: 8px;
  font-size: 16px;
}

/* 内容样式 */
.alert-content {
  flex: 1;
  word-wrap: break-word;
  font-size: 14px;
}

/* 关闭按钮 */
.close-btn {
  margin-left: 8px;
  cursor: pointer;
  font-size: 16px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 动画 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.el-fade-in-linear-leave-active {
  transition: opacity 0.3s ease;
}

.el-fade-in-linear-leave-to {
  opacity: 0;
}
</style>