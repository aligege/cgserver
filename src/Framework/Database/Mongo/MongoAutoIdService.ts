import { Schema } from "mongoose";
import { IMongoBaseModel } from "./MongoManager";
import { MongoBaseService } from "./MongoBaseService";
import { SyncCall2 } from "../../Decorator/SyncCall";
import _ from "underscore";
export interface IAutoIdModel extends IMongoBaseModel
{
    autoid:number
}

const autoIdSchema = new Schema<IAutoIdModel>({
    autoid:{ type: Number, required: true, default: 0 }
});

class MongoAutoIdsService extends MongoBaseService<IAutoIdModel>
{
    constructor()
    {
        super('auto_ids', autoIdSchema);
    }
    @SyncCall2(0)
    async getIncressId(key:string)
    {
        let md = await this.findOneAndUpdate({ _id: key }, { $inc: { autoid: 1 } }, { upsert: true })
        if (md && md.autoid)
        {
            return md.autoid + 1
        }
        return -_.random(2,999999999)
    }
}

export let GMongoAutoIdsService = new MongoAutoIdsService()