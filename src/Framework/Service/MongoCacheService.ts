import { GCgServer } from "../cgserver"
import { MongoBaseService } from "../Database/MongoBaseService"
import { MongoBaseModel } from "../Database/MongoManager"

//暂时就用这个了，反正没啥用户
export class MongoCacheModel extends MongoBaseModel
{
    key:string=""
    data=null
    expireAt=Date.now()+365*24*60*60*1000
}

export let GMongoCacheSer:MongoCacheService=null
class MongoCacheService extends MongoBaseService<MongoCacheModel>
{
    constructor()
    {
        super("cache",MongoCacheModel)
        GCgServer.addListener("start",()=>
        {
            this.createIndex({key:1})
            this.createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )
        })
    }
    async getData(key:string)
    {
        let cm:MongoCacheModel = await this.get(null,{key:key})
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
        let rs = await this.updateOne(mcm,{key:mcm.key},true)
        if(rs.rs.upsertedCount<=0)
        {
            return null
        }
        return mcm
    }
}
GMongoCacheSer = new MongoCacheService()