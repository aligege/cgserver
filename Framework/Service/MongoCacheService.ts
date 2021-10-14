import { BaseService } from "../Database/BaseMongoService"
import { MongoBaseModel } from "../Database/MongoManager"

//暂时就用这个了，反正没啥用户
export class MongoCacheModel extends MongoBaseModel
{
    key:string=""
    data=null
    expireAt=Date.now()+365*24*60*60*1000
}

export let GMongoCacheSer:MongoCacheService=null
class MongoCacheService extends BaseService<MongoCacheModel>
{
    constructor()
    {
        super("cache",MongoCacheModel)
        this.createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )
    }
    async getData(key:string)
    {
        let cm:MongoCacheModel = await GMongoCacheSer.get(null,{key:key})
        if(!cm)
        {
            return null
        }
        return cm.data
    }
}
GMongoCacheSer = new MongoCacheService()