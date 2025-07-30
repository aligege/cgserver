import { EErrorCode } from '../../Config/_error_';
import { core } from '../../Core/Core';
import { gLog } from '../../Logic/Log';
import mongoose from 'mongoose';
export class MongoConfig
{
    open=false
    host="127.0.0.1"
    port=27017
    options:mongoose.ConnectOptions=null
    database='mongodb'
    //决定是否显示mongo的执行时间等日志
    debug=false
}
export class MrResult
{
    /**
     * select 的数据量
     */
    length:number=0
    /**
     * 插入数据的自增id
     */
    insertId:number=null
    insertIds:{ [key: number]: number }=null
    /**
     * update 更新数据的影响条数
     */
    changedRows:number=null
    /**
     * 插入或删除数据的影响条数
     */
    affectedRows:number=null
}
export class MgReturn
{
    error=null
    result=new MrResult()
    list=[]
}
export class MongoManager
{
    protected _dbs:{[key:string]:MongoExt}={}
    protected _defdbname=""
    get defdbname()
    {
        return this._defdbname
    }
    //初始化多个数据库，第一个open数据库为默认数据库
    async init(cfgs:MongoConfig[])
    {
        for(let i=0;i<cfgs.length;++i)
        {
            let cfg=cfgs[i]
            let ret = await this.addMongo(cfg)
            if(!ret)
            {
                return false
            }
        }
        return true
    }
    async addMongo(cfg:MongoConfig)
    {
        if(this._dbs[cfg.database])
        {
            gLog.error("数据库配置得database不能相同!database="+cfg.database)
            return false
        }
        let mongoext = new MongoExt()
        let ret = await mongoext.init(cfg)
        if(!ret)
        {
            gLog.error("数据库初始化失败!cfg="+JSON.stringify(cfg))
            return false
        }
        this._dbs[cfg.database]=mongoext
        if(!this._defdbname)
        {
            this._defdbname=cfg.database
        }
        return true
    }
    async removeMongo(dbname:string,force=false)
    {
        let mongo = this.getMongo(dbname)
        if(!mongo)
        {
            return false
        }
        mongo.close(force)
    }
    getMongo(dbname="")
    {
        if(!dbname)
        {
            dbname=this._defdbname
        }
        return this._dbs[dbname]
    }
}
export class MongoExt
{
    protected _mongocfg:MongoConfig=null
    protected _init_cbs=[]
    protected _mongo_init_succ:boolean=false
    protected _inited:boolean=false
    get isValid()
    {
        return this._inited
    }
    constructor()
    {

    }
    async init(cfg:MongoConfig)
    {
        if(!cfg||!cfg.open)
        {
            return false
        }
        if(this._inited)
        {
            return false
        }
        this._mongocfg=cfg
        this._inited = true
        gLog.info("mongo config="+JSON.stringify(this._mongocfg))
        mongoose.connection.on("disconnected",this.onClose.bind(this))
        mongoose.connection.on("open", this.onOpen.bind(this));
        this._mongocfg.options.dbName=this._mongocfg.database
        await mongoose.connect("mongodb://"+this._mongocfg.host+":"+this._mongocfg.port,this._mongocfg.options)
        mongoose.connection.useDb(this._mongocfg.database)
        console.log("mongo connect success! db="+this._mongocfg.database)
        return true
    }
    close(force=false)
    {
        mongoose.connection.close(force)
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
    onOpen()
    {
        this._mongo_init_succ = true
        gLog.info("mongo has opened!")
        for(let i=0;i<this._init_cbs.length;++i)
        {
            this._init_cbs[i]()
        }
        this._init_cbs=[]
    }
    onClose()
    {
        this._mongo_init_succ = false
        gLog.info("mongo has closed!")
        this._inited = false
        //this.init(this._mongocfg)
    }
    onError(err:Error)
    {
        gLog.error(err)
    }
    /**
     * 获取自增长id
     * @param key 
     * @returns 小于等于0为异常
     */
    async getAutoIds(key:string):Promise<number>
    {
        let now = Date.now()
        let dt = 0
        let collection = "auto_ids"
        let col = mongoose.connection.collection(collection);
        try{
            let where = {_id: key }
            let rs = await core.safeCall(col.findOneAndUpdate,col,where, { $inc:{id:1} }, { upsert: true })
            if(rs&&rs.id)
            {
                return rs.id+1
            }
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"getAutoIds",dt,arguments})
            return 1
        }
        catch(e)
        {
            gLog.error(e.stack)
        }
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"getAutoIds",dt,arguments})
        return -2
    }
}

export let gMongoMgr = new MongoManager()