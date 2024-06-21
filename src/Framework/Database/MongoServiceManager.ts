import { GLog } from "../Logic/Log"
import { MongoBaseService } from "./MongoBaseService"
import { GMongoMgr, MongoBaseModel } from "./MongoManager"

class MongoServiceManager
{
    protected _dbservicess:{[dbname:string]:{[classname:string]:MongoBaseService<MongoBaseModel>}}={}
    add(ser:MongoBaseService<MongoBaseModel>)
    {
        let dbname=ser.dbname
        if(!this._dbservicess[dbname])
        {
            this._dbservicess[dbname]={}
        }
        let classname=ser.constructor.name
        if(this._dbservicess[dbname][classname])
        {
            GLog.error("same db created duplicated service:"+classname)
            return
        }
        this._dbservicess[dbname][classname]=ser
    }
    getService<T extends MongoBaseService<MongoBaseModel>>(type:{new():T},dbname=""):T
    {
        if(!dbname)
        {
            dbname=GMongoMgr.defdbname
        }
        //后有defdbname，所以检测一下，把之前的空转换为defname
        if(dbname&&this._dbservicess[""])
        {
            if(!this._dbservicess[dbname])
            {
                this._dbservicess[dbname]={}
            }
            for(let key in this._dbservicess[""])
            {
                let ser = this._dbservicess[""][key]
                this._dbservicess[dbname][key]=ser
            }
            this._dbservicess[""]=undefined
            delete this._dbservicess[""]
        }
        //正式逻辑
        let dbservices = this._dbservicess[dbname]
        let classname=type.name
        if(!dbservices)
        {
            this._dbservicess[dbname]={}
        }
        if(!dbservices[classname])
        {
            //mongobaseservice 会掉add
            new type()
        }
        return dbservices[classname] as T
    }
}
export let GMongoSerMgr=new MongoServiceManager()