import * as Express from 'express';
import * as fs from "fs";
import * as mime from "mime";
import { GLog } from "../../Logic/Log";
import { WebServerConfig } from "../../Config/FrameworkConfig";

export class Response
{
    protected _res:Express.Response=null
    protected _cookie_prefix=""
    protected _cfg:WebServerConfig=null
    protected _create_time=-1
    get baseRes()
    {
        return this._res
    }
    constructor(res:Express.Response,cfg:WebServerConfig)
    {
        this._cfg = cfg
        this._res = res
        this._cookie_prefix = this._cfg.cookie.prefix
        this._init()
    }
    protected _init()
    {
        this._create_time=Date.now()
    }
    /**
     * 
     * @param key 
     * @param value 
     * @param time 秒
     */
    setCookie(key:string, value, time?)
    {
        key = this._cookie_prefix + key
        if(time)
        {
            this._res.cookie(key,value,{maxAge:time*1000,httpOnly:true})
        }
        else
        {
            this._res.cookie(key,value,{httpOnly:true})
        }
    }
    clearCookie(key:string)
    {
        this.setCookie(key,"",-1000)
    }
    redirect(path:string)
    {
        this._res.writeHead(302, { 'Location': path });
        this._res.end()
    }
    render(data:any)
    {
        return this._res.send(data)
    }
    renderJson(data)
    {
        this.debugInfo(data)
        return this._res.json(data)
    }
    renderJson404()
    {
        return this._res.status(404).json();
    }
    renderJson500()
    {
        this.debugInfo("500")
        return this._res.status(500).json()
    }
    renderHtml(html:string)
    {
        return this._res.send(html||"")
    }
    render404(html?:string)
    {
        return this._res.status(404).send(html||"没找到该页面")
    }
    render500(html?:string)
    {
        return this._res.status(500).send(html||"服务器内部错误500")
    }
    renderOptions(method,origin)
    {
        this._res.sendStatus(204)
    }
    renderFile(fullPath:string)
    {
        this._res.sendFile(fullPath)
    }
    downloadFile(fullPath:string)
    {
        let fileName = ""
        let quote_index = fullPath.indexOf("/")
        if(quote_index>0)
        {
            fileName = fullPath.substring(quote_index+1)
        }

        fs.stat(fullPath,(err,stats)=>
        {
            if(!stats||stats.isDirectory())
            {
                return this.render404("")
            }
            let size = stats.size
            var f = fs.createReadStream(fullPath)
            this._res.writeHead(200, {
                'Content-Type': mime.getType(fullPath)||'application/octet-stream',
                'Content-Disposition': 'attachment; filename=' + fileName,
                'Content-Length': size
            });
            f.pipe(this._res)
        })
    }
    render304()
    {
        this._res.sendStatus(304)
    }
    debugInfo(data)
    {
        if(!this._cfg.debug)
        {
            return
        }
        GLog.info("dttime:"+(Date.now()-this._create_time).toLocaleString()+"ms")
        GLog.info(data)
    }
}