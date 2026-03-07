<template>
  <div id="app">
    <!-- 页面内容区域 -->
    <div class="page-container">
      <router-view />
    </div>

    <!-- 👇 底部菜单栏 -->
    <div class="tab-bar">
      <div
        class="tab-item"
        :class="{ active: $route.path === '/' }"
        @click="$router.push('/')"
      >
        <i class="el-icon-s-home"></i>
        <span>首页</span>
      </div>

      <div
        class="tab-item"
        :class="{ active: $route.path === '/shelf' }"
        @click="$router.push('/shelf')"
      >
        <i class="el-icon-menu"></i>
        <span>货架</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: $route.path === '/replenish' }"
        @click="$router.push('/replenish')"
      >
        <i class="el-icon-thumb"></i>
        <span>补货</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: $route.path === '/warehouse' }"
        @click="$router.push('/warehouse')"
      >
        <i class="el-icon-s-shop"></i>
        <span>仓库</span>
      </div>

      <div
        class="tab-item"
        :class="{ active: $route.path === '/category' }"
        @click="$router.push('/category')"
      >
        <i class="el-icon-s-data"></i>
        <span>分类</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  background: #f5f5f5; /* 柔化背景色 */
  flex-direction: column;
}

/* 页面内容：留出底部菜单空间，并增加内边距 */
.page-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 70px; /* 为底部菜单留出足够空间 */
}

/* 底部菜单 - 优化版 */
.tab-bar {
  height: 60px; /* 略微增高，提升舒适度 */
  background: rgba(255, 255, 255, 0.95); /* 轻微半透明毛玻璃效果 */
  backdrop-filter: blur(10px); /* 背景模糊，现代感 */
  border-top: none; /* 移除顶部边框，用阴影代替 */
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08); /* 向上阴影，增加层次 */
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  border-radius: 20px 20px 0 0; /* 顶部圆角，更柔和 */
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px; /* 稍微调大 */
  color: #8e8e93; /* 柔和的灰色 */
  cursor: pointer;
  transition: all 0.2s ease; /* 平滑过渡 */
  position: relative;
  padding: 8px 0 4px; /* 调整内边距 */
}

/* 激活状态 - 顶部彩色横条 + 图标变色 */
.tab-item.active {
  color: #409eff; /* Element 主题蓝 */
}

.tab-item.active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 25%;
  width: 50%;
  height: 3px;
  background: #409eff;
  border-radius: 0 0 3px 3px;
  transition: width 0.2s;
}

.tab-item i {
  font-size: 22px; /* 图标稍大 */
  margin-bottom: 2px;
  transition: transform 0.2s;
}

/* 悬停效果（非激活） */
.tab-item:not(.active):hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 点击微动效果 */
.tab-item:active i {
  transform: scale(0.9);
}

/* 移除点击时的灰色半透明蒙层（移动端默认行为） */
.tab-item {
  -webkit-tap-highlight-color: transparent;
}

/* 小屏幕适配：如果屏幕很窄，字号和图标可适当缩小 */
@media (max-width: 375px) {
  .tab-item {
    font-size: 11px;
  }
  .tab-item i {
    font-size: 20px;
  }
}
</style>