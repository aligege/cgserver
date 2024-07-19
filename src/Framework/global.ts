import { gTriggerMgr } from "./AI/TriggerMgr"
import { gByteTool } from "./Core/ByteTool"
import { gDbCache } from "./Database/Decorator/DBCache"
import { gMSSqlMgr } from "./Database/MSSqlManager"
import { gMongoMgr } from "./Database/Mongo/MongoManager"
import { gMongoServiceMgr } from "./Database/Mongo/MongoServiceManager"
import { gMysqlMgr } from "./Database/MysqlManager"
import { gRedisMgr } from "./Database/RedisManager"
import { gCacheTool } from "./Logic/CacheTool"
import { gEventTool } from "./Logic/EventTool"
import { gHttpTool } from "./Logic/HttpTool"
import { gLog } from "./Logic/Log"
import { gSyncQueueTool } from "./Logic/SyncQueueTool"
import { gMongoCacheSer } from "./Service/MongoCacheService"
import { gProtoFactory } from "./SocketServer/ProtoFilter/ProtoFactory"
import { gAlipayTool } from "./ThirdParty/AlipayTool"
import { gSMSTool } from "./ThirdParty/Alisms"
import { gAppleTool } from "./ThirdParty/AppleTool"
import { gEmailTool } from "./ThirdParty/EmailTool"
import { gQQTool } from "./ThirdParty/QQTool"
import { gQiniuTool } from "./ThirdParty/QiniuTool"
import { gWechatTool } from "./ThirdParty/WechatTool"
import { gCtrMgr } from "./WebServer/Engine/ControllerManager"
import { gCgServer } from "./cgserver"
import { core } from "./Core/Core"

/**
 * cg引擎的，全局对象
 */
export class global
{
    static gMongoServiceMgr1=gMongoServiceMgr
    static gCgServer1=gCgServer
    static gDbCache1=gDbCache
    static gTriggerMgr1=gTriggerMgr
    static gMongoMgr1=gMongoMgr
    static gMSSqlMgr1=gMSSqlMgr
    static gMysqlMgr1=gMysqlMgr
    static gRedisMgr1=gRedisMgr
    static gCacheTool1=gCacheTool
    static gHttpTool1=gHttpTool
    static gLog1 = gLog
    static gSyncQueueTool1=gSyncQueueTool
    static gEventTool1=gEventTool
    static gByteTool1=gByteTool
    static gSmsTool1=gSMSTool
    static gEmailTool1=gEmailTool
    static gQiniuTool1=gQiniuTool
    static gQQTool1=gQQTool
    static gWechatTool1=gWechatTool
    static gWechatOATool1=gWechatTool
    static gAlipayTool1=gAlipayTool
    static gAppleTool1=gAppleTool
    static gProtoFactory1=gProtoFactory
    /**
     * web服务中mvc的控制器管理器
     */
    static gCtrMgr=gCtrMgr
    /**
     * mongo版本的缓存服务
     * 可以用来缓存kv数据
     */
    static gMongoCacheSer = gMongoCacheSer
    /**
     * 一些通用的常用函数，
     * 比如格式化字符串，常用加解密，
     * 时间计算，类型判断等
     */
    static core = core
}