import { MSSqlConfig } from "../Database/MSSql/MSSqlManager"
import { MongoConfig } from "../Database/Mongo/MongoManager"
import { MysqlConfig } from "../Database/Mysql/MysqlManager"
import { RedisConfig } from "../Database/RedisManager"

export class DbConfig
{
    redis=new RedisConfig()
    mongos:MongoConfig[]=[]
    mongo:MongoConfig=null
    mysql=new MysqlConfig()
    mssql=new MSSqlConfig()
}