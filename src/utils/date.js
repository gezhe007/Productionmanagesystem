// 获取批次状态
export const getBatchStatus = (expireDateStr, threshold) => {
    const now = new Date();
    const expireDate = new Date(expireDateStr);

    // 处理无效日期
    if (isNaN(expireDate.getTime())) {
        return { text: '日期无效', cls: 'red', days: -999 };
    }

    const leftDays = Math.ceil((expireDate - now) / 86400000);

    if (leftDays <= 0) return { text: `已过期(${Math.abs(leftDays)}天)`, cls: 'danger', days: leftDays };
    if (leftDays <= threshold) return { text: `即将过期(剩${leftDays}天)`, cls: 'warning', days: leftDays };
    return { text: `正常(剩${leftDays}天)`, cls: 'success', days: leftDays };
};

// 生成唯一ID
export const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// 计算补货数量
export const calculateReplenishQty = (shelf, productId, shelfProducts, shelfBatches) => {
    const batches = shelfBatches.filter(b => b.shelf === shelf && b.productId === productId);
    const currentQty = batches.reduce((sum, b) => sum + b.qty, 0);
    const shelfProduct = shelfProducts.find(sp => sp.shelf === shelf && sp.productId === productId);
    const maxQty = shelfProduct ? shelfProduct.max : 0;
    return Math.max(0, maxQty - currentQty);
};