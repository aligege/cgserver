import { Engine } from './../Engine/Engine';
import { Request } from '../Engine/Request';
import { Response } from '../Engine/Response';
import { core } from '../../Core/Core';

export class BaseController
{
    protected _request:Request=null
    get request()
    {
        return this._request
    }
    protected _response:Response=null
    get response()
    {
        return this._response
    }
    //模块名称
    protected _module:string=""
    protected _ctr_name:string=""
    get ctrName()
    {
        return this._ctr_name
    }
    protected _engine:Engine=null
    get postData()
    {
        if(!this._request)
        {
            return <any>{}
        }
        return this._request.postData||<any>{}
    }
    get paramData()
    {
        if(!this._request)
        {
            return <any>{}
        }
        return this._request.params||<any>{}
    }
    constructor(req:Request, res:Response,engine:Engine)
    {
        this._engine = engine
        this._request = req
        this._response = res
        //静态控制器，传过来全是空
        if(this._request)
        {
            this._request.debugInfo()
        }
    }
    async init()
    {

    }
    /**
     * 方便static ctr使用
     * @param req 
     * @param res 
     * @param engine 
     */
    initStatic(req:Request, res:Response,engine:Engine)
    {
        this._engine = engine
        this._request = req
        this._response = res
        this._request.debugInfo()
    }
    //填充每个页面需要的通用数据
    protected _init_data(model?)
    {
        model = model||{}
        model.webName = this._engine.cfg.web_name
        return {model}
    }
    showJson(model?)
    {
        this._response.renderJson(model,this._request.headers.origin)
    }
    show(model?)
    {
        let html = this._engine.getRenderHtml(this._request, this._response, this._init_data(model))
        this._response.renderHtml(html)
    }
    showText(text,noMeta?:boolean)
    {
        if(!noMeta)
        {
            text="<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />"+text    
        }
        this._response.renderHtml(text)
    }
    redirect(module?,controller?, action?,params?)
    {
        module = module || this._module
        controller = controller || this._ctr_name
        let url = this.parseFullUrl(module,controller, action)
        params=params||{}
        let str_p=""
        for(let key in params)
        {
            str_p+="&"+key+"="+params[key]
        }
        if(str_p.length>0)
        {
            str_p="?"+str_p.substring(1)
        }
        url+=str_p
        this._response.redirect(url)
    }
    parseFullUrl(module,controller, action)
    {
        if (typeof action === "undefined" || !action)
        {
            action = "index"
            if(this._engine.cfg.routs.defaults.action==action)
            {
                action=null
            }
        }
        let url = ""
        if(this._engine.cfg.routs.onlyModule)
        {
            url =  this._request.root + "/" + controller
        }
        else
        {
            url = this._request.root + "/" + module+ "/" + controller
        }
        if(action)
        {
            url+="/"+action
        }
        return url
    }
    get remoteHost()
    {
        return this._request.remoteHost
    }
}