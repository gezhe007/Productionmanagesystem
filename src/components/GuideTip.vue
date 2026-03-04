<template>
  <div class="guide-tip" v-if="visible">
    <span class="close-guide" @click="handleClose">×</span>
    <strong>📌 新手引导：</strong>
    <!-- 自定义引导内容（插槽） -->
    <slot name="content"></slot>
  </div>
</template>

<script>
export default {
  name: "GuideTip",
  props: {
    // 是否显示引导框（可选，默认true）
    visible: {
      type: Boolean,
      default: true,
    },
    // 是否记住关闭状态（本地存储）
    remember: {
      type: Boolean,
      default: true,
    },
    // 本地存储的key（记住状态时使用）
    storageKey: {
      type: String,
      default: "guide_tip_closed",
    },
  },
  created() {
    // 如果开启记住状态，且本地存储标记为已关闭，则不显示
    if (this.remember) {
      const closed = localStorage.getItem(this.storageKey) === "true";
      if (closed) {
        this.$emit("update:visible", false);
      }
    }
  },
  methods: {
    // 关闭引导框
    handleClose() {
      this.$emit("close");
      this.$emit("update:visible", false);
      // 记住关闭状态
      if (this.remember) {
        localStorage.setItem(this.storageKey, "true");
      }
    },
  },
};
</script>

<style scoped>
.guide-tip {
  background: #e6f7ff;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 4px solid #1890ff;
  font-size: 14px;
  position: relative;
}

.guide-tip strong {
  color: #1890ff;
  display: block;
  margin-bottom: 8px;
}

.guide-tip ul {
  margin: 5px 0;
  padding-left: 20px;
  color: #333;
}

.guide-tip li {
  margin: 4px 0;
}

.close-guide {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
}

.close-guide:hover {
  color: #f5222d;
  background: #f5f5f5;
  border-radius: 50%;
}
</style>