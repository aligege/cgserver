import { core } from "../Core/Core"

class SyncQueueItem
{
    key=""
    running=false
    funcs:{func:Function,thisArg:any,params:any[],resolve?:Function}[]=[]
    constructor(key:string)
    {
        this.key=key
    }
    async add(func:Function,thisArg:any=null,...params)
    {
        return new Promise((resolve,reject)=>
        {
            this.funcs.push({func:func,thisArg:thisArg,params:params,resolve:resolve})
            this._run()
        })
    }
    protected async _run()
    {
        if(this.running)
        {
            return
        }
        this.running=true
        while(this.funcs.length>0)
        {
            let funcitem = this.funcs.shift()
            if(!funcitem.func)
            {
                continue
            }
            let rs = await core.safeCall(funcitem.func,funcitem.thisArg,...funcitem.params)
            await core.safeCall(funcitem.resolve,null,rs)
        }
        this.running=false
    }
}
class SyncQueueTool
{
    //队列数据,一个key队列必须有先后
    protected _queues:{[key:string]:SyncQueueItem}={}
    async add(key:string,func:Function,thisArg:any=null,...params)
    {
        this._queues[key]=this._queues[key]||new SyncQueueItem(key)
        let error = await this._queues[key].add(func,thisArg,...params)
        return error
    }
}
export let GSyncQueueTool=new SyncQueueTool()