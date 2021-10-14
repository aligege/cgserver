import { Engine } from './Engine/Engine';
import { GLog } from '../Logic/Log';
import { GRedisMgr } from '../Database/RedisManager';
import { GMysqlMgr } from '../Database/MysqlManager';
import { GFCfg, WebServerConfig } from '../Config/FrameworkConfig';
import { RazorJs } from './Engine/RazorJs';
import { GMongoMgr } from '../Database/MongoManager';
import { GAlipayTool } from '../ThirdParty/AlipayTool';

//实现对controller的手动注册
export class IWebServer
{
    protected _engine:Engine=null
    /**
     * 启动服务器
     * @param server_index 这个是服务器的配置index
     */
    async start(cfg:WebServerConfig)
    {
        if(!cfg)
        {
            GLog.error("webserver 配置不存在，启动服务器失败")
            return false
        }
        await GRedisMgr.init(GFCfg.db.redis)
        await GMysqlMgr.init()
        await GMongoMgr.init()
        GAlipayTool.init()
        //初始化web引擎
        this._engine = new Engine(cfg,new RazorJs())
        this._engine.start()

        this._registerController()
        this._registerRouter()
    }
    stop()
    {
        this._engine.stop()
    }
    /**
     * 注册控制器
     * eg:GControllerMgr.registerController("Admin","System",SystemController)
     */
    protected _registerController()
    {

    }
    /**
     * 注册路由
     */
    protected _registerRouter()
    {

    }
}