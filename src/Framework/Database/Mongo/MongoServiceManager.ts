import { MongoBaseService } from "./MongoBaseService";
import { MongoBaseModel } from "./MongoManager";

export class MongoServiceManager
{
    protected _services:{[dbname:string]:{[table:string]:MongoBaseService<any>}}={}
    addService<T extends MongoBaseModel>(table:string,type: { new(): T},dbname="")
    {
        if(!this._services[dbname])
        {
            this._services[dbname]={}
        }
        if(!this._services[dbname][table])
        {
            this._services[dbname][table]=new MongoBaseService(table,type,dbname)
        }
        return this._services[dbname][table] as MongoBaseService<T>
    }
    getService<T extends MongoBaseService<any>>(table:string,dbname="")
    {
        if(!this._services[dbname])
        {
            this._services[dbname]={}
        }
        if(!this._services[dbname][table])
        {
            return null
        }
        return this._services[dbname][table] as T
    }
}

export let gMongoServiceMgr=new MongoServiceManager()