import mongoose, { Document, FilterQuery, UpdateQuery, Types, mongo, MongooseQueryOptions } from 'mongoose';
import { EErrorCode, Errcode } from '../../Config/_error_';
import { gLog } from '../../Logic/Log';
import { gMongoMgr, IMongoBaseModel } from './MongoManager';
export class MongoBaseService<T extends IMongoBaseModel>
{
    protected _model: mongoose.Model<T>;
    protected _schema: mongoose.Schema<T>;
    protected _collection_name: string;
    get model()
    {
        if(this._model)
        {
            return this._model
        }
        if(mongoose.connection.readyState !== 1)
        {
            gLog.error("MongoDB connection is not ready, please check the connection settings. Current state: " + mongoose.connection.readyState);
            throw new Error("MongoDB connection is not ready");
        }
        let db = mongoose.connection.db
        if(!db||db.databaseName=="test")
        {
            gLog.error("MongoDB connection is not valid, please check the connection settings.");
            throw new Error("MongoDB connection is not valid");
        }
        this._model = mongoose.model<T>(this._collection_name, this._schema)
        return this._model;
    }

    constructor(collection_name: string, schema: mongoose.Schema<T>)
    {
        this._collection_name = collection_name;
        schema.set('collection', collection_name);
        this._schema = schema;
        this._schema.set('minimize', false);
    }

    async findOne(filter?: FilterQuery<T>, projection?: any, options?: any): Promise<T | null>
    {
        let ret = await gMongoMgr.getMongo().findOne<T>(this.model, filter, projection, options);
        return ret;
    }

    async find(filter?: FilterQuery<T>, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T[]>
    {
        let ret = await gMongoMgr.getMongo().find<T>(this.model, filter, projection, options);
        return ret;
    }

    async findById(id: string | Types.ObjectId, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions)
    {
        let ret = await gMongoMgr.getMongo().findById<T>(this.model, id, projection, options);
        return ret;
    }

    async create(doc: Partial<T>): Promise<T>
    {
        let ret = await gMongoMgr.getMongo().create<T>(this.model, doc);
        return ret;
    }

    async insert(doc: Partial<T>)
    {
        let ret = await gMongoMgr.getMongo().insert<T>(this.model, doc);
        return ret;
    }

    async updateOne(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        let ret = await gMongoMgr.getMongo().updateOne<T>(this.model, filter, update, options);
        return ret
    }

    async updateMany(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        let ret = await gMongoMgr.getMongo().updateMany<T>(this.model, filter, update, options);
        return ret;
    }

    async deleteOne(filter: FilterQuery<T>)
    {
        let ret = await gMongoMgr.getMongo().deleteOne<T>(this.model, filter);
        return ret
    }

    async deleteMany(filter: FilterQuery<T>)
    {
        let ret = await gMongoMgr.getMongo().deleteMany<T>(this.model, filter);
        return ret;
    }

    async exists(filter: FilterQuery<T>): Promise<boolean>
    {
        let ret = await gMongoMgr.getMongo().exists<T>(this.model, filter);
        return ret;
    }

    // 用于聚合查询
    aggregate(pipeline?: any[])
    {
        let ret = gMongoMgr.getMongo().aggregate<T>(this.model, pipeline);
        return ret;
    }

    // findOneAndUpdate method for MongoDB operations
    async findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: MongooseQueryOptions)
    {
        let ret = await gMongoMgr.getMongo().findOneAndUpdate<T>(this.model, filter, update, options);
        return ret
    }

    async countDocuments(filter?: FilterQuery<T>): Promise<number>
    {
        let ret = await gMongoMgr.getMongo().countDocuments<T>(this.model, filter);
        return ret;
    }

    async getAutoIds(): Promise<number>
    {
        let id = await gMongoMgr.getMongo().getAutoIds(this.model.collection.name)
        return id
    }
}