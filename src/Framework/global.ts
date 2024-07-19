import { TriggerManager } from './AI/TriggerMgr';
import { IServerConfig } from './Config/IServerConfig';
import { ByteTool } from './Core/ByteTool';
import { DBCache } from './Database/Decorator/DBCache';
import { MSSqlManager } from './Database/MSSqlManager';
import { MongoManager } from './Database/Mongo/MongoManager';
import { MongoServiceManager } from './Database/Mongo/MongoServiceManager';
import { MysqlManager } from './Database/MysqlManager';
import { RedisManager } from './Database/RedisManager';
import { CacheTool } from './Logic/CacheTool';
import { EventTool } from './Logic/EventTool';
import { HttpTool } from './Logic/HttpTool';
import { Log } from './Logic/Log';
import { SyncQueueTool } from './Logic/SyncQueueTool';
import { MongoCacheService } from './Service/MongoCacheService';
import { ProtoFactory } from './SocketServer/ProtoFilter/ProtoFactory';
import { AlipayTool } from './ThirdParty/AlipayTool';
import { SMSTool } from './ThirdParty/Alisms';
import { AppleTool } from './ThirdParty/AppleTool';
import { EmailTool } from './ThirdParty/EmailTool';
import { QQTool } from './ThirdParty/QQTool';
import { QiniuTool } from './ThirdParty/QiniuTool';
import { WechatTool } from './ThirdParty/WechatTool';
import { ControllerManager } from './WebServer/Engine/ControllerManager';
import { CgServer } from './cgserver';

export class global
{
    static gMongoServiceMgr=new MongoServiceManager()
    static gCgServer=new CgServer()
    static gDbCache=new DBCache()
    static gTriggerMgr=new TriggerManager()
    static gServerCfg:IServerConfig=null
    static gMongoMgr=new MongoManager()
    static gMSSqlMgr=new MSSqlManager()
    static gMysqlMgr=new MysqlManager()
    static gRedisMgr=new RedisManager()
    static gCacheTool=new CacheTool()
    static gHttpTool=new HttpTool()
    static gLog = new Log()
    static gSyncQueueTool=new SyncQueueTool()
    static gEventTool=new EventTool()
    static gByteTool=new ByteTool()
    static gSmsTool=new SMSTool()
    static gEmailTool=new EmailTool()
    static gQiniuTool=new QiniuTool()
    static gQQTool=new QQTool()
    static gWechatTool=new WechatTool()
    static gWechatOATool=new WechatTool()
    static gAlipayTool=new AlipayTool()
    static gAppleTool=new AppleTool()
    static gProtoFactory=new ProtoFactory()
    static gCtrMgr=new ControllerManager()
    static gMongoCacheSer = new MongoCacheService()
}