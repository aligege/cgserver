import { GMysqlMgr } from '../Database/MysqlManager';
import { GRedisMgr } from '../Database/RedisManager';
import { IServerWebSocket } from './IServerWebSocket';
import * as ws from 'websocket';
import { GLog } from './../Logic/Log';
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import { GFCfg } from '../Config/FrameworkConfig';
import { GMongoMgr } from '../Database/MongoManager';

export class ISocketServer
{
    //服务器已被关闭
    protected _is_closed=false
    get isClosed()
    {
        return this._is_closed
    }
    private _code:number = -1//服务器唯一编码
    get code():number
    {
        return this._code
    }
    set code(value)
    {
        this._code = value
    }
    protected _name:string=""
    get name()
    {
        return this._name
    }
    get fullServerName()
    {
        return this._name+"@"+this._code
    }
    //监听websocket
    private _web_socket:ws.server= null
    get serverWebSocket()
    {
        return this._web_socket
    }
    //来自于用户的链接
    protected _ws_clients= new Map<number,IServerWebSocket>()
    private _listen_port:number=0
    get listenPort()
    {
        return this._listen_port
    }
    set listenPort(value)
    {
        this._listen_port = value
    }

    //服务器管理相关
    /*
        item=servername:class
    */
    protected _name_vs_class={}
    registerWebSocketHandleClass(name:string,cls)
    {
        if(!name||name=="")
        {
            throw "registerWebSocketHandleClass name must be not null or empty!"
        }
        this._name_vs_class[name] = cls
    }
    constructor(server_name)
    {
        this._name = server_name
    }
    removeServerWebSocketBySocketId(socketId)
    {
        this._ws_clients[socketId] = null
        delete this._ws_clients[socketId]
    }
    async run()
    {
        await GMysqlMgr.init()
        await GRedisMgr.init(GFCfg.db.redis)
        await GMongoMgr.init()
        let code = await GRedisMgr.incr("server_code")
        this._code = code
        setTimeout(this.initWebSocket.bind(this),3000)//给数据库相关留一点时间
    }
    stop()
    {
        this._is_closed=true
        this._web_socket.closeAllConnections()
    }
    /*
        把所有的客户端链接保存起来
        方便统计，广播等
    */
    addClient(client_server:IServerWebSocket)
    {
        this._ws_clients[client_server.socketId] = client_server
    }
    isOriginAllowed(origin)
    {
        return true
    }
    initWebSocket(wss?)
    {
        let server = null
        if(wss)
        {
            console.log("wss:---")
            let options =
            {
                key:fs.readFileSync("ssl/ssl2.key"),
                cert: fs.readFileSync("ssl/ssl2.crt"),
                //passphrase:'1234'//如果秘钥文件有密码的话，用这个属性设置密码
            }
            server = https.createServer(options,(request, response)=>
            {
                GLog.info((new Date()) + 'wss Received request for ' + request.url)
                response.writeHead(404)
                response.end()
            })
        }
        else
        {
            server = http.createServer((request, response)=>
            {
                GLog.info((new Date()) + 'ws Received request for ' + request.url)
                response.writeHead(404)
                response.end()
            })
        }

        server.listen(this._listen_port, this.onListenning.bind(this))
        
        this._web_socket = new ws.server({
            httpServer: server,
            // You should not use autoAcceptConnections for production 
            // applications, as it defeats all standard cross-origin protection 
            // facilities built into the protocol and the browser.  You should 
            // *always* verify the connection's origin and decide whether or not 
            // to accept it. 
            autoAcceptConnections: false
        })
        this._web_socket.on('request', this.onRequest.bind(this))
        this._web_socket.on('close', this.onClose.bind(this))
    }
    onClose()
    {
        this._is_closed=true
    }
    onListenning()
    {
        let info = (new Date()) + "  Server "+ this.fullServerName +" is listening on port "+this._listen_port
        GLog.info(info)
        console.log(info)
    }
    onRequest(req:ws.request)
    {
        if(this._is_closed)
        {
            return
        }
        let protocol = null
        if(req.requestedProtocols.length>0)
        {
            protocol = req.requestedProtocols[0]
        }
        let allowed = this.isOriginAllowed(req.origin)
        if (!allowed)
        {
            req.reject()
            GLog.info((new Date()) + ' Connection from origin ' + req.origin + ' rejected.')
            return
        }
        
        let ws = req.accept(null, req.origin)
        GLog.info((new Date()) + ' Connection accepted.')
        let server_name = this._getServerNameByCookies(req.cookies)
        this.createWebSocketObjectByProtocol(server_name,ws)
    }
    createWebSocketObjectByProtocol(server_name:string,ws:ws.connection):IServerWebSocket
    {
        server_name=server_name||"default"
        let cls = this._name_vs_class[server_name]
        if(!cls)
        {
            GLog.error("(createWebSocketObjectByProtocol in server("+this.name+"))no this websocket handle class="+server_name)
            return null
        }
        let ws_server = <IServerWebSocket>(new cls(this))
        this.addClient(ws_server)
        ws_server.onConnect(ws)
        return ws_server
    }
    protected _getServerNameByCookies(cookies)
    {
        let server_name = ""
        if(!cookies)
        {
            return server_name
        }
        for(let index in cookies)
        {
            let cookie = cookies[index]
            if(cookie.name=="server")
            {
                server_name = cookie.value
                break
            }
        }
        return server_name
    }
}