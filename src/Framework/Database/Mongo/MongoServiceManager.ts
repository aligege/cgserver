import { core } from "../../index_export_";
import { MongoBaseService } from "./MongoBaseService";
import { MongoBaseModel, gMongoMgr } from "./MongoManager";

export class MongoServiceManager
{
    protected _services:{[dbname:string]:{[table:string]:MongoBaseService<MongoBaseModel>}}={}
    addService<T extends MongoBaseService<MongoBaseModel>>(service: T)
    {
        let dbname = service.dbname
        dbname=this._tryDef(dbname)
        let table = service.table
        if(!this._services[dbname][table])
        {
            this._services[dbname][table]=service
        }
        return this._services[dbname][table] as T
    }
    protected _tryDef(dbname:string)
    {
        if(!dbname)
        {
            dbname=gMongoMgr.defdbname
            if(dbname&&!this._services[dbname])
            {
                this._services[dbname]=this._services[""]
                delete this._services[""]
            }
        }
        else
        {
            if(dbname==gMongoMgr.defdbname&&!this._services[dbname])
            {
                this._services[dbname]=this._services[""]
                delete this._services[""]
            }
        }
        if(!this._services[dbname])
        {
            this._services[dbname]={}
        }
        return dbname
    }
    getService<T extends MongoBaseService<MongoBaseModel>>(table:T|string,dbname="")
    {
        dbname=this._tryDef(dbname)
        let tablename=""
        if(core.isString(table))
        {
            tablename=table as string
        }
        else
        {
            tablename=(table as T).table
        }
        if(!this._services[dbname][tablename])
        {
            return null
        }
        return this._services[dbname][tablename] as T
    }
}

export let gMongoServiceMgr=new MongoServiceManager()