import { ContentType } from './Enum';
import axios from 'axios';
import WXHttpRequest from './WXHttpRequest';

/**
 * 根据当前运行环境生成相应的发送Http请求对象
 */
export default class HttpRequest {
    /**
     * 根据当前运行环境生成相应的发送Http请求对象HttpRequest类构造函数
     * @param {String} contentType 发送形式，默认form表单（json、form、formData）
     */
    constructor(contentType) {
        // 为了兼容以前发布的版本，构造函数的参数仍然是String，所以需要用ContentType转换一下
        // 因为枚举值是大写，所以需要统一转换成大写
        contentType = contentType.toUpperCase();
        this.contentType = ContentType[contentType];
        this.request = null;
        this.cancelFun = () => {}; // 只有在h5页面有效
        this.cancelToken = '';
        // 是否是微信小程序
        this.isMiniApp =
            typeof wx === 'object' &&
            typeof wx.canIUse === 'function' &&
            wx.canIUse('request') &&
            typeof wx.request === 'function';

        if (this.isMiniApp) {
            this.request = new WXHttpRequest();
        } else {
            // 设置CancelToken并实例化axios对象
            const cancelToken = new axios.CancelToken(fnCancel => {
                this.cancelFun = fnCancel;
            });
            this.request = axios.create({
                cancelToken
            });

            this.request.interceptors.request.use(config => {
                const parameter = config.data;
                if (typeof parameter !== 'object' || !parameter) {
                    return config;
                }

                config.data = this.processRequestParam(parameter, config.headers['Content-Type']);

                return config;
            });

            // 附加的参数是地址栏？后面，所以参数要放到config.params里
            const getFun = this.request.get;
            this.request.get = (url, param) => {
                return getFun.call(this.request, url, { params: param });
            };
            const deleteFun = this.request.delete;
            this.request.delete = (url, param) => {
                return deleteFun.call(this.request, url, { params: param });
            };
        }
    }

    /**
     * 处理请求参数
     * @param {Object} parameter 请求参数
     * @param {Enum<ContentType>} headersContentType headers中临时设置的Content-Type
     * @returns {Object} 返回处理后的参数
     */
    processRequestParam(parameter, headersContentType) {
        // 实现了 FormData 接口的对象可以直接在for...of结构中使用，而不需要调用parameter.entries()方法
        let entries = parameter;
        const isFormDataType = parameter.constructor === FormData;
        if (!isFormDataType) {
            entries = Object.entries(parameter);
        }

        const newParam = Array.isArray(parameter) ? [] : {};
        const specialParams = {};
        for (const [key, value] of entries) {
            // 文件类型因为不是值类型会被序列化没了，所以先记录下来序列化完后，再还原回来
            if (value.constructor === File) {
                specialParams[key] = value;
            } else {
                newParam[key] = value;
            }
        }
        // 利用JSON.stringify去掉undefined和function类型的值
        parameter = JSON.parse(JSON.stringify(newParam));
        // 还原特殊参数
        Object.keys(specialParams).forEach(key => {
            parameter[key] = specialParams[key];
        });

        /**
         * 如果发送请求是FORM表单，Axios不会对FORM表单的请求参数进行转换，直接转换成FORM表单格式即可。
         * 不是FORM表单的话，再判断原有参数类型是不是FormData，如果是，还需要将JSON转换成FormData
         */
        if ((headersContentType || this.contentType) === ContentType.FORM) {
            const params = [];
            Object.keys(parameter).forEach(key => {
                const value = parameter[key];
                params.push(`${key}=${value}`);
            });
            parameter = params.join('&');
        } else if (isFormDataType) {
            const formDataParam = new FormData();
            Object.keys(parameter).forEach(key => formDataParam.append(key, parameter[key]));
            parameter = formDataParam;
        }

        return parameter;
    }

    /**
     * 判断是否是手动取消导致请求出错
     * @param {Object} error 取消出错对象
     * @return {Boolean} 返回是否是手动取消导致请求出错
     */
    static isCancel(error) {
        if (this.isMiniApp) {
            return false;
        }
        return axios.isCancel(error);
    }
}
