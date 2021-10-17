import { GFCfg } from '../Config/FrameworkConfig';
import { GLog } from '../Logic/Log';
import * as mongo from 'mongodb';
import { EErrorCode } from '../Config/_error_';
import { core } from '../Core/Core';

export class MongoBaseModel
{
    _id: any
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
export let GMongoMgr:MongoManager = null
class MongoManager
{
    protected _init_cbs=[]
    protected _mongo:mongo.Db = null
    get mongo()
    {
        return this._mongo
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
    async init()
    {
        if(this._inited)
        {
            return false
        }
        if(this._mongo)
        {
            return true
        }
        if(!GFCfg.db.mongo||!GFCfg.db.mongo.open)
        {
            return true
        }
        this._inited = true
        GLog.info("mongo config="+JSON.stringify(GFCfg.db.mongo),true)
        let client = new mongo.MongoClient("mongodb://"+GFCfg.db.mongo.host+":"+GFCfg.db.mongo.port,{ useNewUrlParser: true,useUnifiedTopology: true })
        await client.connect()
        this.onConnect()
        this._mongo = client.db(GFCfg.db.mongo.database)
        this._mongo.addListener("end", this.onEnd.bind(this))
        this._mongo.addListener("error", this.onError.bind(this))
        for(let i=0;i<this._init_cbs.length;++i)
        {
            this._init_cbs[i]()
        }
        return true
    }
    registerInitCb(cb:Function)
    {
        this._init_cbs.push(cb)
    }
    onConnect()
    {
        this._mongo_init_succ = true
        GLog.info("mogo has connected!")
    }
    onEnd()
    {
        this._mongo_init_succ = false
        GLog.info("mogo has ended!")
    }
    onError(err)
    {
        GLog.info("Error " + err)
    }
    async getAutoIds(key:string)
    {
        if(!this._mongo)
        {
            return -1
        }
        let collection = "auto_ids"
        let col = this._mongo.collection(collection);
        try{
            let rs = await col.updateOne({_id: key }, { $inc:{id:1} }, { upsert: true })
            if(rs.upsertedCount==1||rs.modifiedCount==1)
            {
                let rs = await this.findOne(collection,null,{_id:key})
                if(rs.one)
                {
                    return rs.one.id
                }
                return -1
            }
        }
        catch(e)
        {
            GLog.error(e)
        }
        return -1
    }
    protected _convertWhere(where?:any)
    {
        if(!where||!where._id)
        {
            return
        }
        if(core.isString(where._id))
        {
            where._id=new mongo.ObjectId(where._id)
        }
        return where
    }
    /**
     * 获取单条消息
     * @param collection 
     */
    async findOne(collection:string,property?:{},where?:{},sort?:{})
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,one:null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let one = null
        try{
            let col = this._mongo.collection(collection)
            if(!sort)
            {
                one = await col.findOne(where||{},property)
            }
            else
            {
                one = await (col.find(where||{},property).sort(sort).limit(1).next())
            }
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.one=one
        return rs
    }
    async findMany(collection:string,property?:{},where?:{},sort?:{},skip=0,limit=0)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,list:<any[]>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let list=[]
        try{
            let col = this._mongo.collection(collection)
            let cursor = col.find(where||{},property)
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
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.list=list
        return rs
    }
    async findCount(collection:string,property?:{},where?:{})
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let count=-1
        try{
            let col = this._mongo.collection(collection)
            count = await col.find(where||{},property).count()
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.count=count
        return rs
    }
    async deleteOne(collection,where)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let del_rs:mongo.DeleteWriteOpResultObject=null
        try{
            let col = this._mongo.collection(collection)
            del_rs = await col.deleteOne(where||{})
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        if(del_rs)
        {
            rs.count=del_rs.deletedCount
        }
        return rs
    }
    async deleteMany(collection,where)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,count:-1}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let del_rs:mongo.DeleteWriteOpResultObject=null
        try{
            let col = this._mongo.collection(collection)
            del_rs = await col.deleteMany(where||{})
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        if(del_rs)
        {
            rs.count=del_rs.deletedCount
        }
        return rs
    }
    /**
     * 插入数据
     * @param collection 
     * @param data 
     */
    async insertOne(collection:string,data)
    {
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.InsertOneWriteOpResult<any>>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let in_rs:mongo.InsertOneWriteOpResult<any>=null
        try
        {
            let col = this._mongo.collection(collection)
            in_rs = await col.insertOne(data)            
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=in_rs
        return rs
    }
    async insertManay(collection:string,data:[])
    {
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.InsertWriteOpResult<any>>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let in_rs:mongo.InsertWriteOpResult<any>=null
        try{
            let col = this._mongo.collection(collection)
            in_rs = await col.insertMany(data)            
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=in_rs
        return rs
    }
    async updateOne(collection:string,model?:{},where?:{},upsert=false)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.UpdateWriteOpResult>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let up_rs:mongo.UpdateWriteOpResult=null
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
            let col = this._mongo.collection(collection)
            up_rs = await col.updateOne(where, updateModel,{upsert:upsert})
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=up_rs
        return rs
    }
    async updateMany(collection:string,model,where?:{},upsert=false)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,rs:<mongo.UpdateWriteOpResult>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let up_rs:mongo.UpdateWriteOpResult=null
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
            let col = this._mongo.collection(collection)
            up_rs = await col.updateMany(where, updateModel,{upsert:upsert})
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=up_rs
        return rs
    }
    async createIndex(collection:string,index:any,options?:mongo.IndexOptions)
    {
        let rs = {errcode:<{id:number,des:string}>null,rs:<string>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let i_rs:string=null
        try{
            let col = this._mongo.collection(collection)
            i_rs = await col.createIndex(index,options)
        }
        catch(e)
        {
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.rs=i_rs
        return rs
    }
    async aggregate(collection:string,property={},where={},size?:number,random_size?:number)
    {
        this._convertWhere(where)
        let rs = {errcode:<{id:number,des:string}>null,list:<any[]>null}
        if(!this._mongo)
        {
            rs.errcode=EErrorCode.No_Mongo
            return rs
        }
        let list=[]
        try{
            let col = this._mongo.collection(collection)
            let params = []
            params.push({'$match': where||{}})
            params.push({'$project': property||{}})
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
            GLog.error(e)
            rs.errcode=EErrorCode.Mongo_Error
        }
        rs.list=list
        return rs
    }
}
GMongoMgr = new MongoManager()