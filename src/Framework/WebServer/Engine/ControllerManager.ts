import { BaseController } from "../Controller/BaseController";

export let GCtrMgr:ControllerManager = null
class ControllerManager
{
    protected _static_ctr:{[module_name:string]:{[ctrname:string]:BaseController}}={}
    protected _ctr_cls:{[module_name:string]:{[ctrname:string]:any}}={}
    //module ctrname lower normal
    protected _cache_action_names:{[module:string]:{[ctrname:string]:{[lower:string]:string}}}={}
    registerController(module_name:string,ctr_name:string,cls:any)
    {
        module_name = module_name.toLowerCase()
        ctr_name = ctr_name.toLowerCase()
        if(module_name==ctr_name)
        {
            throw("模块名称不能和控制器名称相同："+module_name)
        }
        this._ctr_cls[module_name] = this._ctr_cls[module_name] || {}
        this._ctr_cls[module_name][ctr_name] = cls
        this._cacheActionName(module_name,ctr_name,cls)
    }
    protected _cacheActionName(module_name:string,ctr_name:string,cls:Function)
    {
        module_name = module_name.toLowerCase()
        ctr_name = ctr_name.toLowerCase()
        //不能通过cls.name来获取ctr名称，因为混淆之后类名会变化
        let prototype = cls.prototype
        let map_names:{[actionlowername:string]:string}={}
        while(prototype&&prototype.constructor.name!="BaseController")
        {
            let names = Object.getOwnPropertyNames(prototype)
            for(let action_name of names)
            {
                if(action_name.indexOf("on")!=0
                    &&action_name.indexOf("show")!=0)
                {
                    continue
                }
                if(map_names[action_name.toLowerCase()])
                {
                    continue
                }
                map_names[action_name.toLowerCase()]=action_name
            }
            prototype=Object.getPrototypeOf(prototype)
        }
        this._cache_action_names[module_name]=this._cache_action_names[module_name]||{}
        this._cache_action_names[module_name][ctr_name]=map_names
    }
    getActionName(module_name:string,ctr_name:string,action_name:string)
    {
        module_name = module_name.toLowerCase()
        ctr_name = ctr_name.toLowerCase()
        action_name = action_name.toLowerCase()
        if(!this._cache_action_names[module_name])
        {
            return null
        }
        if(!this._cache_action_names[module_name][ctr_name])
        {
            return null
        }
        return this._cache_action_names[module_name][ctr_name][action_name]
    }
    /**
     * 静态ctr，这样，ctr就不会被多次创建
     * @param module_name 
     * @param ctr_name 
     * @param obj 
     */
    registerStaticController(module_name:string,ctr_name:string,obj:BaseController)
    {
        module_name = module_name.toLowerCase()
        ctr_name = ctr_name.toLowerCase()
        this._static_ctr[module_name] = this._static_ctr[module_name] || {}
        this._static_ctr[module_name][ctr_name] = obj
        this._cacheActionNameForStatic(module_name,ctr_name,obj)
    }
    protected _cacheActionNameForStatic(module_name:string,ctr_name:string,obj:BaseController)
    {
        module_name = module_name.toLowerCase()
        ctr_name = ctr_name.toLowerCase()
        let prototype=Object.getPrototypeOf(obj)
        let map_names:{[actionlowername:string]:string}={}
        while(prototype&&prototype.constructor.name!="BaseController")
        {
            let names = Object.getOwnPropertyNames(prototype)
            for(let func_name of names)
            {
                let low_name=func_name.toLowerCase()
                if(!map_names[low_name])//有可能遭遇重载
                {
                    map_names[low_name]=func_name
                }
            }
            prototype=Object.getPrototypeOf(prototype)
        }
        this._cache_action_names[module_name]=this._cache_action_names[module_name]||{}
        this._cache_action_names[module_name][ctr_name]=map_names
    }
    getStaticCtr(module_name:string,controller_name:string)
    {
        if(module_name)
        {
            module_name = module_name.toLowerCase()
        }
        if(controller_name)
        {
            controller_name = controller_name.toLowerCase()
        }
        if(!this._static_ctr[module_name])
        {
            return
        }
        return this._static_ctr[module_name][controller_name]
    }
    getClass(module_name:string,controller_name:string)
    {
        if(module_name)
        {
            module_name = module_name.toLowerCase()
        }
        if(controller_name)
        {
            controller_name = controller_name.toLowerCase()
        }
        if(!this._ctr_cls[module_name])
        {
            return
        }
        return this._ctr_cls[module_name][controller_name]
    }
}
GCtrMgr = new ControllerManager()