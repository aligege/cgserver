import { MongoBaseModel, gMongoMgr } from "./MongoManager";
import * as mongo from 'mongodb';
import { gMongoServiceMgr } from "./MongoServiceManager";


export class MongoBaseService<T extends MongoBaseModel>
{
    protected _table:string=""
    get table()
    {
        return this._table
    }
    protected _inited=false
    get isInited()
    {
        return this._inited
    }
    get mongoDb()
    {
        return gMongoMgr.getMongo(this._dbname)
    }
    protected _dbname=""
    get dbname()
    {
        if(!this._dbname)
        {
            this._dbname=gMongoMgr.defdbname
        }
        return this._dbname
    }
    set dbname(db:string)
    {
        this._dbname=db
    }
    protected _t_type:{ new(): T}=null
    constructor(table:string,type: { new(): T},dbname="")
    {
        this._t_type=type
        this._table=table
        this._dbname=dbname
        gMongoServiceMgr.addService(this)
    }

    async getNextId(key:string="")
    {
        if(!key)
        {
            key = this._table
        }
        let id = await this.mongoDb.getAutoIds(this._table)
        return id
    }
    toObjectId(id:string)
    {
        return this.mongoDb.toObjectId(id)
    }
    /**
     * 没有id(非_id)的表不能使用该函数
     * @param id 
     */
    async getById(id:any)
    {
        let rs=await this.mongoDb.findOne(this._table,{id:id})
        return rs.one as T
    }
    async get(where:{[key:string]:any}=null,property:{[key:string]:any}=null)
    {
        let rs = await this.mongoDb.findOne(this._table,where,property)
        return rs.one as T
    }
    async countDocuments(where:{[key:string]:any}=null,options?: mongo.CountDocumentsOptions)
    {
        let rs = await this.mongoDb.countDocuments(this._table,where)
        return rs.count
    }
    async gets(where:{[key:string]:any}=null,property=null,sort=null,skip=0,limit=0)
    {
        let rs = await this.mongoDb.findMany(this._table,where,property,sort,skip,limit)
        return rs.list as T[]
    }
    async getRandoms(num:number,where:{[key:string]:any},property:{[key:string]:any}=null)
    {
        let rs = await this.mongoDb.simpleAggregate(this._table,where,property,null,num)
        return rs.list as T[]
    }
    async updateOne(where:{[key:string]:any},model:any,upsert=false)
    {
        let rs = await this.mongoDb.updateOne(this._table,where,model,upsert)
        return rs
    }
    async updateMany(where:{[key:string]:any},model:any=null,upsert=false)
    {
        let rs = await this.mongoDb.updateMany(this._table,where,model,upsert)
        return rs
    }
    async insert(model:T)
    {
        let rs = await this.mongoDb.insertOne(this._table,model)
        return rs
    }
    async deleteOne(where:any)
    {
        let rs = await this.mongoDb.deleteOne(this._table,where)
        return rs
    }
    async deleteMany(where:any)
    {
        let rs = await this.mongoDb.deleteMany(this._table,where)
        return rs
    }
    async createIndex(index:any,options?:mongo.CreateIndexesOptions)
    {
        let rs = await this.mongoDb.createIndex(this._table,index,options)
        return rs
    }
    aggregate(pipeline?: Document[], options?: mongo.AggregateOptions)
    {
        let ret = this.mongoDb.aggregate(this._table,pipeline,options)
        return ret
    }
    /**
     * 仅仅支持一级
     * @param array 数据名称 比如 items
     * @param where 数组内赛选条件 比如 "items.id":1
     * @param pre_match 数组上一级赛选条件 比如 "user_id":1
     */
    async getsInArray<T>(array:string,where?:{[key:string]:any},pre_match?:any)
    {
        let agg = this.aggregate()
        if(pre_match)
        {
            agg=agg.match(pre_match)
        }
        agg=agg.unwind("$"+array)
        if(where)
        {
            agg=agg.match(where)
        }
        let all = await agg.toArray()
        let items:T[] = []
        for(let i=0;i<all.length;++i)
        {
            items.push(all[i][array])
        }
        return items
    }
    /**
     * 仅仅支持一级
     * @param array 数据名称 比如 items
     * @param where 数组内赛选条件 比如 "items.id":1
     * @param pre_match 数组上一级赛选条件 比如 "user_id":1
     */
    async getInArray<T>(array:string,where?:{[key:string]:any},pre_match?:any)
    {
        let items = await this.getsInArray<T>(array,where,pre_match)
        if(items.length<=0)
        {
            return null
        }
        return items[0]
    }
    async distinct(key:string|number,where:{[key:string]:any}={})
    {
        let rs = await this.mongoDb.distinct(this._table,key,where)
        return rs
    }
}