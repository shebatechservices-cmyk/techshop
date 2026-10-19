const safeNum = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '' || v === 'null') return defaultVal;
    const n = Number(v);
    return isNaN(n) ? defaultVal : n;
};

const safeIntOrNull = (v) => {
    if (v === undefined || v === null || v === '' || v === 'null') return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
};

const safeNumOrNull = (v) => {
    if (v === undefined || v === null || v === '' || v === 'null') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
};

const safeStrOrNull = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' || s === 'null' ? null : s;
};

module.exports = {
    safeNum,
    safeIntOrNull,
    safeNumOrNull,
    safeStrOrNull,
};
