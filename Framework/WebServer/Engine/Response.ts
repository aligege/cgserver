import * as Express from 'express';
import * as http from "http";
import * as fs from "fs";
import * as mime from "mime";
import { GLog } from "../../Logic/Log";
import { WebServerConfig } from "../../Config/FrameworkConfig";

export class Response
{
    protected _res:Express.Response=null
    protected _cookie_prefix=""
    protected _cfg:WebServerConfig=null
    constructor(res:Express.Response,cfg:WebServerConfig)
    {
        this._cfg = cfg
        this._res = res
        this._cookie_prefix = this._cfg.cookie.prefix
        this._init()
    }
    protected _init()
    {
    }
    /**
     * 
     * @param key 
     * @param value 
     * @param time 秒
     */
    setCookie(key, value, time?)
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
    clearCookie(key)
    {
        this.setCookie(key,"",-1000)
    }
    redirect(path)
    {
        this._res.writeHead(302, { 'Location': path });
        this._res.end()
    }
    renderJson(data,origin?:string | string[] | undefined)
    {
        this._res.json(data)
        this.debugInfo(data)
    }
    renderJson404(origin?:string | string[] | undefined)
    {
        this._res.status(404).json();
    }
    renderJson500(origin?:string | string[] | undefined)
    {
        this._res.status(500).json()
        this.debugInfo("500")
    }
    renderHtml(html:string)
    {
        this._res.send(html||"")
    }
    render404(html?:string)
    {
        this._res.status(404).send("没找到该页面")
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
        GLog.info(data,true)
    }
}