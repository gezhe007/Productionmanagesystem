/**
 * 通用工具函数库
 * 包含：ID生成、日期计算、数据筛选、表单验证、库存计算等功能
 */

/**
 * 生成唯一ID
 * @param {string} prefix ID前缀（默认：id）
 * @returns {string} 带时间戳和随机数的唯一ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * 根据生产日期、保质期和单位计算过期日期
 * @param {string} produceDate 生产日期（YYYY-MM-DD）
 * @param {number} period 保质期时长
 * @param {string} unit 保质期单位（day/month/year）
 * @returns {string} 过期日期（YYYY-MM-DD）| 空字符串（参数无效时）
 */
export function calculateExpireDate(produceDate, period, unit) {
  // 入参校验
  if (!produceDate || isNaN(period) || period <= 0 || !['day', 'month', 'year'].includes(unit)) {
    console.warn('计算过期日期失败：参数无效', { produceDate, period, unit });
    return '';
  }

  const produceDateObj = new Date(produceDate);
  // 校验日期有效性
  if (isNaN(produceDateObj.getTime())) {
    console.warn('计算过期日期失败：生产日期格式错误', produceDate);
    return '';
  }

  const expireDateObj = new Date(produceDateObj);
  switch (unit) {
    case 'day':
      expireDateObj.setDate(produceDateObj.getDate() + period);
      break;
    case 'month':
      expireDateObj.setMonth(produceDateObj.getMonth() + period);
      break;
    case 'year':
      expireDateObj.setFullYear(produceDateObj.getFullYear() + period);
      break;
  }

  return expireDateObj.toISOString().split('T')[0];
}

/**
 * 获取指定货架上的商品列表（关联商品详情）
 * @param {string} shelf 货架名称
 * @param {array} shelfProducts 货架-商品关联列表
 * @param {array} products 商品主列表
 * @returns {array} 包含商品详情和货架最大容量的列表
 */
export function getProductsInShelf(shelf, shelfProducts, products) {
  // 入参校验
  if (!shelf || !Array.isArray(shelfProducts) || !Array.isArray(products)) {
    return [];
  }

  return shelfProducts
    .filter(sp => sp.shelf === shelf)
    .map(sp => {
      const product = products.find(p => p.id === sp.productId);
      return product ? { ...product, shelfMax: sp.shelfMax || sp.max || 10 } : null;
    })
    .filter(p => p); // 过滤掉null值
}

/**
 * 计算补货后的库存总量
 * @param {string} shelf 货架名称
 * @param {string} productId 商品ID
 * @param {number} addQty 补货数量
 * @param {array} shelfBatches 批次列表
 * @returns {number} 补货后的总库存
 */
export function calculateAfterReplenishQty(shelf, productId, addQty, shelfBatches) {
  // 入参校验
  if (!shelf || !productId || !Array.isArray(shelfBatches)) {
    return 0;
  }

  const currentQty = shelfBatches
    .filter(b => b.shelf === shelf && b.productId === productId)
    .reduce((sum, b) => sum + (b.qty || 0), 0);

  return currentQty + Number(addQty || 0);
}

/**
 * 通用表单验证函数
 * @param {object} fields 待验证的字段对象 { 字段名: 字段值 }
 * @returns {object} 验证结果 { valid: boolean, message: string }
 */
export function validateForm(fields) {
  // 入参校验
  if (typeof fields !== 'object' || fields === null) {
    return { valid: false, message: '验证字段格式错误' };
  }

  for (const [key, value] of Object.entries(fields)) {
    // 空值校验
    if (value === undefined || value === null || value === '') {
      return { valid: false, message: `请填写${key}` };
    }
    // 数值校验（需大于0）
    if (typeof value === 'number' && value <= 0) {
      return { valid: false, message: `${key}必须大于0` };
    }
    // 字符串去空格后校验
    if (typeof value === 'string' && value.trim() === '') {
      return { valid: false, message: `请填写${key}` };
    }
  }

  return { valid: true, message: '' };
}

/**
 * 获取批次状态（正常/临期/已过期）
 * @param {string} expireDateStr 过期日期字符串（YYYY-MM-DD）
 * @param {number} threshold 临期阈值（天，默认30）
 * @returns {object} 状态对象 { cls: 'success/warning/danger', text: '状态文本' }
 */
export function getBatchStatus(expireDateStr, threshold = 30) {
  // 入参校验
  if (!expireDateStr) {
    return { cls: 'danger', text: '日期无效' };
  }

  const expireDate = new Date(expireDateStr);
  // 日期格式校验
  if (isNaN(expireDate.getTime())) {
    return { cls: 'danger', text: '日期格式错误' };
  }

  const now = new Date();
  const diffTime = expireDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { cls: 'danger', text: '已过期' };
  } else if (diffDays <= threshold) {
    return { cls: 'warning', text: `临期(${diffDays}天)` };
  } else {
    return { cls: 'success', text: '正常' };
  }
}

/**
 * 计算补货数量（最大容量 - 当前库存）
 * @param {string} shelf 货架名称
 * @param {string} productId 商品ID
 * @param {array} shelfProducts 货架-商品关联列表
 * @param {array} shelfBatches 批次列表
 * @returns {number} 建议补货数量（最小为0）
 */
export function calculateReplenishQty(shelf, productId, shelfProducts, shelfBatches) {
  // 入参校验
  if (!shelf || !productId || !Array.isArray(shelfProducts) || !Array.isArray(shelfBatches)) {
    return 0;
  }

  // 获取商品最大容量（兼容shelfMax和max字段）
  const shelfProduct = shelfProducts.find(sp => sp.shelf === shelf && sp.productId === productId);
  if (!shelfProduct) return 0;
  const maxQty = shelfProduct.shelfMax || shelfProduct.max || 10;

  // 计算当前总库存
  const totalQty = shelfBatches
    .filter(b => b.shelf === shelf && b.productId === productId)
    .reduce((sum, b) => sum + (b.qty || 0), 0);

  // 补货数量 = 最大容量 - 当前库存（最小为0）
  return Math.max(0, maxQty - totalQty);
}