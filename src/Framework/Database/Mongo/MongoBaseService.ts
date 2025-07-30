import mongoose, { Document, FilterQuery, UpdateQuery, Types, mongo, MongooseQueryOptions } from 'mongoose';
import { EErrorCode, Errcode } from '../../Config/_error_';
import { gLog } from '../../Logic/Log';
import { gMongoMgr } from './MongoManager';

export class MongoBaseService<T extends Document>
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
    }

    async findOne(filter?: FilterQuery<T>, projection?: any, options?: any): Promise<T | null>
    {
        filter = this._convertFilter(filter);
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        let one = await this.model.findOne(filter, projection, options).lean()
        return one as T | null;
    }

    async find(filter?: FilterQuery<T>, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T[]>
    {
        filter = this._convertFilter(filter);
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        let list = await this.model.find(filter, projection, options).lean() as T[];
        return list;
    }

    async findById(id: string | Types.ObjectId, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T | null>
    {
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        return await this.model.findById(id, projection, options) as T | null;
    }

    async create(doc: Partial<T>): Promise<T>
    {
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        const newDoc = new this.model(doc);
        return await newDoc.save() as T;
    }

    async insert(doc: Partial<T>): Promise<{ errcode: Errcode, model?: T }>
    {
        try
        {
            if (!this.model)
            {
                throw new Error("Model is not defined");
            }
            const newDoc = await this.model.insertOne(doc);
            return { errcode: null, model: newDoc };
        } catch (error)
        {
            gLog.error(arguments)
            gLog.error("MongoDB insert error:", error.stack);
            return { errcode: EErrorCode.Mongo_Error, model: null };
        }
    }

    async updateOne(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    ): Promise<{ errcode?: Errcode,rs?:mongoose.UpdateResult }>
    {
        try
        {
            filter = this._convertFilter(filter);
            if (!this.model)
            {
                throw new Error("Model is not defined");
            }
            let rs = await this.model.updateOne(filter, update, options);
            return { errcode: null,rs:rs };
        } catch (error)
        {
            return { errcode: EErrorCode.Mongo_Error,rs:null };
        }
    }

    async updateMany(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    ): Promise<{ errcode: null } | { errcode: any }>
    {
        try
        {
            filter = this._convertFilter(filter);
            if (!this.model)
            {
                throw new Error("Model is not defined");
            }
            await this.model.updateMany(filter, update, options);
            return { errcode: null };
        } catch (error)
        {
            return { errcode: error };
        }
    }

    async deleteOne(filter: FilterQuery<T>): Promise<{ errcode: Errcode, rs?: mongoose.DeleteResult }>
    {
        try
        {
            filter = this._convertFilter(filter);
            if (!this.model)
            {
                throw new Error("Model is not defined");
            }
            let rs = await this.model.deleteOne(filter);
            return { errcode: null, rs: rs };
        } catch (error)
        {
            return { errcode: EErrorCode.Mongo_Error, rs: null };
        }
    }

    async deleteMany(filter: FilterQuery<T>): Promise<{ errcode: null } | { errcode: any }>
    {
        try
        {
            filter = this._convertFilter(filter);
            if (!this.model)
            {
                throw new Error("Model is not defined");
            }
            await this.model.deleteMany(filter);
            return { errcode: null };
        } catch (error)
        {
            return { errcode: error };
        }
    }

    async exists(filter: FilterQuery<T>): Promise<boolean>
    {
        filter = this._convertFilter(filter);
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        const doc = await this.model.findOne(filter, { _id: 1 });
        return !!doc;
    }

    // 用于聚合查询
    aggregate(pipeline?: any[])
    {
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        return this.model.aggregate(pipeline);
    }

    // findOneAndUpdate method for MongoDB operations
    async findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: MongooseQueryOptions)
    {
        filter = this._convertFilter(filter);
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        let rs = await this.model.findOneAndUpdate(filter, update, options)
        return rs
    }

    async countDocuments(filter?: FilterQuery<T>): Promise<number>
    {
        filter = this._convertFilter(filter);
        if (!this.model)
        {
            throw new Error("Model is not defined");
        }
        return await this.model.countDocuments(filter);
    }
    protected _convertFilter(filter: FilterQuery<T>): FilterQuery<T>
    {
        if (!filter)
        {
            return {};
        }
        if(filter.id && typeof filter.id === 'string')
        {
            filter._id = new Types.ObjectId(filter.id);
            delete filter.id;
        }
        else if(filter.id)
        {
            filter._id = filter.id;
            delete filter.id;
        }
        return filter;
    }

    async getAutoIds(): Promise<number>
    {
        let id = await gMongoMgr.getMongo().getAutoIds(this.model.collection.name)
        return id
    }
}