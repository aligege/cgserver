import * as Express from 'express';
import * as fs from "fs";
import * as mime from "mime";
import { WebServerConfig } from "../../../Config/FrameworkConfig";
import { gLog } from '../../../Logic/Log';

export class Response
{
    protected _res:Express.Response=null
    protected _cookie_prefix=""
    protected _cfg:WebServerConfig=null
    public debug=false
    get baseRes()
    {
        return this._res
    }
    constructor(res:Express.Response,cfg:WebServerConfig)
    {
        this._cfg = cfg
        this.debug = this._cfg.debug||false
        this._res = res
        this._cookie_prefix = this._cfg.cookie.prefix
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
    renderJson(data:any)
    {
        this.debugInfo(data)
        return this._res.json(data)
    }
    sendStatus(status:number)
    {
        this.debugInfo(status)
        this._res.sendStatus(status)
    }
    renderHtml(html:string)
    {
        return this._res.send(html||"")
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
                return this.sendStatus(404)
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
    debugInfo(data:any)
    {
        if(!this.debug)
        {
            return
        }
        gLog.info(data)
    }
}