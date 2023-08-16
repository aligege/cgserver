import * as mssql from "mssql";
import { GServerCfg } from "../Config/IServerConfig";
import { GDBCache } from "./Decorator/DBCache";

export class MssqlReturn
{
    error=null
    fields=null
    list:Array<any>=null
}

export let GMSSqlMgr:MSSqlManager=null
class MSSqlManager
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
    async init()
    {
        if(this._pool
            ||!GServerCfg.db.mssql
            ||!GServerCfg.db.mssql.open)
        {
            return
        }

        this._pool  = await mssql.connect(<any>GServerCfg.db.mssql)
        console.log("mssql config="+JSON.stringify(GServerCfg.db.mssql))
        //这个的初始化位置不能变，必须位于cbs前，pool后
        await GDBCache.init()
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
GMSSqlMgr=new MSSqlManager()