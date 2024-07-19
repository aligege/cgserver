import { EErrorCode } from './../Config/_error_';
import * as mysql2 from 'mysql2/promise';
import { global } from '../global';
export class MysqlConfig
{
    open=false
    auto=false
    poolcfg:mysql2.PoolOptions=null
}
export class SqlReturn
{
    error=null
    result:mysql2.QueryResult=null
    fields=null
    get queryResult()
    {
        return this.result as mysql2.RowDataPacket[]
    }
    get execResult()
    {
        return this.result as mysql2.ResultSetHeader
    }
}
export class SqlReturns
{
    error=null
    srs:Array<mysql2.QueryResult>=[]
}
export class MysqlManager
{
    protected _init_cbs=[]
    protected _pool:mysql2.Pool = null
    get isValid()
    {
        return !!this._pool
    }
    protected _cfg:MysqlConfig=null
    get cfg()
    {
        return this._cfg
    }
    constructor()
    {
        
    }
    async init(cfg:MysqlConfig)
    {
        if(this._pool
            ||!cfg
            ||!cfg.open)
        {
            return
        }
        this._cfg = cfg
        this._pool  = mysql2.createPool(cfg.poolcfg)
        console.log("mysql config="+JSON.stringify(cfg))
        //这个的初始化位置不能变，必须位于cbs前，pool后
        if(cfg.auto)
        {
            await global.gDbCache.init()
        }
        for(let i=0;i<this._init_cbs.length;++i)
        {
            this._init_cbs[i]()
        }
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
    async query(sqlStr:string,values?:any)
    {
        let sr:SqlReturn = new SqlReturn()
        if(!this._pool)
        {
            //表示没有开通数据库，不用记录错误日志
            sr.error=EErrorCode.No_Mysql
            global.gLog.error(sr.error)
            return sr
        }
        try
        {
            const [result,fields] = await this._pool.query(sqlStr,values)
            sr.result = result
            sr.fields = fields
        }
        catch(error)
        {
            sr.error=EErrorCode.No_Mysql
            global.gLog.error(sr.error)
            return sr
        }
        return sr
    }
    async transaction(sqls:any[])
    {
        let srs = new SqlReturns()
        try{
            await this._pool.beginTransaction()
            for(let i=0;i<sqls.length;++i)
            {
                let sql = sqls[i]
                let sr = await this.query(sql.sql,sql.values)
                if(sr.error)
                {
                    srs.error = sr.error
                    await this._pool.rollback()
                    return srs
                }
            }
            await this._pool.commit()
        }catch(err)
        {
            srs.error = err
            global.gLog.error(err)
        }
    }
}

