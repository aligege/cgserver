import { MSSqlConfig } from "../Database/MSSqlManager"
import { MongoConfig } from "../Database/MongoManager"
import { MysqlConfig } from "../Database/MysqlManager"
import { RedisConfig } from "../Database/RedisManager"

export class DbConfig
{
    redis=new RedisConfig()
    mongo=new MongoConfig()
    mysql=new MysqlConfig()
    mssql=new MSSqlConfig()
}