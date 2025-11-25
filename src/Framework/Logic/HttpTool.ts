import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as qs from "querystring";
import { core } from "../Core/Core";
import { gLog } from "./Log";

export class HttpTool
{
    protected _debug=false
    get debug()
    {
        return this._debug
    }
    set debug(value)
    {
        this._debug=value
    }


    get(options_url: AxiosRequestConfig | string): Promise<{ error: any, response: AxiosResponse | null, body: any, originbody: any }> {
        const time = Date.now()
        let config: AxiosRequestConfig
        if (core.isString(options_url)) {
            config = { url: options_url as string, method: 'GET' }
        } else {
            config = { ...(options_url as AxiosRequestConfig), method: 'GET' }
        }

        // Support legacy qs/form style fields passed in config
        if ((config as any).qs && core.isObject((config as any).qs)) {
            const q = qs.stringify((config as any).qs)
            config.url = config.url + (config.url.indexOf('?') === -1 ? '?' + q : '&' + q)
        }
        if ((config as any).form && core.isObject((config as any).form)) {
            config.headers = { ...(config.headers||{}), 'Content-Type': 'application/x-www-form-urlencoded' }
            config.data = qs.stringify((config as any).form)
        } else if ((config as any).json) {
            config.data = (config as any).json
        } else if ((config as any).body) {
            config.data = (config as any).body
        }

        if (this._debug) {
            gLog.info("prepare get:" + config.url)
        }

        return axios(config).then(resp => {
            let originbody = resp.data
            let body = originbody
            if (core.isString(originbody)) {
                try {
                    body = JSON.parse(originbody as string)
                } catch (e) {
                    try { body = qs.parse(originbody as string) } catch (e2) { body = originbody }
                }
            }
            if (this._debug) {
                gLog.info({ dttime: (Date.now() - time) + "ms", url: config.url, originbody })
            }
            return { error: null, response: resp, body, originbody }
        }).catch(err => {
            const resp = err.response || null
            let originbody = resp ? resp.data : null
            let body = originbody
            if (core.isString(originbody)) {
                try { body = JSON.parse(originbody as string) } catch (e) { try { body = qs.parse(originbody as string) } catch (e2) { body = originbody } }
            }
            gLog.error("get:" + config.url)
            gLog.error(err)
            if (this._debug) {
                gLog.info({ dttime: (Date.now() - time) + "ms", url: config.url, originbody })
            }
            return { error: err, response: resp, body, originbody }
        })
    }

    post(options_url: AxiosRequestConfig | string): Promise<{ error: any, response: AxiosResponse | null, body: any, originbody: any }> {
        const time = Date.now()
        let config: AxiosRequestConfig
        if (core.isString(options_url)) {
            config = { url: options_url as string, method: 'POST' }
        } else {
            config = { ...(options_url as AxiosRequestConfig), method: 'POST' }
        }

        // Legacy fields mapping
        if ((config as any).qs && core.isObject((config as any).qs)) {
            const q = qs.stringify((config as any).qs)
            config.url = config.url + (config.url.indexOf('?') === -1 ? '?' + q : '&' + q)
        }
        if ((config as any).formData && core.isObject((config as any).formData)) {
            // If user wants multipart they should provide FormData or appropriate headers; keep raw assignment
            config.data = (config as any).formData
        } else if ((config as any).form && core.isObject((config as any).form)) {
            config.headers = { ...(config.headers||{}), 'Content-Type': 'application/x-www-form-urlencoded' }
            config.data = qs.stringify((config as any).form)
        } else if ((config as any).json) {
            config.data = (config as any).json
        } else if ((config as any).body) {
            config.data = (config as any).body
        }

        if (this._debug) {
            gLog.info("prepare post:" + config.url)
            gLog.info("prepare post data:" + JSON.stringify(config.data))
        }

        return axios(config).then(resp => {
            let originbody = resp.data
            let body = originbody
            if (core.isString(originbody)) {
                try { body = JSON.parse(originbody as string) } catch (e) { try { body = qs.parse(originbody as string) } catch (e2) { body = originbody } }
            }
            if (this._debug) {
                gLog.info({ dttime: (Date.now() - time) + "ms", url: config.url, originbody })
            }
            return { error: null, response: resp, body, originbody }
        }).catch(err => {
            const resp = err.response || null
            let originbody = resp ? resp.data : null
            let body = originbody
            if (core.isString(originbody)) {
                try { body = JSON.parse(originbody as string) } catch (e) { try { body = qs.parse(originbody as string) } catch (e2) { body = originbody } }
            }
            gLog.error("post:" + config.url)
            gLog.error(err)
            if (this._debug) {
                gLog.info({ dttime: (Date.now() - time) + "ms", url: config.url, originbody })
            }
            return { error: err, response: resp, body, originbody }
        })
    }
}

export let gHttpTool = new HttpTool()