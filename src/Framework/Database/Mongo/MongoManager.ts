import { Types, UpdateQuery } from 'mongoose';
import { EErrorCode } from '../../Config/_error_';
import { core } from '../../Core/Core';
import { gLog } from '../../Logic/Log';
import mongoose, { FilterQuery, MongooseQueryOptions } from 'mongoose';
import { MongoActionCheck } from '../../Decorator/MongoActionCheck';
export interface IMongoBaseModel
{
    _id: any; // 使用ObjectId作为主键
    id: any;
}
export class MongoConfig
{
    open = false
    host = "127.0.0.1"
    port = 27017
    options: mongoose.ConnectOptions = null
    database = 'mongodb'
    //决定是否显示mongo的执行时间等日志
    debug = false
}
export class MrResult
{
    /**
     * select 的数据量
     */
    length: number = 0
    /**
     * 插入数据的自增id
     */
    insertId: number = null
    insertIds: { [key: number]: number } = null
    /**
     * update 更新数据的影响条数
     */
    changedRows: number = null
    /**
     * 插入或删除数据的影响条数
     */
    affectedRows: number = null
}
export class MgReturn
{
    error = null
    result = new MrResult()
    list = []
}
export class MongoManager
{
    protected _dbs: { [key: string]: MongoExt } = {}
    protected _defdbname = ""
    get defdbname()
    {
        return this._defdbname
    }
    //初始化多个数据库，第一个open数据库为默认数据库
    async init(cfgs: MongoConfig[])
    {
        for (let i = 0; i < cfgs.length; ++i)
        {
            let cfg = cfgs[i]
            let ret = await this.addMongo(cfg)
            if (!ret)
            {
                return false
            }
        }
        return true
    }
    async addMongo(cfg: MongoConfig)
    {
        if (this._dbs[cfg.database])
        {
            gLog.error("数据库配置得database不能相同!database=" + cfg.database)
            return false
        }
        let mongoext = new MongoExt()
        let ret = await mongoext.init(cfg)
        if (!ret)
        {
            gLog.error("数据库初始化失败!cfg=" + JSON.stringify(cfg))
            return false
        }
        this._dbs[cfg.database] = mongoext
        if (!this._defdbname)
        {
            this._defdbname = cfg.database
        }
        return true
    }
    async removeMongo(dbname: string, force = false)
    {
        let mongo = this.getMongo(dbname)
        if (!mongo)
        {
            return false
        }
        mongo.close(force)
    }
    getMongo(dbname = ""):MongoExt|null
    {
        if (!dbname)
        {
            dbname = this._defdbname
        }
        if(!dbname)
        {
            return null
        }
        return this._dbs[dbname]
    }
}
export class MongoExt
{
    protected _mongocfg: MongoConfig = null
    protected _init_cbs = []
    protected _mongo_init_succ: boolean = false
    protected _inited: boolean = false
    protected _cur_connecting_count = 0
    get curConnectingCount()
    {
        return this._cur_connecting_count
    }
    get isValid()
    {
        return this._inited
    }
    get debug()
    {
        return this._mongocfg.debug
    }
    protected _connection: mongoose.Connection = null
    get connection()
    {
        return this._connection;
    }
    get connected()
    {
        return this._connection && this._connection.readyState === 1;
    }
    constructor()
    {

    }
    @MongoActionCheck(false)
    async init(cfg: MongoConfig)
    {
        if (!cfg || !cfg.open)
        {
            return false
        }
        if (this._inited)
        {
            return false
        }
        this._mongocfg = cfg
        this._inited = true
        gLog.info("mongo config=" + JSON.stringify(this._mongocfg))
        this._mongocfg.options.dbName = this._mongocfg.database
        this._connection = mongoose.createConnection("mongodb://" + this._mongocfg.host + ":" + this._mongocfg.port, this._mongocfg.options)
        this._connection = this._connection.useDb(this._mongocfg.database)
        this._connection.on("open", this.onOpen.bind(this));
        this._connection.on("close", this.onClose.bind(this));
        this._connection.on("connectionCreated", this.onConnect.bind(this))
        this._connection.on("connectionClosed", this.onDisconnect.bind(this))
        await this._connection.asPromise()
        console.log("mongo connect success! db=" + this._connection.name)
        return true
    }
    onConnect()
    {
        this._cur_connecting_count++
    }
    onDisconnect()
    {
        this._cur_connecting_count--
    }
    close(force = false)
    {
        mongoose.connection.close(force)
    }
    registerInitCb(cb: Function)
    {
        this._init_cbs.push(cb)
    }
    onOpen()
    {
        this._mongo_init_succ = true
        gLog.info("mongo has opened!")
        for (let i = 0; i < this._init_cbs.length; ++i)
        {
            this._init_cbs[i]()
        }
        this._init_cbs = []
    }
    onClose()
    {
        this._mongo_init_succ = false
        gLog.info("mongo has closed!")
        this._inited = false
        //this.init(this._mongocfg)
    }
    async getConnectionStats()
    {
        const stats = await this._connection.db.admin().serverStatus();
        let current = stats.connections.current;
        let available = stats.connections.available;
        return { current, available };
    }
    onError(err: Error)
    {
        gLog.error(err)
    }
    /**
     * 获取自增长id
     * @param key 
     * @returns 小于等于0为异常
     */
    @MongoActionCheck(-1)
    async getAutoIds(key: string): Promise<number>
    {
        let collection = "auto_ids"
        let col = mongoose.connection.collection(collection);
        let where = { _id: key }
        let rs = await core.safeCall(col.findOneAndUpdate, col, where, { $inc: { id: 1 } }, { upsert: true })
        if (rs && rs.id)
        {
            return rs.id + 1
        }
        return 1
    }
    @MongoActionCheck(null)
    async findOne<T>(model: mongoose.Model<T>, filter?: FilterQuery<T>, projection?: any, options?: any): Promise<T | null>
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return null
        }
        let one = await model.findOne(filter, projection, options).lean() as T | null;
        this._convertId(one);
        return one;
    }
    @MongoActionCheck([])
    async find<T>(model: mongoose.Model<T>, filter?: FilterQuery<T>, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T[]>
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return [];
        }
        let list = await model.find(filter, projection, options).lean() as T[];
        list.forEach(one =>
        {
            this._convertId(one);
        });
        return list;
    }
    @MongoActionCheck(null)
    async findById<T>(model: mongoose.Model<T>, id: any, projection?: mongoose.ProjectionType<T>, options?: MongooseQueryOptions): Promise<T | null>
    {
        if (!model)
        {
            gLog.error("Model is not defined");
            return null;
        }
        let one = await model.findById(id, projection, options).lean() as T | null;
        this._convertId(one);
        return one;
    }
    @MongoActionCheck(null)
    async create<T>(model: mongoose.Model<T>, doc: Partial<T>): Promise<T>
    {
        if (!model)
        {
            gLog.error("Model is not defined");
            return null;
        }
        const newDoc = new model(doc);
        let one = await newDoc.save() as T;
        return one;
    }
    @MongoActionCheck(null)
    async insert<T>(model: mongoose.Model<T>, doc: Partial<T>): Promise<T>
    {
        if (!model)
        {
            gLog.error("Model is not defined");
            return null;
        }
        const newDoc = await model.insertOne(doc);
        return newDoc
    }
    @MongoActionCheck(null)
    async updateOne<T>(
        model: mongoose.Model<T>,
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return null;
        }
        let rs = await model.updateOne(filter, update, options);
        return rs
    }
    @MongoActionCheck(null)
    async updateMany<T>(
        model: mongoose.Model<T>,
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        options?: any
    )
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return null
        }
        let rs = await model.updateMany(filter, update, options);
        return rs
    }
    @MongoActionCheck(-2)
    async deleteOne<T>(model: mongoose.Model<T>, filter: FilterQuery<T>)
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return -1
        }
        let rs = await model.deleteOne(filter);
        return rs.deletedCount || 0;
    }
    @MongoActionCheck(-2)
    async deleteMany<T>(model: mongoose.Model<T>, filter: FilterQuery<T>)
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return -1
        }
        let rs = await model.deleteMany(filter);
        return rs.deletedCount || 0;
    }
    @MongoActionCheck(false)
    async exists<T>(model: mongoose.Model<T>, filter: FilterQuery<T>): Promise<boolean>
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return false;
        }
        const doc = await model.findOne(filter, { _id: 1 });
        return !!doc;
    }
    @MongoActionCheck(null)
    // 用于聚合查询
    aggregate<T>(model: mongoose.Model<T>, pipeline?: any[])
    {
        if (!model)
        {
            gLog.error("Model is not defined");
            return null
        }
        let agg = model.aggregate(pipeline);
        return agg;
    }

    @MongoActionCheck(null)
    async findOneAndUpdate<T>(model: mongoose.Model<T>, filter: FilterQuery<T>, update: UpdateQuery<T>, options?: MongooseQueryOptions)
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return null;
        }
        let one = await model.findOneAndUpdate(filter, update, options).lean() as T | null;
        this._convertId(one);
        return one
    }

    @MongoActionCheck(-2)
    async countDocuments<T>(model: mongoose.Model<T>, filter?: FilterQuery<T>): Promise<number>
    {
        filter = this._convertFilter(filter);
        if (!model)
        {
            gLog.error("Model is not defined");
            return -1
        }
        let count = await model.countDocuments(filter);
        return count
    }
    protected _convertFilter(filter: any)
    {
        if (!filter)
        {
            return {};
        }
        if (filter.id && typeof filter.id === 'string')
        {
            filter._id = new Types.ObjectId(filter.id);
            delete filter.id;
        }
        else if (filter.id)
        {
            filter._id = filter.id;
            delete filter.id;
        }
        return filter;
    }
    protected _convertId(one: any)
    {
        if (!one)
        {
            return one;
        }
        if (typeof one._id === 'object' && one._id instanceof Types.ObjectId)
        {
            one.id = one._id.toString();
        }
        else
        {
            one.id = one._id;
        }
        return one;
    }
}

export let gMongoMgr = new MongoManager()