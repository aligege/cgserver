import { gTriggerMgr } from "./AI/TriggerMgr"
import { gByteTool } from "./Core/ByteTool"
import { gDbCache } from "./Database/Decorator/DBCache"
import { gMSSqlMgr } from "./Database/MSSql/MSSqlManager"
import { gMongoMgr } from "./Database/Mongo/MongoManager"
import { gMongoServiceMgr } from "./Database/Mongo/MongoServiceManager"
import { gMysqlMgr } from "./Database/Mysql/MysqlManager"
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
import { gRedisMgr } from "./Database/Redis/RedisManager"
import { gCgRankTool } from './ThirdParty/CgRankTool';
/**
 * cg引擎的，全局对象
 */
export class global {
    static gMongoServiceMgr = gMongoServiceMgr
    static gCgServer = gCgServer
    static gDbCache = gDbCache
    static gTriggerMgr = gTriggerMgr
    static gMongoMgr = gMongoMgr
    static gMSSqlMgr = gMSSqlMgr
    static gMysqlMgr = gMysqlMgr
    static gRedisMgr = gRedisMgr
    static gCacheTool = gCacheTool
    static gHttpTool = gHttpTool
    static gLog = gLog
    static gSyncQueueTool = gSyncQueueTool
    static gEventTool = gEventTool
    static gByteTool = gByteTool
    static gSmsTool = gSMSTool
    static gEmailTool = gEmailTool
    static gQiniuTool = gQiniuTool
    static gQQTool = gQQTool
    static gWechatTool = gWechatTool
    static gWechatOATool = gWechatTool
    static gAlipayTool = gAlipayTool
    static gAppleTool = gAppleTool
    static gProtoFactory = gProtoFactory
    static gCgRankTool = gCgRankTool
    /**
     * web服务中mvc的控制器管理器
     */
    static gCtrMgr = gCtrMgr
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