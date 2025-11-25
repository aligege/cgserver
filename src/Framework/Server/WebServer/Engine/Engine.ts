import { Response } from './Response';
import { Request } from './Request';
import { RazorJs } from './RazorJs';
import * as http from "http";
import * as https from "https";
import { WebServerConfig } from '../../../Config/FrameworkConfig';
import cors from "cors";
import Express from 'express';
import cookieParser from 'cookie-parser';
import { Config } from '../../../Config/Config';
import { gLog } from '../../../Logic/Log';
import { gCtrMgr } from './ControllerManager';
export class Engine
{
    protected _app = Express()
    get app()
    {
        return this._app
    }
    protected _cfg:WebServerConfig=null
    get cfg()
    {
        return this._cfg
    }
    protected _server:http.Server=null
    protected _razorJs:RazorJs=null
    protected _root_path=process.cwd()
    //停止服务器，暂时不接受任何请求
    protected _is_running=false
    get isrunning()
    {
        return this._is_running
    }
    constructor(cfg:WebServerConfig,razorJs:RazorJs)
    {
        this._cfg=cfg
        this._razorJs = razorJs
    }
    start()
    {
        let port = this._cfg.port
        //let https = require("https");
        let fs = require("fs");

        if(!port)
        {
            gLog.error(this._cfg)
            return
        }
        if(this._cfg.httpsOption)
        {

            this._cfg.httpsOption.key = fs.readFileSync(Config.rootDataDir+this._cfg.httpsOption.key)
            this._cfg.httpsOption.cert = fs.readFileSync(Config.rootDataDir+this._cfg.httpsOption.cert)
            https.createServer(this._cfg.httpsOption, this._app).listen(port,()=>{
                this._is_running=true
                gLog.info("Server("+this._cfg.web_name+") running at https://127.0.0.1:" + port + "/")
            });
        }
        else
        {
            http.createServer(this._app).listen(port,()=>
            {
                this._is_running=true
                gLog.info("Server("+this._cfg.web_name+") running at http://127.0.0.1:" + port + "/")
            });
        }

        this._app.use(cookieParser())
        this._app.use(Express.raw())
        this._app.use(Express.json({limit: '10mb',verify(req, res, buf, encoding) {
            req["rawBody"]=buf
        },}))
        this._app.use(Express.urlencoded({limit: '10mb', extended: false,verify(req, res, buf, encoding) {
            req["rawBody"]=buf
        },}))
        this._app.use((err, req, res, next)=>{
            if(err)
            {
                gLog.error(err)
            }
            next(err);
        })

        
        if(this._cfg.static)
        {
            for(let i=0;i<this._cfg.static.length;++i)
            {
                let item = this._cfg.static[i]
                this._app.use(item.route,Express.static(item.path))
            }
        }
        else
        {
            //默认
            this._app.use("/public",Express.static("./public"))
        }
        //处理跨域
        if(this._cfg.cors)
        {
            let origin:any = this._cfg.cors.origin||"*"
            if(this._cfg.cors.credentials==true&&origin=="*")
            {
                origin=(origin, callback)=>{
                    callback(null, true)
                }
            }
            this._app.use(cors({
                origin:origin,  //指定接收的地址，将localhost改成前端IP地址
                methods:this._cfg.cors.methods||'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  //指定接收的请求类型
                allowedHeaders:this._cfg.cors.allowedHeaders||['Content-Type'],  //指定header
                credentials:this._cfg.cors.credentials||false
            }))
        }
        this._app.all("*",(req,res)=>
        {
            let time = Date.now()
            this._onall(req,res).then(()=>
            {
                if(this._cfg.debug)
                {
                    let time_str = (Date.now()-time)+"ms"
                    gLog.info("["+time_str+"] "+req.method+" "+req.url)
                }
            }).catch((err)=>
            {
                res.sendStatus(500)
                let exreq=new Request(req,this._cfg)
                let info = exreq.getDebugInfo()
                info["tip"]="server error"
                gLog.error(info)
                gLog.error(err)
            })
        })
    }
    protected async _onall(_req:Express.Request,_res:Express.Response)
    {
        let httpinfo = this._preDoHttpInfo(_req,_res)
        if(!httpinfo)
        {
            return
        }
        await this._callCtrAction(httpinfo.action_name,httpinfo.req,httpinfo.res)
    }
    protected _method_preactions={
        "post":"on",
        "get":"show",
        "options":"onoptions",
        "head":"onhead"
    }
    /**
     * 预处理http请求信息
     * @param _req 
     * @param _res 
     * @returns 
     */
    protected _preDoHttpInfo(_req:Express.Request,_res:Express.Response)
    {
        let req=new Request(_req,this._cfg)
        let res=new Response(_res,this._cfg)

        //禁止访问
        if(!this._is_running)
        {
            res.sendStatus(403)
            return
        }
        let method=req.method.toLocaleLowerCase()
        let pre_action=this._method_preactions[method]
        if(!pre_action)
        {
            res.sendStatus(500)
            let info = req.getDebugInfo()
            info["tip"]="not support method:"+method
            gLog.error(info)
            return null
        }
        let action_name = gCtrMgr.getActionName(req.module,req.controller,pre_action+req.action)
        if(!action_name)
        {
            res.sendStatus(500)
            let info = req.getDebugInfo()
            info["tip"]="request has no action"
            gLog.error(info)
            return null
        }
        return {
            action_name:action_name,
            req:req,
            res:res
        }
    }
    protected async _callCtrAction(action_name:string,req:Request,res:Response)
    {
        let ctr = gCtrMgr.getStaticCtr(req.module,req.controller)
        let cls_ctr = null
        if(!ctr)
        {
            cls_ctr = gCtrMgr.getClass(req.module,req.controller)
        }
        
        if(!ctr)
        {
            ctr = new cls_ctr(req,res,this)
            await ctr.init()
        }
        else
        {
            ctr.initStatic(req,res,this)
        }
        await ctr[action_name].call(ctr)
    }
    pause()
    {
        if(!this._is_running)
        {
            gLog.error("webserver has paused:"+this._cfg.web_name)
            return
        }
        this._is_running=false
        gLog.info("webserver paused:"+this._cfg.web_name)
    }
    resume()
    {
        if(this._is_running)
        {
            gLog.error("webserver is running:"+this._cfg.web_name)
            return
        }
        this._is_running=true
        gLog.info("webserver resumed:"+this._cfg.web_name)
    }
    getRenderHtml(req:Request,res:Response, datas:any)
    {
        let rootview = this._cfg.rootview||"view"
        if(!rootview.endsWith("/"))
        {
            rootview+="/"
        }
        let tmpl = rootview + req.controller.toLowerCase() + "/" + req.action.toLowerCase()
        let html = this._getRenderHtml(req, res, tmpl, datas)
        return html
    }
    protected _getRenderHtml(req:Request, res:Response, tmpl:string, params:any)
    {
        let html = null
        try
        {
            html = this._razorJs.render(req, res, tmpl, params,{compileDebug:true})
            html = html.replace(/\"~/g, "\"" + req.root)
            html = html.replace(/\'~/g, "\'" + req.root)
        }
        catch (e)
        {
            html = "error!" + e
        }
        return html
    }
}