import { Engine } from './Engine/Engine';
import { WebServerConfig } from '../Config/FrameworkConfig';
import { RazorJs } from './Engine/RazorJs';
import { gServerCfg } from '../Config/IServerConfig';
import { gCgServer } from '../cgserver';
import { gEventTool } from '../Logic/EventTool';
import { gLog } from '../Logic/Log';

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
        gCgServer.addWebServer(this)
        if(!cfg)
        {
            gLog.error("webserver 配置不存在，启动服务器失败")
            return false
        }
        
        let dbcfg=gServerCfg.db
        await gCgServer.initDb(dbcfg)
        //初始化web引擎
        this._engine = new Engine(cfg,new RazorJs())
        this._engine.start()

        this._registerController()
        this._registerRouter()
        gEventTool.emit("web_server_init_done")
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