/**
 * 根据生产日期、保质期和单位计算过期日期
 * @param {string} produceDate 生产日期（YYYY-MM-DD）
 * @param {number} period 保质期时长
 * @param {string} unit 保质期单位（天/月/年）
 * @returns {string} 过期日期（YYYY-MM-DD）| 空字符串（参数无效时）
 */
export function calculateExpireDate(produceDate, period, unit) {
  // 入参校验
  if (!produceDate || isNaN(period) || period <= 0 || !['天', '月', '年'].includes(unit)) {
    console.warn('计算过期日期失败：参数无效', { produceDate, period, unit });
    return '';
  }

  // 手动解析 YYYY-MM-DD 为本地时间数值
  const parts = produceDate.split('-');
  if (parts.length !== 3) {
    console.warn('计算过期日期失败：生产日期格式错误，应为 YYYY-MM-DD', produceDate);
    return '';
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);

  // 创建本地日期对象（月份从 0 开始）
  const produceDateObj = new Date(year, month - 1, day);
  if (isNaN(produceDateObj.getTime())) {
    console.warn('计算过期日期失败：生产日期无效', produceDate);
    return '';
  }

  const expireDateObj = new Date(produceDateObj);
  switch (unit) {
    case '天':
      expireDateObj.setDate(day + period);
      break;
    case '月':
      // 方案一：使用 JS 自动溢出（如 1月31日+1月 => 3月2日）
      expireDateObj.setMonth(month - 1 + period);

      // 方案二：业务期望的“对应日期”（如果不存在则取当月最后一天）
      // 下面是一个简单的实现，可根据需要选用
      /*
      const targetMonth = month - 1 + period;
      const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(day, lastDayOfTargetMonth);
      expireDateObj.setFullYear(year + Math.floor(targetMonth / 12), targetMonth % 12, targetDay);
      */
      break;
    case '年':
      expireDateObj.setFullYear(year + period);
      break;
  }

  // 手动格式化 YYYY-MM-DD（基于本地时间）
  const y = expireDateObj.getFullYear();
  const m = String(expireDateObj.getMonth() + 1).padStart(2, '0');
  const d = String(expireDateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function exportLocalStorage() {
  // 1. 创建一个对象，用来存放所有 localStorage 的数据
  const allData = {};

  // 2. 遍历 localStorage，将所有键值对放入 allData 对象
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // 尝试将值解析为JSON，如果解析失败（比如普通字符串），就保留原值
    try {
      allData[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      allData[key] = localStorage.getItem(key);
    }
  }

  // 3. 将数据对象转换成格式化的 JSON 字符串
  const dataStr = JSON.stringify(allData, null, 2); // 这里的 null 和 2 是为了让导出的 JSON 文件格式更美观

  // 4. 创建一个 Blob 对象，模拟成一个文件
  const blob = new Blob([dataStr], { type: 'application/json' });

  // 5. 创建一个临时的下载链接并点击它
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `localStorage-backup-${new Date().toISOString().slice(0, 10)}.json`; // 文件名包含当前日期
  document.body.appendChild(link);
  link.click();

  // 6. 清理工作：移除链接并释放内存
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ localStorage 数据已导出！');
}
export function importLocalStorage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);

        if (typeof importedData !== 'object' || importedData === null) {
          throw new Error('文件格式错误：根数据必须是一个对象');
        }

        localStorage.clear();
        for (const [key, value] of Object.entries(importedData)) {
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            localStorage.setItem(key, String(value));
          }
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
/**
 * 计算补货后的库存总量
 * @param {string} shelf 货架名称
 * @param {string} productId 商品ID
 * @param {number} addQty 补货数量
 * @param {array} shelfBatches 批次列表
 * @returns {number} 补货后的总库存
 */
export function calculateAfterReplenishQty(shelfId, productId, addQty, shelfBatches) {
  // 入参校验
  if (!shelfId || !productId || !Array.isArray(shelfBatches)) {
    return 0;
  }

  const currentQty = shelfBatches
    .filter(b => b.shelfId === shelf && b.productId === productId)
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
    .reduce((sum, b) => sum + (b.batchnum || 0), 0);

  // 补货数量 = 最大容量 - 当前库存（最小为0）
  return Math.max(0, maxQty - totalQty);
}
export function calculateId(datas) {
  return datas.length > 0
    ? datas[datas.length - 1].id + 1
    : 1;
}