import * as Express from 'express';
import { URL } from 'url';
import { WebServerConfig } from "../../Config/FrameworkConfig";
import { core } from "../../Core/Core";
import { GLog } from "../../Logic/Log";

export class Request
{
    protected _req:Express.Request=null
    get baseReq()
    {
        return this._req
    }
    protected _cfg:WebServerConfig=null
    protected _post_cb:()=>void=null
    set onPost(value)
    {
        this._post_cb=value
    }
    protected _module=""
    get module()
    {
        return this._module
    }
    protected _controller=""
    get controller()
    {
        return this._controller
    }
    protected _action=""
    get action()
    {
        return this._action
    }
    protected _suffix=""
    get suffix()
    {
        return this._suffix
    }
    protected _file_url=null
    get fileUrl()
    {
        return this._file_url
    }
    protected _params=<any>{}
    get params()
    {
        var body = <any>(this._req.query||{})
        for(let k in body)
        {
            var v = body[k]
            if(!core.isString(v))
            {
                continue
            }
            if(parseInt(v)==v)
            {
                body[k]=parseInt(v)
            }
            else if(parseFloat(v)==v)
            {
                body[k]==parseFloat(v)
            }
        }
        return body
    }
    /**
     * 原始body字符串
     */
    get rawBody()
    {
        if(!this._req)
        {
            return ""
        }
        return this._req["rawBody"]||""
    }
    get postData()
    {
        var body = this._req.body||{}
        if(this._req.headers["content-type"]=="application/x-www-form-urlencoded")
        {
            for(let k in body)
            {
                body=k
                break
            }
        }
        if(core.isString(body))
        {
            try
            {
                body = JSON.parse(body)
            }
            catch(e)
            {
                GLog.error("post data--"+body+"--parse error")
                body = {}
            }
        }
        // 暂时去掉强制数值转换
        // //服务器会有一层空key的json解析
        // for(let k in body)
        // {
        //     var v = body[k]
        //     if(!core.isString(v))
        //     {
        //         continue
        //     }
        //     let intv = parseInt(v)
        //     if(intv==v)
        //     {
        //         body[k]=intv
        //     }
        //     else if(parseFloat(v)==v)
        //     {
        //         body[k]==parseFloat(v)
        //     }
        // }
        return body
    }
    get url()
    {
        return this._req.url
    }
    get root()
    {
        let root = this._req.headers.host
        if (root != "")
        {
            root = this._req.protocol+"://" + root
        }
        return root
    }
    get method()
    {
        return this._req.method
    }
    get headers()
    {
        return this._req.headers
    }
    get remoteHost()
    {
        let ips = this._req.headers['x-forwarded-for']
        let ip = ""
        if(core.isArray(ips))
        {
            ip = ips[0]
        }
        else 
        {
            ip = <string>ips
        }
        ip = ip ||
            this._req.connection.remoteAddress ||
            this._req.socket.remoteAddress ||
            this._req.ip||""
        
        ip = ip.replace("::ffff:","")
        return ip
    }
    constructor(req:Express.Request,cfg:WebServerConfig)
    {
        this._cfg = cfg
        this._req = req
        this._init()
    }
    getCookie(key:string)
    {
        let cookie_key = this._cfg.cookie.prefix + key
        if(!this._req.cookies)
        {
            return null
        }
        return this._req.cookies[cookie_key]
    }
    protected _init()
    {
        let method=this._req.method.toLowerCase()
        if(method!="get"&&method!="post")
        {
            return
        }
        let path = this._req.url
        //服务器根目录路径写法，链接转换
        let _i = path.lastIndexOf("~")
        if (_i >= 0)
        {
            path = path.substr(_i + 1)
        }
        //处理参数
        this._parseParams(path)
    }
    protected _addListener(event: string | symbol, listener: (...args: any[]) => void)
    {
        this._req.addListener(event, listener)
    }
    protected _parseParams (path:string)
    {
        this._module =this._cfg.routs.onlyModule||this._cfg.routs.defaults.module
        this._controller = this._cfg.routs.defaults.controller
        this._action = this._cfg.routs.defaults.action
        this._suffix = null
        this._file_url = null
        this._params = <any>{}
        if (path == "/")
        {
            return
        }
        let firstQuoteIndex = path.indexOf("?")
        let preQuoteStr=path
        if(firstQuoteIndex>0)
        {
            preQuoteStr = path.substring(0,firstQuoteIndex)
        }

        let lastDotIndex = preQuoteStr.lastIndexOf(".")
        if (lastDotIndex > 0)
        {
            let dotStr = preQuoteStr.substring(lastDotIndex + 1)
            this._suffix = dotStr
            this._file_url = preQuoteStr
            return
        }
        let quote_index = path.indexOf("?")
        if (quote_index >= 0)
        {
            let url = new URL(path)
            url.searchParams.forEach((value, name, searchParams) => {
                this._params[name]=value
            })
            path = path.substring(0, quote_index)
        }
        let params = path.split("/")
        let default_module = false
        if(this._cfg.routs.onlyModule)
        {
            default_module = true
        }
        if (params.length > 1 && params[1].length>0)
        {
            /**
             * 如果是only模式，那么就不支持controller和module相同，
             * 如果相同则认为是模块名，这样就可以同时支持，带模块的路径模式和非带模块的路径模式了
             */
            if(default_module
                &&params[1].toLowerCase()==this._cfg.routs.onlyModule.toLowerCase())
            {
                default_module = false
            }
            if(default_module)
            {
                this._controller = params[1]
            }
            else
            {
                this._module = params[1]
            }
        }
        if (params.length > 2 && params[2].length>0)
        {
            if(default_module)
            {
                this._action = params[2]
            }
            else
            {
                this._controller = params[2]
            }
        }
        if (params.length > 3 
            && params[3].length > 0
            && !default_module)
        {
            this._action = params[3]
        }
        this._params = this._params||{}
        return
    }
    debugInfo()
    {
        if(!this._cfg.debug)
        {
            return
        }
        let debuginfo =
        {
            module:this._module,
            controller:this._controller,
            action:this._action,
            suffix:this._suffix,
            file_url:this._file_url,
            params:this._params,
            post:this.postData,
            method:this._req.method.toLowerCase()
        }
        GLog.info(debuginfo)
    }
}
