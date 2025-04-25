import * as mongo from 'mongodb';
import { EErrorCode } from '../../Config/_error_';
import { core } from '../../Core/Core';
import { gLog } from '../../Logic/Log';
export class MongoConfig
{
    open=false
    host="127.0.0.1"
    port=27017
    options:mongo.MongoClientOptions=null
    database='mongodb'
    //决定是否显示mongo的执行时间等日志
    debug=false
}
export class MongoBaseModel
{
    _id: mongo.ObjectId
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
    protected _mongoDb:mongo.Db = null
    get mongoDb()
    {
        return this._mongoDb
    }
    protected _mongoClient:mongo.MongoClient = null
    get mongoClient()
    {
        return this._mongoClient
    }
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
        this._mongoClient = new mongo.MongoClient("mongodb://"+this._mongocfg.host+":"+this._mongocfg.port,this._mongocfg.options)
        this._mongoClient.on("open",this.onOpen.bind(this))
        this._mongoClient.on("close",this.onClose.bind(this))
        this._mongoClient.on("connectionCreated",this.onConnectionCreated.bind(this))
        this._mongoClient.on("connectionReady",this.onConnectionReady.bind(this))
        this._mongoClient.on("connectionClosed",this.onConnectionClosed.bind(this))
        
        await this._mongoClient.connect()
        return true
    }
    onConnectionCreated(event:mongo.ConnectionCreatedEvent)
    {
        this._mongocfg.debug&&gLog.info({key:"mongo onConnectionCreated",event})
    }
    onConnectionReady(event:mongo.ConnectionReadyEvent)
    {
        this._mongocfg.debug&&gLog.info({key:"mongo onConnectionReady",event})
    }
    onConnectionClosed(event:mongo.ConnectionClosedEvent)
    {
        this._mongocfg.debug&&gLog.info({key:"mongo onConnectionClosed",event})
    }
    close(force=false)
    {
        this._mongoClient.close(force)
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
    onOpen()
    {
        this._mongo_init_succ = true
        gLog.info("mongo has opened!")
        this._mongoDb = this._mongoClient.db(this._mongocfg.database)
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
        this._mongoDb = null
        this._inited = false
        this.init(this._mongocfg)
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
        if(!this._mongoDb)
        {
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"getAutoIds",dt,arguments})
            return -1
        }
        let collection = "auto_ids"
        let col = this._mongoDb.collection(collection);
        try{
            let where = this._convertWhere({_id: key })
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
    protected _convertWhere(where?:{[key:string]:any})
    {
        let now = Date.now()
        let dt = 0
        if(!where||!where._id)
        {
            return
        }
        if(core.isString(where._id)&&where._id.length==24)
        {
            let _id:string=where._id
            try
            {
                where._id=this.toObjectId(_id)
            }
            catch(e)
            {
                where._id=_id
            }
        }
        return where
    }
    toObjectId(id:string)
    {
        return new mongo.BSON.ObjectId(id)
    }
    /**
     * 获取单条消息
     * @param collection 
     */
    async findOne(collection:string,where:{[key:string]:any}={},property:{[key:string]:any}={})
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,one:null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"findOne",dt,arguments})
            return rs
        }
        let one = null
        try{
            let col = this._mongoDb.collection(collection)
            one = await col.findOne(where,{projection:property})
        }
        catch(e)
        {
            gLog.error({collection,property,where})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.one=one
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"findOne",dt,arguments})
        return rs
    }
    async distinct(collection:string,key:string|number,where:{[key:string]:any}={})
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,lst:null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"distinct",dt,arguments})
            return rs
        }
        let lst = null
        try{
            let col = this._mongoDb.collection(collection)
            lst = await col.distinct(key,where)
        }
        catch(e)
        {
            gLog.error({collection,key,where})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.lst=lst
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"distinct",dt,arguments})
        return rs
    }
    async findMany(collection:string,where:{[key:string]:any}={},property:{[key:string]:any}={},sort?:{[key:string]:any},skip=0,limit=0)
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,list:<any[]>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"findMany",dt,arguments})
            return rs
        }
        let list=[]
        try{
            let col = this._mongoDb.collection(collection)
            let cursor = col.find(where,{projection:property})
            if(sort)
            {
                cursor = cursor.sort(sort)
            }
            if(skip)
            {
                cursor = cursor.skip(skip)
            }
            if(limit)
            {
                cursor = cursor.limit(limit)
            }
            list = await cursor.toArray()
        }
        catch(e)
        {
            gLog.error({collection,property,where,sort,skip,limit})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.list=list
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"findMany",dt,arguments})
        return rs
    }
    async countDocuments(collection:string,where?:{[key:string]:any},options?: mongo.CountDocumentsOptions)
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"countDocuments",dt,arguments})
            return rs
        }
        let count=-1
        try{
            let col = this._mongoDb.collection(collection)
            count = await col.countDocuments(where||{},options)
        }
        catch(e)
        {
            gLog.error({collection,where})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.count=count
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"countDocuments",dt,arguments})
        return rs
    }
    async deleteOne(collection:string,where:{[key:string]:any})
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let del_rs:mongo.DeleteResult=null
        try{
            let col = this._mongoDb.collection(collection)
            del_rs = await col.deleteOne(where||{})
        }
        catch(e)
        {
            gLog.error({collection,where})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        if(del_rs)
        {
            rs.count=del_rs.deletedCount
        }
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"deleteOne",dt,arguments})
        return rs
    }
    async deleteMany(collection:string,where:{[key:string]:any})
    {
        let now = Date.now()
        let dt = 0
        if(!where)
        {
            where={}
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"deleteMany",dt,arguments})
            return rs
        }
        let del_rs:mongo.DeleteResult=null
        try{
            let col = this._mongoDb.collection(collection)
            del_rs = await col.deleteMany(where||{})
        }
        catch(e)
        {
            gLog.error({collection,where})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        if(del_rs)
        {
            rs.count=del_rs.deletedCount
        }
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"deleteMany",dt,arguments})
        return rs
    }
    /**
     * 插入数据
     * @param collection 
     * @param data 
     */
    async insertOne(collection:string,data:any)
    {
        let now = Date.now()
        let dt = 0
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.InsertOneResult<any>>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"insertOne",dt,arguments})
            return rs
        }
        let in_rs:mongo.InsertOneResult<any>=null
        try
        {
            let col = this._mongoDb.collection(collection)
            in_rs = await col.insertOne(data)            
        }
        catch(e)
        {
            gLog.error({collection,data})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=in_rs
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"insertOne",dt,arguments})
        return rs
    }
    async insertManay(collection:string,data:any[])
    {
        let now = Date.now()
        let dt = 0
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.InsertManyResult<any>>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"insertManay",dt,arguments})
            return rs
        }
        let in_rs:mongo.InsertManyResult<any>=null
        try{
            let col = this._mongoDb.collection(collection)
            in_rs = await col.insertMany(data)            
        }
        catch(e)
        {
            gLog.error({collection,data})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=in_rs
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"insertManay",dt,arguments})
        return rs
    }
    async updateOne(collection:string,where:{[key:string]:any},model:any,options?:mongo.UpdateOptions)
    {
        let now = Date.now()
        let dt = 0
        let _id = model["_id"]
        delete model["_id"]
        if(!where&&_id)
        {
            where["_id"]=_id
        }
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.UpdateResult>null}
        if(!this._mongoDb)
        {
            if(_id)
            {
                model["_id"]=_id
            }
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"updateOne",dt,arguments})
            return rs
        }
        let up_rs:mongo.UpdateResult=null
        try{
            let updatemodel=null
            let money=false
            for(let key in model)
            {
                if(key.startsWith("$"))
                {
                    money=true
                }
            }
            if(!money)
            {
                updatemodel={"$set":model}
            }
            else
            {
                updatemodel=model
            }
            let col = this._mongoDb.collection(collection)
            up_rs = await col.updateOne(where, updatemodel,options)
        }
        catch(e)
        {
            gLog.error({collection,model,where,options})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=up_rs
        if(up_rs?.upsertedId||_id)
        {
            
            model["_id"]=up_rs?.upsertedId||_id
        }
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"updateOne",dt,arguments})
        return rs
    }
    async updateMany(collection:string,where:{[key:string]:any},model:any,options?:mongo.UpdateOptions)
    {
        let now = Date.now()
        let dt = 0
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.Document | mongo.UpdateResult>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"updateMany",dt,arguments})
            return rs
        }
        let up_rs:mongo.Document | mongo.UpdateResult=null
        try{
            let updateModel=null
            let firstKey=Object.keys(model)[0]
            if(!firstKey.startsWith("$"))
            {
                updateModel={ $set: model }
            }
            else
            {
                updateModel=model
            }
            let col = this._mongoDb.collection(collection)
            up_rs = await col.updateMany(where, updateModel,options)
        }
        catch(e)
        {
            gLog.error({collection,model,where,options})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=up_rs
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"updateMany",dt,arguments})
        return rs
    }
    async createIndex(collection:string,index:any,options?:mongo.CreateIndexesOptions)
    {
        let now = Date.now()
        let dt = 0
        let rs = {errcode:<{id:number,des:string}>null,rs:<string>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"createIndex",dt,arguments})
            return rs
        }
        let i_rs:string=null
        try{
            let col = this._mongoDb.collection(collection)
            i_rs = await col.createIndex(index,options)
        }
        catch(e)
        {
            gLog.error({collection,index})
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=i_rs
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"createIndex",dt,arguments})
        return rs
    }
    async simpleAggregate(collection:string,where?:{[key:string]:any},property?:{[key:string]:any},size?:number,random_size?:number)
    {
        let now = Date.now()
        let dt = 0
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,list:<any[]>null}
        if(!this._mongoDb)
        {
            rs.errcode=EErrorCode.No_Mongo
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"simpleAggregate",dt,arguments})
            return rs
        }
        let list=[]
        try{
            let col = this._mongoDb.collection(collection)
            let params = []
            if(where)
            {
                params.push({'$match': where})
            }
            if(property)
            {
                params.push({'$project': property})
            }
            if(random_size)
            {
                params.push({'$sample': {'size': random_size}})
            }
            let agg = col.aggregate(params)
            if(size)
            {
                list = await agg.limit(size).toArray()
            }
            else
            {
                list = await agg.toArray()
            }
        }
        catch(e)
        {
            gLog.error(e.stack)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.list=list
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"simpleAggregate",dt,arguments})
        return rs
    }
    aggregate(collection:string,pipeline?: Document[], options?: mongo.AggregateOptions)
    {
        if(!this._mongoDb)
        {
            return
        }
        let col = this._mongoDb.collection(collection)
        let agg = col.aggregate(pipeline,options)
        return agg
    }
    /**
     * 快速事务
     * @param collection 
     * @param cb 
     */
    async quickTransaction(cb:Function,options?: mongo.TransactionOptions):Promise<false|any>
    {
        let now = Date.now()
        let dt = 0
        if(!this._mongoDb)
        {
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"quickTransaction",dt,arguments})
            return false
        }
        let session = this._mongoClient.startSession()
        session.startTransaction(options)
        try
        {
            let rs = await cb(session)
            await session.commitTransaction()
            session.endSession()
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"quickTransaction",dt,arguments})
            return rs
        }
        catch(e)
        {
            await session.abortTransaction()
            gLog.error(e.stack)
        }
        finally
        {
            await session.endSession()
        }
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"quickTransaction",dt,arguments})
        return false
    }
    async bulkWrite(collection:string,operations: mongo.AnyBulkWriteOperation<mongo.BSON.Document>[],options?: mongo.BulkWriteOptions)
    {
        let now = Date.now()
        let dt = 0
        if(!this._mongoDb)
        {
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"bulkWrite",dt,arguments})
            return
        }
        let bulk = this._mongoDb.collection(collection)
        let bwr=bulk.bulkWrite(operations,options)
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"bulkWrite",dt,arguments})
        return bwr
    }
    async findOneAndUpdate(collection:string,filter:any,update:any,options?:mongo.FindOneAndUpdateOptions):Promise<any>
    {
        let now = Date.now()
        let dt = 0
        if(!this._mongoDb)
        {
            dt = Date.now()-now
            this._mongocfg.debug&&gLog.info({key:"findOneAndUpdate",dt,arguments})
            return
        }
        let col = this._mongoDb.collection(collection)
        let rs = await col.findOneAndUpdate(filter,update,options)
        dt = Date.now()-now
        this._mongocfg.debug&&gLog.info({key:"findOneAndUpdate",dt,arguments})
        return rs
    }
}

export let gMongoMgr = new MongoManager()