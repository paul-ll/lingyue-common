/**
 * 定义QueryString类
 */
class QueryString {
    /**
     * QueryString类构造函数
     */
    constructor() {
        /**
         * 问题描述：第一次进入K线界面，图表不出现
         * 问题原因：queryString返回的是实例化后的对象，而这个包是在页面启动时就加载了（_queryObj保存的是首页的query），
         *          当点击K线时，通过路由进行跳转，但_queryObj并未更新，K线组件通过这个包拿到的还是首页的query对象
         * 解决方案：记录当前地址，获取queryObj时，判断当前地址与转换query时的地址是否一致，不一致，则重新转换，并保存
         */
        // 为了让lib能够在nodejs里使用（如果import完整的包，会引用这个自动实例化的类），因为nodejs环境下没有window对象，所以做了一个判断
        this.search = this.getLocationSearch();
        var _queryObj = this.parse();
        this.getQuery = () => {
            const search = this.getLocationSearch();
            if (this.search !== search) {
                this.search = search;
                _queryObj = this.parse();
            }
            return _queryObj;
        };
    }

    /**
     * 获取地址栏参数
     * @returns {String} 返回参数内容
     */
    getLocationSearch() {
        if (typeof window === 'undefined') {
            return '';
        }

        return window.location.search;
    }

    /**
     * 将form表单序列化后的字符串转换成对象，如果未提供参数，则使用window.location.search作为参数
     * @param {String} param 要转换的参数
     * @returns {Object} 返回转换后的对象
     */
    parse(param) {
        if (typeof param !== 'string') {
            param = this.getLocationSearch().slice(1);
        }
        const params = param.split('&');
        const paramObj = {};
        params.forEach(param => {
            const oneGroupParams = param.split('=');
            paramObj[oneGroupParams[0]] = oneGroupParams[1];
        });
        return paramObj;
    }

    /**
     * 将指定的对象序列化成字符串
     * @param {Object} param 要序列化的对象
     * @returns {String} 返回序列化后的字符串
     */
    stringify(param) {
        const params = [];
        Object.keys(param).forEach(key => {
            params.push(`${key}=${param[key]}`);
        });
        return params.join('&');
    }
}

export default new QueryString();
