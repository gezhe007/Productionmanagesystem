# 生产管理系统 (Production Manage System)

一个基于 Vue 2 + Element UI 的货架商品管理工具，支持多货架、商品分类、批次管理、保质期预警、补货建议等功能。所有数据均存储在浏览器本地（localStorage），无需后端服务，开箱即用。

[![Vue](https://img.shields.io/badge/Vue-2.6.11-brightgreen)](https://vuejs.org/)
[![Element UI](https://img.shields.io/badge/Element--UI-2.15.14-blue)](https://element.eleme.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 特性

- 🗂️ **货架管理**：创建/编辑/删除货架，管理每个货架上的商品及最大容量
- 📦 **商品管理**：添加/修改/删除商品，关联分类，设定标准保质期（天/月/年）
- 🏷️ **分类管理**：自定义商品分类，支持增删改
- ⚠️ **保质期预警**：根据生产日期和保质期自动计算过期日期，按设定阈值（如 7 天）提醒临期/过期商品
- 🔄 **补货建议**：自动计算各商品缺货数量，支持分批添加批次，预览补货后库存是否超限
- 💾 **本地持久化**：所有数据保存于浏览器 `localStorage`，刷新页面不丢失
- 📱 **移动端友好**：底部导航栏 + 自适应布局，操作方便

---

## 🛠️ 技术栈

| 层次         | 技术                                      |
| ------------ | ----------------------------------------- |
| 前端框架     | Vue 2 (2.6.11)                            |
| UI 组件库    | Element UI (2.15.14)                      |
| 状态管理     | Vuex (3.6.2)                              |
| 路由管理     | Vue Router (3.2.0)                        |
| 数据持久化   | localStorage（封装于 `utils/storage.js`） |
| CSS 预处理器 | Sass                                      |
| 构建工具     | Vue CLI 4.5.19                            |

---

## 🚀 快速开始

### 环境要求
- Node.js (建议 12.x 或 14.x)
- npm 或 yarn

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/你的用户名/productionmanagesystem.git
cd productionmanagesystem

# 安装依赖
npm install