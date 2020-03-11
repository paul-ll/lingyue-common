/**
 * 微信小程序HttpRequest类定义
 */
export default class WXHttpRequest {
    /**
     * 微信小程序HttpRequest类构造函数
     */
    constructor() {
        // 仿照axios结构构建钩子函数，以便能够统一调用
        this.interceptors = {
            request: {},
            response: {}
        };
        this.defaults = {
            headers: {
                common: {
                    'Content-Type': 'application/json'
                }
            }
        };

        this.initInterceptors();

        this.initRequestMethods();
    }

    /**
     * 初始化钩子函数
     */
    initInterceptors() {
        // 不能使用箭头函数，因为this会被绑定为HttpRequest对象
        let use = function(success, fail) {
            this._hooks.push({
                success,
                fail
            });
        };
        this.interceptors.request = {
            _hooks: [],
            use
        };
        this.interceptors.response = {
            _hooks: [],
            use
        };
    }

    /**
     * 初始化请求方法
     */
    initRequestMethods() {
        // 微信小程序不支持patch
        ['post', 'delete', 'put', 'get'].forEach(key => {
            this[key] = (url, param) => {
                let config = {
                    url,
                    header: this.defaults.headers.common,
                    data: param,
                    method: key.toUpperCase()
                };

                this.interceptors.request._hooks.forEach(hook => {
                    config = hook.success(config);
                });

                let promise = new Promise((resolve, reject) => {
                    config.success = response => {
                        this.interceptors.response._hooks.forEach(hook => {
                            response = hook.success(response);
                        });
                        resolve(response);
                    };
                    config.fail = error => {
                        this.interceptors.response._hooks.forEach(hook => {
                            error = hook.fail(error);
                        });
                        reject(error);
                    };

                    wx.request(config);
                });
                return promise;
            };
        });
    }
}
