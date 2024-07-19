import { MongoBaseService } from "../Database/Mongo/MongoBaseService"
import { MongoBaseModel } from "../Database/Mongo/MongoManager"
import { gCgServer } from "../cgserver"

//暂时就用这个了，反正没啥用户
export class MongoCacheModel extends MongoBaseModel
{
    key:string=""
    data=null
    expireAt=Date.now()+365*24*60*60*1000
}
/**
 * mongo版本的缓存服务
 * 可以用来缓存kv数据
 */
export class MongoCacheService extends MongoBaseService<MongoCacheModel>
{
    constructor()
    {
        super("cache",MongoCacheModel)
        gCgServer.addListener("start",()=>
        {
            if(!this.mongoDb)
            {
                //客户端未开启mongo
                return
            }
            this.createIndex({key:1})
            this.createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )
        })
    }
    async getData(key:string)
    {
        let cm:MongoCacheModel = await this.get({key:key})
        if(!cm)
        {
            return null
        }
        return cm.data
    }
    async addData(key:string,data:any,expireAt=Date.now()+365*24*60*60*1000)
    {
        let mcm = new MongoCacheModel()
        mcm.key=key
        mcm.data=data
        mcm.expireAt=expireAt
        let rs = await this.updateOne({key:mcm.key},mcm,true)
        if(rs.rs.upsertedCount<=0)
        {
            return null
        }
        return mcm
    }
}

export let gMongoCacheSer=new MongoCacheService()