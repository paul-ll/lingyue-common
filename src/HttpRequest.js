import axios from 'axios';
import WXHttpRequest from './WXHttpRequest';

/**
 * 根据当前运行环境生成相应的发送Http请求对象
 */
export default class HttpRequest {
    /**
     * 根据当前运行环境生成相应的发送Http请求对象HttpRequest类构造函数
     * @param {String} contentType 发送形式，默认form表单（json、form）
     */
    constructor(contentType) {
        this.contentType = contentType;
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
            let cancelToken = new axios.CancelToken(fnCancel => {
                this.cancelFun = fnCancel;
            });
            this.request = axios.create({
                cancelToken
            });

            /**
             * 因为Axios不会对form表单的请求参数进行转换，所以需要先转换成form表单形式
             */
            this.request.interceptors.request.use(config => {
                let parameter = config.data;
                if (typeof parameter !== 'object' || !parameter) {
                    return config;
                }

                // 利用JSON.stringify去掉undefined和function类型的值
                parameter = JSON.parse(JSON.stringify(parameter));

                // 根据不同的Content-Type调整请求参数格式
                switch (this.contentType) {
                    case 'json':
                        break;
                    case 'form':
                    default:
                        let params = [];
                        Object.keys(parameter).forEach(key => {
                            let value = parameter[key];
                            params.push(`${key}=${value}`);
                        });
                        parameter = params.join('&');
                        break;
                }

                config.data = parameter;

                return config;
            });

            // 附加的参数是地址栏？后面，所以参数要放到config.params里
            let getFun = this.request.get;
            this.request.get = (url, param) => {
                return getFun.call(this.request, url, { params: param });
            };
            let deleteFun = this.request.delete;
            this.request.delete = (url, param) => {
                return deleteFun.call(this.request, url, { params: param });
            };
        }
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
