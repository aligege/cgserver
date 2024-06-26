import { Engine } from './Engine/Engine';
import { GLog } from '../Logic/Log';
import { WebServerConfig } from '../Config/FrameworkConfig';
import { RazorJs } from './Engine/RazorJs';
import { GServerCfg } from '../Config/IServerConfig';
import { GEventTool } from '../Logic/EventTool';
import { GCgServer } from '../cgserver';

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
        GCgServer.addWebServer(this)
        if(!cfg)
        {
            GLog.error("webserver 配置不存在，启动服务器失败")
            return false
        }
        
        let dbcfg=GServerCfg.db
        await GCgServer.initDb(dbcfg)
        //初始化web引擎
        this._engine = new Engine(cfg,new RazorJs())
        this._engine.start()

        this._registerController()
        this._registerRouter()
        GEventTool.emit("web_server_init_done")
        return true
    }
    pause()
    {
        this._engine.pause()
    }
    resume()
    {
        this._engine.resume()
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