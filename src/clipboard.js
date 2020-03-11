/**
 * 剪切板操作
 * @param {Object} value 要放到剪切板里的值
 * @param {String} action 剪切板操作（copy：复制——默认值，cut：剪切）
 * @returns {Boolean} 返回是否操作成功
 */
export default (value, action) => {
    if (typeof document.execCommand !== 'function') {
        return false;
    }

    switch (action) {
        case 'cut':
        case 'copy':
            break;
        default:
            action = 'copy';
            break;
    }

    const input = document.createElement('input');
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('value', value);
    input.style.position = 'absolute';
    input.style.top = '-10000px';
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(0, value.length);
    let result = false;
    try {
        result = document.execCommand(action);
    } catch (error) {}
    document.body.removeChild(input);
    return result;
};
