import mongoose from "mongoose"
import { MongoBaseService } from "../Database/Mongo/MongoBaseService"

//暂时就用这个了，反正没啥用户
export interface IMongoCacheModel extends mongoose.Document
{
    key:string
    data:any
    expireAt:Date
}

let mongoCacheSchema=new mongoose.Schema({
    key:{type:String,required:true},
    data:{type:Object,required:true},
    expireAt:{type:Date,default:new Date(Date.now()+365*24*60*60*1000),require:true}
})

/**
 * mongo版本的缓存服务
 * 可以用来缓存kv数据
 */
export class MongoCacheService extends MongoBaseService<IMongoCacheModel>
{
    constructor()
    {
        super("cache",mongoCacheSchema)
    }
    async getData(key:string)
    {
        let cm:IMongoCacheModel = await this.findOne({key:key})
        if(!cm)
        {
            return null
        }
        if(cm.expireAt.getTime()<Date.now())
        {
            return null
        }
        return cm.data
    }
    async addData(key:string,data:any,expireAt?:Date)
    {
        let m:Partial<IMongoCacheModel> = {key:key,data:data}
        if(expireAt)
        {
            m.expireAt=expireAt
        }
        let rs = await this.insert(m)
        return rs.model
    }
}

export let gMongoCacheSer=new MongoCacheService()