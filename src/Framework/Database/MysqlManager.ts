import { EErrorCode } from './../Config/_error_';
import { GLog } from '../Logic/Log';
import * as mysql from 'mysql';
export class SqlResult
{
    /**
     * select 的数据量
     */
    length:number=0
    /**
     * 插入数据的自增id
     */
    insertId:number=null
    /**
     * update 更新数据的影响条数
     */
    changedRows:number=null
    /**
     * 插入或删除数据的影响条数
     */
    affectedRows:number=null
}
export class SqlReturn
{
    error=null
    results:SqlResult=null
    fields=null
    list:Array<any>=null
}
export class SqlReturns
{
    error=null
    srs:Array<SqlResult>=[]
}
export let GMysqlMgr:MysqlManager = null
class MysqlManager
{
    protected _init_cbs=[]
    protected _pool:mysql.Pool = null
    get isValid()
    {
        return !!this._pool
    }
    constructor()
    {
        
    }
    async init()
    {
        return new Promise(async (resolve)=>{
            if(this._pool
                ||!GServerCfg.db.mysql
                ||!GServerCfg.db.mysql.open)
            {
                resolve(null)
                return
            }
            this._pool  = mysql.createPool({
                connectionLimit : 100,
                host     : GServerCfg.db.mysql.host,
                port     : GServerCfg.db.mysql.port,
                user     : GServerCfg.db.mysql.user,
                password : GServerCfg.db.mysql.password,
                database : GServerCfg.db.mysql.database,
                supportBigNumbers : true,
                charset:"utf8mb4"
            })
            console.log("mysql config="+JSON.stringify(GServerCfg.db.mysql))
            //这个的初始化位置不能变，必须位于cbs前，pool后
            await GDBCache.init()
            resolve(null)
            for(let i=0;i<this._init_cbs.length;++i)
            {
                this._init_cbs[i]()
            }
        })
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
    query(sqlStr,values?,no_err_log?:boolean)
    {
        return new Promise<SqlReturn>((resolve,reject)=>
        {
            let sr:SqlReturn = new SqlReturn()
            if(!this._pool)
            {
                //表示没有开通数据库，不用记录错误日志
                sr.error=EErrorCode.No_Mysql
                GLog.error(sr.error)
                resolve(sr)
                return
            }
            this._pool.getConnection((err, conn) =>
            {
                if(err)
                {
                    sr.error = err
                    GLog.error(err)
                    resolve(sr)
                    return
                }
                conn.query(sqlStr,values, (error, results, fields) =>
                {
                    sr.error = error
                    sr.results = results
                    if(sr.results&&sr.results.length>0)
                    {
                        sr.list=[]
                        for(let i=0;i<sr.results.length;++i)
                        {
                            sr.list.push(sr.results[i])
                        }
                    }
                    sr.fields = fields
                    conn.release()
                    if (error&&!no_err_log)
                    {
                        GLog.error(error)
                    }
                    resolve(sr)
                })
            })
        })
    }
    transaction(sqls)
    {
        return new Promise<SqlReturns>((resolve,reject)=>
        {
            let srs = new SqlReturns()
            this._pool.getConnection((err,conn)=>
            {
                if(err)
                {
                    srs.error = err
                    GLog.error(err)
                    resolve(srs)
                    return
                }
                conn.beginTransaction((err)=>
                {
                    if(err)
                    {
                        srs.error = err
                        GLog.error(err)
                        conn.release()
                        resolve(srs)
                        return
                    }
                    let funcs = []
                    for(let i=0;i<sqls.length;++i)
                    {
                        let sql = sqls[i]
                        funcs.push(()=>
                        {
                            conn.query(sql.sql,sql.values,(error, results, fields)=>
                            {
                                srs.srs.push(results)
                                if (error) 
                                {
                                    return conn.rollback(()=>
                                    {
                                        GLog.error(error)
                                        srs.error = error
                                        conn.release()  
                                        resolve(srs)
                                    })
                                }
                                else
                                {
                                    if(funcs.length>0)
                                    {
                                        let f = funcs.shift()
                                        f()
                                    }
                                    else
                                    {
                                        conn.commit((error)=>
                                        {
                                            if (error) 
                                            {
                                                return conn.rollback(()=>
                                                {
                                                    srs.error = error
                                                    GLog.error(error)
                                                    conn.release()  
                                                    resolve(srs)
                                                })
                                            }
                                            else
                                            {
                                                conn.release()  
                                                resolve(srs)
                                            }
                                        })
                                    }
                                }
                            })
                        })
                    }
                    let f = funcs.shift()
                    f()
                })
            })
        })
    }
}
GMysqlMgr = new MysqlManager()
//该import必须放在GMysqlMgr实例化之后，否则version基类找不到GMysqlMgr
import { GDBCache } from './Decorator/DBCache';import { GServerCfg } from '../Config/IServerConfig';

