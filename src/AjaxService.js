import HttpRequest from './HttpRequest';

const _host = typeof __HOST__ === 'string' ? __HOST__ : '';
/**
 * 定义AjaxService类
 */
class AjaxService {
    /**
     * AjaxService类构造函数
     * @param {String} url RESTful格式的请求地址（默认值：__HOST__ + '{/api}{/module}{/action}{/id}'）
     * @param {String} contentType 发送形式，默认form表单（json、form）
     * @param {String} host 请求服务器域名
     */
    constructor(url, contentType = 'form', host = _host) {
        this.requestInstance = null; // HttpRequest实例
        this.cancel = () => {}; // 想取消ajax请求时，调用此方法，只有在h5页面可以取消
        this.originalUrl = url || host + '{/api}{/version}{/module}{/action}{/id}'; // +运算符的优先级要比||运算符优先级高
        this.sections = []; // RESTful格式地址中动态部分

        this.init(contentType);
    }

    /**
     * 初始化AjaxService
     * @param {String} contentType 请求Header中的Content-Type
     */
    init(contentType) {
        this.requestInstance = new HttpRequest(contentType).request;
        this.cancel = this.requestInstance.cancelFun;

        // 设置Content-Type
        this.setHeader(
            'Content-Type',
            contentType === 'json' ? 'application/json' : 'application/x-www-form-urlencoded'
        );

        // 注入response钩子函数
        this.injectResponseHook(
            response => {
                return response.data;
            },
            error => {
                if (HttpRequest.isCancel(error)) {
                    // 取消ajax请求
                    return {
                        type: 'cancel',
                        body: error
                    };
                }

                if (error.request) {
                    // ajax请求错误
                    return {
                        type: 'request',
                        body: error.request
                    };
                }

                if (error.response) {
                    // ajax响应错误
                    return {
                        type: 'response',
                        body: error.response
                    };
                }

                return {
                    type: 'other',
                    body: error
                };
            }
        );

        // 分解原始RESTful格式地址
        let reg = /\{\/([^}]+)\}/g;
        // 因为str.match方法返回的结果只有匹配的内容，没有每一个匹配中正则表达式小括号内的内容
        // 所以使用reg.exec方法。
        while (reg.lastIndex < this.originalUrl.length) {
            let section = reg.exec(this.originalUrl);
            if (!section) {
                break;
            }
            this.sections.push(section);
        }

        this.initHTTPMethod();
    }

    /**
     * 设置指定请求类型附加的header，如果未指定类型，则默认全部请求都附加指定header
     * @param {String} key header的key
     * @param {String} value header的value
     * @param {String} requestType 请求类型
     */
    setHeader(key, value, requestType) {
        if (key && value) {
            requestType = requestType || 'common';
            let header = this.requestInstance.defaults.headers[requestType];
            header[key] = value;
        }
    }

    /**
     * 注入请求钩子函数
     * @param {Function} hookFunction 请求钩子函数
     */
    injectRequestHook(hookFunction) {
        if (typeof hookFunction === 'function') {
            this.requestInstance.interceptors.request.use(config => {
                return hookFunction(config);
            });
        }
    }

    /**
     * 注入响应钩子函数
     * @param {Function} resolveHook 成功钩子函数
     * @param {Function} rejectHook 失败钩子函数
     */
    injectResponseHook(resolveHook, rejectHook) {
        this.requestInstance.interceptors.response.use(
            response => {
                if (typeof resolveHook === 'function') {
                    let returnValue = resolveHook(response);
                    // 如果未返回值，则表示Ajax的钩子函数不需要返回内容
                    if (typeof returnValue !== 'undefined') {
                        return returnValue;
                    }
                } else {
                    return response;
                }
            },
            error => {
                if (typeof rejectHook === 'function') {
                    let returnValue = rejectHook(error);
                    // 如果未返回值，则表示Ajax的钩子函数不需要返回内容
                    if (typeof returnValue !== 'undefined') {
                        if (returnValue instanceof Promise) {
                            return returnValue;
                        }
                        return Promise.reject(returnValue);
                    }
                } else {
                    return Promise.reject(error);
                }
            }
        );
    }

    /**
     * 初始化方法
     */
    initHTTPMethod() {
        ['post', 'delete', 'put', 'patch', 'get'].forEach(key => {
            if (typeof this.requestInstance[key] === 'function') {
                /**
                 * 发送HTTP请求
                 * @param {Object} urlObj 请求地址对象
                 * @param {Object} param 请求参数
                 * @returns {Promise} 返回Promise对象
                 */
                this[key] = (urlObj, param) => this.requestInstance[key](this.urlMatch(urlObj), param);
            }
        });
    }

    /**
     * 将请求地址对象匹配到原始请求地址上
     * @param {Object} urlObj 请求地址对象
     * @returns {String} 返回匹配后的地址
     */
    urlMatch(urlObj) {
        let url = this.originalUrl;
        // 如果请求的方法里提供了host，则替换掉实例化时传递的服务器地址
        if (urlObj.hasOwnProperty('host')) {
            url = url.replace(/http[s]?:\/\/[^{]+/, urlObj.host);
        }
        this.sections.forEach(section => {
            let key = section[1];
            let value = urlObj.hasOwnProperty(key) ? urlObj[key] : this[key];
            if (value) {
                value = '/' + value;
            } else {
                value = '';
            }
            let reg = new RegExp(section[0]);
            url = url.replace(reg, value);
        });
        return url;
    }
}

export default AjaxService;
