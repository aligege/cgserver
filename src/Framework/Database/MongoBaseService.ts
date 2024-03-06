import { GMongoMgr } from "./MongoManager";
import * as mongo from 'mongodb';

export class MongoBaseService<T>
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
        return GMongoMgr.mongoDb
    }
    protected _t_type:{ new(): T}=null
    constructor(table:string,type: { new(): T})
    {
        this._t_type=type
        this._table=table
    }
    async getNextId(key?:string)
    {
        if(!key)
        {
            key = this._table
        }
        let id = await GMongoMgr.getAutoIds(this._table)
        return id
    }
    /**
     * 没有id(非_id)的表不能使用该函数
     * @param id 
     */
    async getById(id:any)
    {
        let rs=await GMongoMgr.findOne(this._table,null,{id:id})
        return rs.one as T
    }
    async get(property?:{},where?:{})
    {
        let rs = await GMongoMgr.findOne(this._table,property,where)
        return rs.one as T
    }
    async countDocuments(where?:{},options?: mongo.CountDocumentsOptions)
    {
        let rs = await GMongoMgr.countDocuments(this._table,where)
        return rs.count
    }
    async gets(property?:{},where?:{},sort?:{},skip=0,limit=0)
    {
        let rs = await GMongoMgr.findMany(this._table,property,where,sort,skip,limit)
        return rs.list as T[]
    }
    async getRandoms(num:number,property?:{},where?:{})
    {
        let rs = await GMongoMgr.simpleAggregate(this._table,property,where,null,num)
        return rs.list as T[]
    }
    async updateOne(model,where?:{},upsert=false)
    {
        let rs = await GMongoMgr.updateOne(this._table,model,where,upsert)
        return rs
    }
    async updateMany(model,where?:{})
    {
        let rs = await GMongoMgr.updateMany(this._table,model,where)
        return rs
    }
    async insert(model:T)
    {
        let rs = await GMongoMgr.insertOne(this._table,model)
        return rs
    }
    async deleteOne(where)
    {
        let rs = await GMongoMgr.deleteOne(this._table,where)
        return rs
    }
    async deleteMany(where)
    {
        let rs = await GMongoMgr.deleteMany(this._table,where)
        return rs
    }
    async createIndex(index:any,options?:mongo.CreateIndexesOptions)
    {
        let rs = await GMongoMgr.createIndex(this._table,index,options)
        return rs
    }
    aggregate(pipeline?: Document[], options?: mongo.AggregateOptions)
    {
        let ret = GMongoMgr.aggregate(this._table,pipeline,options)
        return ret
    }
    /**
     * 仅仅支持一级
     * @param array 数据名称 比如 items
     * @param where 数组内赛选条件 比如 "items.id":1
     * @param pre_match 数组上一级赛选条件 比如 "user_id":1
     */
    async getsInArray<T>(array:string,where?:any,pre_match?:any)
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
    async getInArray<T>(array:string,where?:any,pre_match?:any)
    {
        let items = await this.getsInArray<T>(array,where,pre_match)
        if(items.length<=0)
        {
            return null
        }
        return items[0]
    }
}