import { EPropertyType, TableProperty, Property } from "./Decorator/Property"
import { GMysqlMgr } from "./MysqlManager"
import { GLog } from "../Logic/Log"
import { GDBCache } from "./Decorator/DBCache"

export class BaseModel
{
    //不能再基类试用修饰器，否则，不同子类会创建同一份table信息
}
export class MysqlBaseService<T extends BaseModel>
{
    protected _table:string=""
    get table()
    {
        return this._table
    }
    get version()
    {
        let table:TableProperty=this._t_type.prototype[TableProperty.key]
        return table.version
    }
    protected _inited=false
    get isInited()
    {
        return this._inited
    }
    protected _t_type:{ new(): T}=null
    constructor(type: { new(): T})
    {
        this._t_type=type
        if(GMysqlMgr.isValid)
        {
            this._init()
        }
        else
        {
            GMysqlMgr.registerInitCb(this._init.bind(this))
        }
    }
    protected async _init()
    {
        if(this._inited)
        {
            return
        }
        this._inited=true
        let table:TableProperty=this._t_type.prototype[TableProperty.key]
        if(!table||!table.table)
        {
            throw new Error("数据表的类必须要具有Table装饰器")
        }
        this._table="`"+table.table+"`"
        if(!GMysqlMgr.cfg.auto)
        {
            //未开启自动创建数据表
            return
        }
        let droped = await this._checkDropTable(table.version);
        if(!droped)
        {
            GLog.info("table("+this._table+")无需升级...")
            //既然版本号没变，就快速返回
            return
        }
        let primary_key:string = null
        let sql = "create table if not exists "+this._table+" ("
        for(let key in table.items)
        {
            let item:Property = table.items[key]
            sql+="`"+key+"`"+" "+item.type
            if(item.type==EPropertyType.Varchar
                ||item.type==EPropertyType.Char
                ||item.type==EPropertyType.NVarchar)
            {
                sql+="("+item.type_len+")";
            }
            if(item.is_notnull)
            {
                sql+=" not null"
            }
            if(item.default!=undefined&&!item.is_primary)
            {
                sql+= " default \'"+item.default+"\'"
            }
            if(item.auto_increment)
            {
                sql+= " auto_increment"
            }
            if(item.is_primary)
            {
                primary_key=key
            }
            sql+=","
        }
        if(primary_key)
        {
            sql+="primary key (`"+primary_key+"`),"
            sql+="unique key `"+primary_key+"_unique` (`"+primary_key+"`)"
        }
        else
        {
            //去掉最后一个逗号
            sql=sql.substr(0,sql.length-1)
        }
        sql+=")"
        sql+=" engine="+table.engine
        if(table.auto_increment!=null)
        {
            sql+=" auto_increment="+table.auto_increment
        }
        sql+=" default charset="+table.charset
        if(table.comment)
        {
            sql+=" comment=\'"+table.comment+"\';"
        }
        let sr = await GMysqlMgr.query(sql)
        if(sr.error)
        {
            GLog.error(sr.error)
            throw Error("table("+this._table+")创建失败...")
        }
        else
        {
            GDBCache.setVersion(this.table,table.version);

            GLog.info("table("+this._table+")初始化成功...")
            await this._onReCreated()
        }
    }
    protected async _onReCreated()
    {

    }
    protected async _onDroped()
    {

    }
    protected async _checkDropTable(cur_version:number)
    {
        let local_version = GDBCache.getVersion(this._table)
        if(local_version==cur_version)
        {
            return false
        }
        let sql="drop table if exists "+this._table
        let sr = await GMysqlMgr.query(sql)
        if(sr.error)
        {
            GLog.error(sr.error)
            throw Error(sr.error)
        }
        else
        {
            GLog.info("table("+this._table+")删除成功...")
            await this._onDroped()
        }
        return true
    }
    /**
     * 没有id的表不能使用该函数
     * @param id 
     */
    async getById(id:any)
    {
        let tm:T=null
        let sr=await GMysqlMgr.query("select * from "+this._table+" where id=? limit 1",[id])
        if(sr.error||sr.results.length<=0)
        {
            return tm
        }
        tm=sr.results[0]
        return tm
    }
    async get(proterty?:string,where?:string,args?:Array<any>)
    {
        let sql="select "
        sql+=proterty||"*"
        sql+=" from "+this._table
        if(where)
        {
            sql+=" where "+where
        }
        sql+=" limit 1"
        let tm=null
        let sr=await GMysqlMgr.query(sql,args)
        if(sr.list&&sr.list.length>0)
        {
            tm = sr.list[0]
        }
        return tm
    }
    async getTotal(where?:string,args?:Array<any>)
    {
        let sql="select "
        sql+="count(*) as num"
        sql+=" from "+this._table
        if(where)
        {
            sql+=" where "+where
        }
        let total=0
        let sr=await GMysqlMgr.query(sql,args)
        if(sr.list&&sr.list.length>0)
        {
            total=sr.list[0].num||0
        }
        return total
    }
    async gets(proterty?:string,where?:string,args?:Array<any>)
    {
        let sql="select "
        sql+=proterty||"*"
        sql+=" from "+this._table
        if(where)
        {
            sql+=" where "+where
        }
        let tms:Array<any>=null
        let sr=await GMysqlMgr.query(sql,args)
        tms = sr.list
        return tms
    }
    async getCount(where?:string,args?:Array<any>)
    {
        let sql="select count(*) as num from "+this._table
        if(where)
        {
            sql+=" where "+where
        }
        let sr=await GMysqlMgr.query(sql,args)
        if(sr.error||sr.results.length<=0)
        {
            return 0
        }
        return sr.results[0]["num"]||0
    }
    async getRandoms(num:number,proterty?:string,where?:string,args?:Array<any>)
    {
        num=num||5
        let sql="select "
        sql+=proterty||"*"
        sql+=" from "+this._table
        if(where)
        {
            sql+=" where "+where
        }
        sql+=" order by rand() limit ?"
        args=args||[]
        args.push(num)
        let tms:Array<any>=null
        let sr=await GMysqlMgr.query(sql,args)
        tms = sr.list
        return tms
    }
    async updateProperty(set:string,where?:string,args?:Array<any>,limit?:number)
    {
        let sql = "update "+this._table+" set "
        if(set)
        {
            sql+=set
        }
        else
        {
            sql+="?"
        }
        if(where)
        {
            sql+=" where "+where
        }
        if(limit)
        {
            sql+=" limit "+limit
        }
        let sr = await GMysqlMgr.query(sql,args)
        return sr
    }
    async update(model:T,where?:string,args?:Array<any>,limit?:number)
    {
        let sql = "update "+this._table+" set ?"
        if(!where)
        {
            where = " id=?"
        }
        sql+=" where "+where
        let id = model["id"]
        delete model["id"]
        let u_m:T=JSON.parse(JSON.stringify(model))
        if(!args)
        {
            args=[u_m,id]
        }
        else
        {
            args.unshift(u_m)
        }
        if(limit)
        {
            sql+=" limit "+limit
        }
        let sr = await GMysqlMgr.query(sql,args)
        if(id)
        {
            model["id"]=id
        }
        return sr
    }
    async insert(model:T,ip?:string)
    {
        let table:TableProperty = model[TableProperty.key]
        let id_property:Property = table.items["id"]
        if(id_property)
        {
            if(id_property.auto_increment)
            {
                delete model["id"]
            }
        }
        if(table.items["create_time"]&&model["create_time"]<=0)
        {
            model["create_time"]=Date.now()
        }
        if(table.items["create_ip"]&&ip)
        {
            model["create_ip"]=ip
        }
        let sql = "insert into "+this._table+" set ?"
        //这步的做法是为了去掉model种的TableProperty.key(___table___)
        model = JSON.parse(JSON.stringify(model))
        let sr = await GMysqlMgr.query(sql,[model])
        return sr
    }
    async removeById(id:any)
    {
        let sql = "delete from "+this._table+" where id=?"
        let sr = await GMysqlMgr.query(sql,[id])
        return sr
    }
    async remove(where:string,args?:Array<any>)
    {
        let sql = "delete from "+this._table+" where "+where
        let sr = await GMysqlMgr.query(sql,args)
        return sr
    }
}