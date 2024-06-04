import { Response } from './Response';
import { Request } from './Request';
import { GCtrMgr } from './ControllerManager';
import { RazorJs } from './RazorJs';
import * as http from "http";
import { GLog } from '../../Logic/Log';
import { WebServerConfig } from '../../Config/FrameworkConfig';
import * as cors from "cors";
import * as Express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser = require('cookie-parser');
export class Engine
{
    protected _app = Express()
    protected _cfg:WebServerConfig=null
    get cfg()
    {
        return this._cfg
    }
    protected _server:http.Server=null
    protected _razorJs:RazorJs=null
    protected _root_path=process.cwd()
    constructor(cfg:WebServerConfig,razorJs:RazorJs)
    {
        this._cfg=cfg
        this._razorJs = razorJs
    }
    start()
    {
        let port = this._cfg.port
        let https = require("https");
        let fs = require("fs");

        if(!port)
        {
            GLog.error(this._cfg)
            return
        }
        http.createServer(this._app).listen(port,()=>
        {
            GLog.info("Server("+this._cfg.web_name+") running at http://127.0.0.1:" + port + "/")
        });
        
        if(this._cfg.ssl)
        {
            const httpsOption = {
                key : fs.readFileSync(this._cfg.ssl.key),
                cert: fs.readFileSync(this._cfg.ssl.crt)
            }
            https.createServer(httpsOption, this._app).listen(port+1);
            GLog.info("Server("+this._cfg.web_name+") running at https://127.0.0.1:" + (port+1) + "/")
        }

        this._app.use(cookieParser())
        this._app.use(Express.json({limit: '10mb'}))
        this._app.use(Express.urlencoded({limit: '10mb', extended: false}))
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
        this._app.all("/*",(_req:Express.Request,_res:Express.Response)=>
        {
            this._all(_req,_res).catch((reason)=>
            {
                GLog.error(reason)
                let res=new Response(_res,this._cfg)
                let method=_req.method.toLowerCase()
                if(method=="post")
                {
                    res.renderJson500()
                }
                else if(method=="get")
                {
                    res.render500()
                }
            })
        })
    }
    protected async _all(_req:Express.Request,_res:Express.Response)
    {
        let req=new Request(_req,this._cfg)
        let res=new Response(_res,this._cfg)

        let method=req.method.toLowerCase()
        if(method=="options")
        {
            _res.sendStatus(200)
            return
        }
        if(method=="head")
        {
            _res.sendStatus(200)
            return
        }
        if(method!="get"&&method!="post")
        {
            return
        }
        let pre_action = "show"
        let action_name=""
        if(method=="post")
        {
            pre_action="on"
        }
        //大小写还原
        action_name = GCtrMgr.getActionName(req.module,req.controller,pre_action+req.action)
        //尝试一次on，变态支持
        if(!action_name&&method=="get")
        {
            pre_action="on"
            action_name = GCtrMgr.getActionName(req.module,req.controller,pre_action+req.action)
        }
        if(!action_name)
        {
            if(method=="get")
            {
                res.render404()
            }
            else if(method=="post")
            {
                res.renderJson404()
            }
            return
        }
        let ctr = GCtrMgr.getStaticCtr(req.module,req.controller)
        let cls_ctr = null
        if(!ctr)
        {
            cls_ctr = GCtrMgr.getClass(req.module,req.controller)
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
        ctr[action_name].call(ctr)
    }
    stop()
    {

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