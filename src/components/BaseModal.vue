<template>
  <el-dialog
    :title="title"
    :visible.sync="visible"
    :width="width"
    :modal="modal"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :destroy-on-close="destroyOnClose"
    @close="handleClose"
    @open="handleOpen"
  >
    <!-- 弹窗主体内容（插槽） -->
    <slot></slot>

    <!-- 弹窗底部按钮（插槽，默认提供取消/确认按钮） -->
    <div slot="footer" class="dialog-footer" v-if="showFooter">
      <slot name="footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </slot>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "BaseModal",
  props: {
    // 弹窗标题
    title: {
      type: String,
      default: "提示",
    },
    // 弹窗是否可见（.sync 修饰符绑定）
    visible: {
      type: Boolean,
      default: false,
    },
    // 弹窗宽度
    width: {
      type: [String, Number],
      default: "50%",
    },
    // 是否显示遮罩层
    modal: {
      type: Boolean,
      default: true,
    },
    // 是否点击遮罩层关闭弹窗
    closeOnClickModal: {
      type: Boolean,
      default: true,
    },
    // 是否按ESC关闭弹窗
    closeOnPressEscape: {
      type: Boolean,
      default: true,
    },
    // 关闭时销毁弹窗内容
    destroyOnClose: {
      type: Boolean,
      default: false,
    },
    // 是否显示底部按钮栏
    showFooter: {
      type: Boolean,
      default: true,
    },
    // 确认按钮文字（自定义footer时无效）
    confirmText: {
      type: String,
      default: "确认",
    },
    // 取消按钮文字（自定义footer时无效）
    cancelText: {
      type: String,
      default: "取消",
    },
  },
  methods: {
    // 关闭弹窗（触发父组件事件）
    handleClose() {
      this.$emit("close");
      this.$emit("update:visible", false);
    },
    // 打开弹窗（触发父组件事件）
    handleOpen() {
      this.$emit("open");
    },
    // 取消按钮点击
    handleCancel() {
      this.$emit("cancel");
      this.handleClose();
    },
    // 确认按钮点击
    handleConfirm() {
      this.$emit("confirm");
      this.handleClose();
    },
  },
};
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>