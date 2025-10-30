import { core } from "./Core/Core";
import { Config } from "./Config/Config";
import { IWebServer } from "./Server/WebServer/IWebServer";
import { IWebSocketServer } from "./Server/WebSocketServer/IWebSocketServer";
import { DbConfig } from "./Config/DbConfig";
import { gMSSqlMgr } from "./Database/MSSql/MSSqlManager";
import { gMysqlMgr } from "./Database/Mysql/MysqlManager";
import { gMongoMgr } from "./Database/Mongo/MongoManager";
import { gLog } from "./Logic/Log";
import { gEventTool } from "./Logic/EventTool";
import { gRedisMgr } from "./Database/Redis/RedisManager";
import minimist from "minimist";
import { ISocketServer } from "./Server/SocketServer/ISocketServer";
import heapdump from "heapdump";

export class CgServer
{
    protected _webservers:IWebServer[]=[]
    get webServers()
    {
        return this._webservers
    }
    protected _websocket_servers:IWebSocketServer[]=[]
    get websocketServers()
    {
        return this._websocket_servers
    }
    protected _socket_servers:ISocketServer[]=[]
    get socketServers()
    {
        return this._socket_servers
    }
    protected _events:{[name:string]:Function[]}={}
    protected _debug=false
    get debug()
    {
        return this._debug
    }
    protected _custom_process_id=core.getUuid()
    /**
     * 当前进程的一个用户自定义的一个进程id
     * 非操作系统的进程id
     */
    get customprocessid()
    {
        return this._custom_process_id
    }
    /**
     * 当前进程的一个用户自定义的一个进程id
     * 非操作系统的进程id
     */
    set customprocessid(value:string)
    {
        this._custom_process_id=value
    }
    get dataRootDir()
    {
        return Config.rootDataDir
    }
    protected _timezone="Asia/Shanghai"
    get timezone()
    {
        return this._timezone
    }
    set timezone(value:string)
    {
        this._timezone=value
        process.env.TZ = "Asia/Shanghai"
    }
    protected _argv:minimist.ParsedArgs={_:[]}
    /**
     *   $ node example/parse.js -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
     *   {
     *       _: ['foo', 'bar', 'baz'],
     *       x: 3,
     *       y: 4,
     *       n: 5,
     *       a: true,
     *       b: true,
     *       c: true,
     *       beep: 'boop'
     *   }
     */
    get argv()
    {
        return this._argv
    }
    constructor()
    {
        this.init()
    }
    init()
    {
        this._argv = minimist(process.argv)
        process.on("uncaughtException",this.onUnCaughtException.bind(this))
        process.on("exit",this.onExit.bind(this))
        //ctrl+c
        process.on("SIGINT",this.onExit.bind(this))
        //kill pid
        process.on("SIGUSR1",this.onExit.bind(this))
        process.on("SIGUSR2",this.onExit.bind(this))

        process.env.TZ = "Asia/Shanghai"

        gEventTool.on("socket_server_init_done",this.onStart.bind(this))
        gEventTool.on("web_server_init_done",this.onStart.bind(this))

        let argv = process.argv||[]
        if(this._argv.d)
        {
            this._debug=true
        }
        if(this._argv.cfgdir)
        {
            Config.rootDataDir=this._argv.cfgdir.toLocaleLowerCase()
            if(!Config.rootDataDir.endsWith("/"))
            {
                Config.rootDataDir+="/"
            }
        }
        //todo 下面代码保留是因为需要兼容以前的东西
        for(let i=0;i<argv.length;++i)
        {
            let arg = argv[i].toLowerCase()
            if(arg=="-d"||arg=="-debug")
            {
                this._debug=true
            }
            if(arg=="-data")
            {
                if(i+1>=argv.length)
                {
                    break
                }
                ++i
                Config.rootDataDir=argv[i].toLocaleLowerCase()
                if(!Config.rootDataDir.endsWith("/"))
                {
                    Config.rootDataDir+="/"
                }
            }
        }
    }
    protected _done=0
    onStart()
    {
        ++this._done
        let total = this._webservers.length+this._websocket_servers.length+this._socket_servers.length
        if(this._done!=total)
        {
            return
        }
        let events=this._events["start"]||[]
        for(let i=0;i<events.length;++i)
        {
            core.safeCall(events[i])
        }
    }
    async onExit()
    {
        let events=this._events["exit"]||[]
        let exit = true
        for(let i=0;i<events.length;++i)
        {
            //只要有一个函数返回true，就不退出
            let ret = await core.safeCall(events[i])
            if(ret===true)
            {
                exit=false
            }
        }
        if(exit)
        {
            process.exit(0)
        }
    }
    addListener(event:"start"|"exit"|"uncaughtexception",func:()=>void)
    {
        this._events[event]=this._events[event]||[]
        this._events[event].push(func)
    }
    removeListener(event:"start"|"exit"|"uncaughtexception",func:()=>void)
    {
        let events=this._events[event]
        if(!events)
        {
            return false
        }
        let index=events.findIndex((_func)=>_func==func)
        if(index<0)
        {
            return false
        }
        events.splice(index,1)
        return true
    }
    onUnCaughtException(e)
    {
        gLog.error(e.stack)
        let events=this._events["uncaughtexception"]||[]
        for(let i=0;i<events.length;++i)
        {
            core.safeCall(events[i])
        }
    }
    addWebServer(server:IWebServer)
    {
        this._webservers.push(server)
    }
    addWebSocketServer(server:IWebSocketServer)
    {
        this._websocket_servers.push(server)
    }
    addSocketServer(server:ISocketServer)
    {
        this._socket_servers.push(server)
    }
    async initDb(dbcfg:DbConfig)
    {
        if(!dbcfg)
        {
            return
        }
        await gMSSqlMgr.init(dbcfg.mssql)
        await gMysqlMgr.init(dbcfg.mysql)
        await gRedisMgr.init(dbcfg.redis)
        let mongos=dbcfg.mongos||[]
        if(dbcfg.mongo)
        {
            mongos.push(dbcfg.mongo)
        }
        await gMongoMgr.init(mongos)
    }
    pause()
    {
        for(let i=0;i<this._webservers.length;++i)
        {
            this._webservers[i].pause()
        }
        for(let i=0;i<this._websocket_servers.length;++i)
        {
            this._websocket_servers[i].pause()
        }
        for(let i=0;i<this._socket_servers.length;++i)
        {
            this._socket_servers[i].pause()
        }
    }
    resume()
    {
        for(let i=0;i<this._webservers.length;++i)
        {
            this._webservers[i].resume()
        }
        for(let i=0;i<this._websocket_servers.length;++i)
        {
            this._websocket_servers[i].resume()
        }
        for(let i=0;i<this._socket_servers.length;++i)
        {
            this._socket_servers[i].resume()
        }
    }
    saveHeapSnapshot(file?:string)
    {
        try
        {
            file = file||('/heapsnapshot/' + Date.now() + '_'+this._custom_process_id+'.heapsnapshot')
            heapdump.writeSnapshot(file);
        }
        catch(e)
        {
            gLog.error("saveHeapSnapshot error:",e)
        }
    }
}

export let gCgServer=new CgServer()