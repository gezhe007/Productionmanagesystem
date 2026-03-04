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
  flex-direction: column;
}

/* 页面内容：占满除了底部菜单以外的所有高度 */
.page-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 50px; /* 防止内容被底部菜单挡住 */
}

/* 底部菜单 */
.tab-bar {
  height: 50px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.tab-item.active {
  color: #409eff;
}

.tab-item i {
  font-size: 20px;
  margin-bottom: 4px;
}
</style>