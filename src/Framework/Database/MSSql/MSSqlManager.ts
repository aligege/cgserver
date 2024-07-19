import * as mssql from "mssql";
import { gDbCache } from "../Decorator/DBCache";
export class MSSqlConfig
{
    open    = false
    auto    = false
    domain  = '127.0.0.1'
    port    = 3306
    user    = 'root'
    password= 'root'
    database= 'gameall'
    charset = 'utf8mb4'
}
export class MssqlReturn
{
    error=null
    fields=null
    list:Array<any>=null
}

export class MSSqlManager
{
    protected _init_cbs=[]
    protected _pool:mssql.ConnectionPool = null
    get pool()
    {
        return this._pool
    }
    get isValid()
    {
        return !!this._pool
    }
    constructor()
    {
        
    }
    async init(cfg:MSSqlConfig)
    {
        if(this._pool
            ||!cfg
            ||!cfg.open)
        {
            return
        }

        this._pool  = await mssql.connect(<any>cfg)
        console.log("mssql config="+JSON.stringify(cfg))
        //这个的初始化位置不能变，必须位于cbs前，pool后
        await gDbCache.init()
        for(let i=0;i<this._init_cbs.length;++i)
        {
            this._init_cbs[i]()
        }
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
}
export let gMSSqlMgr=new MSSqlManager()