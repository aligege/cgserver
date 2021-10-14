import { GMongoMgr } from "./MongoManager";
import * as mongo from 'mongodb';

export class BaseService<T>
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
    protected _t_type:{ new(): T}=null
    constructor(table:string,type: { new(): T})
    {
        this._t_type=type
        this._table=table
    }
    async getNextId()
    {
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
        return rs.one
    }
    async get(proterty?:{},where?:{},sort?:{})
    {
        let rs = await GMongoMgr.findOne(this._table,proterty,where,sort)
        return rs.one
    }
    async getTotal(where?:{})
    {
        let rs = await GMongoMgr.findCount(this._table,where)
        return rs.count
    }
    async gets(property?:{},where?:{},sort?:{},skip=0,limit=0)
    {
        let rs = await GMongoMgr.findMany(this._table,property,where,sort,skip,limit)
        return rs.list
    }
    async getRandoms(num:number,proterty?:{},where?:{})
    {
        let rs = await GMongoMgr.aggregate(this._table,proterty,where,null,num)
        return rs.list
    }
    async updateOne(model,where?:{},upsert=false)
    {
        let rs = await GMongoMgr.updateOne(this._table,model,where,upsert)
        return rs
    }
    async updateMany(models:[],where?:{})
    {
        let rs = await GMongoMgr.updateMany(this._table,models,where)
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
    async createIndex(index:any,options?:mongo.IndexOptions)
    {
        let rs = await GMongoMgr.createIndex(this._table,index,options)
        return rs
    }
}