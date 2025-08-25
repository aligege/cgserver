import mongoose, { FilterQuery, UpdateQuery, Types, MongooseQueryOptions, Schema } from 'mongoose';
import { gLog } from '../../Logic/Log';
import { gMongoMgr, IMongoBaseModel, MongoExt } from './MongoManager';
import { SyncCall2  } from '../../Decorator/SyncCall';
import _ from 'underscore';

export class MongoBaseService<T extends IMongoBaseModel>
{
    protected _model: mongoose.Model<T>;
    protected _schema: mongoose.Schema<T>;
    protected _collection_name: string;
    protected _dbname=""
    protected _mongo:MongoExt=null
    get mongo()
    {
        if(!this._mongo)
        {
            this._mongo = gMongoMgr.getMongo(this._dbname);
        }
        return this._mongo
    }
    get model()
    {
        if(this._model)
        {
            return this._model
        }
        if(!this.mongo)
        {
            gLog.error("MongoDB connection is not established, please check the connection settings.");
            throw new Error("MongoDB connection is not established");
        }
        if(!this.mongo.connected)
        {
            gLog.error("MongoDB connection is not ready, please check the connection settings. Current state: " + mongoose.connection.readyState);
            throw new Error("MongoDB connection is not ready");
        }
        let db = this.mongo.connection.db;
        if(!db||db.databaseName=="test")
        {
            gLog.error("MongoDB connection is not valid, please check the connection settings.");
            throw new Error("MongoDB connection is not valid");
        }
        this._model = this.mongo.connection.model<T>(this._collection_name, this._schema)
        return this._model;
    }

    constructor(collection_name: string, schema: mongoose.Schema<T>,dbname?:string)
    {
        this._collection_name = collection_name;
        schema.set('collection', collection_name);
        this._schema = schema;
        this._schema.set('minimize', false);
        this._dbname=dbname
    }

    async findOne(filter?: FilterQuery<T>, projection?: any, options?: any): Promise<T | null>
    {
        let ret = await this.mongo.findOne<T>(this.model, filter, projection, options);
        return ret;
    }

    async find(filter?: FilterQuery<T>, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T[]>
    {
        let ret = await this.mongo.find<T>(this.model, filter, projection, options);
        return ret;
    }

    async findById(id: string | Types.ObjectId, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions)
    {
        let ret = await this.mongo.findById<T>(this.model, id, projection, options);
        return ret;
    }

    async create(doc: Partial<T>): Promise<T>
    {
        let ret = await this.mongo.create<T>(this.model, doc);
        return ret;
    }

    async insert(doc: Partial<T>)
    {
        let ret = await this.mongo.insert<T>(this.model, doc);
        return ret;
    }

    async updateOne(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        let ret = await this.mongo.updateOne<T>(this.model, filter, update, options);
        return ret
    }

    async updateMany(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        let ret = await this.mongo.updateMany<T>(this.model, filter, update, options);
        return ret;
    }

    async deleteOne(filter: FilterQuery<T>)
    {
        let ret = await this.mongo.deleteOne<T>(this.model, filter);
        return ret
    }

    async deleteMany(filter: FilterQuery<T>)
    {
        let ret = await this.mongo.deleteMany<T>(this.model, filter);
        return ret;
    }

    async exists(filter: FilterQuery<T>): Promise<boolean>
    {
        let ret = await this.mongo.exists<T>(this.model, filter);
        return ret;
    }

    // 用于聚合查询
    aggregate(pipeline?: any[])
    {
        let ret = this.mongo.aggregate<T>(this.model, pipeline);
        return ret;
    }

    // findOneAndUpdate method for MongoDB operations
    async findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: MongooseQueryOptions)
    {
        let ret = await this.mongo.findOneAndUpdate<T>(this.model, filter, update, options);
        return ret
    }

    async countDocuments(filter?: FilterQuery<T>): Promise<number>
    {
        let ret = await this.mongo.countDocuments<T>(this.model, filter);
        return ret;
    }

    async getAutoIds(): Promise<number>
    {
        let id = await GMongoAutoIdsSer.getIncressId(this._collection_name)
        return id
    }
}

export interface IAutoIdModel extends IMongoBaseModel
{
    autoid:number
}

const autoIdSchema = new Schema<IAutoIdModel>({
    _id:{ type: String, index: { unique: true } },
    autoid:{ type: Number, required: true, default: 0 }
},{id:false});

autoIdSchema.virtual('id').get(function() {
    return this._id
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

export let GMongoAutoIdsSer = new MongoAutoIdsService()