import { IClientWebSocket } from './IClientWebSocket';
import * as ws from 'websocket';
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import { IServerConfig, gServerCfg } from '../Config/IServerConfig';
import { BaseMsg } from './IWebSocket';
import { Config } from '../Config/Config';
import { gCgServer } from '../cgserver';
import { gLog } from '../Logic/Log';
import { gEventTool } from '../Logic/EventTool';

export class ISocketServer
{
    protected _cfg:IServerConfig=null
    //方便提示
    get cfg()
    {
        return this._cfg
    }
    //服务器已被关闭
    protected _is_runging=false
    get isrunging()
    {
        return this._is_runging
    }
    get name()
    {
        return this._cfg.serverName
    }
    //监听websocket
    private _listening_websocket:ws.server= null
    get listeningWebSocket()
    {
        return this._listening_websocket
    }
    //来自于用户的链接
    protected _ws_clients:{[socketid:number]:IClientWebSocket}={}
    get listenPort()
    {
        return this._cfg.port
    }
    /**
     * websocket can accepted protocol
     */
    protected _accepted_protocol=null
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
    constructor(cfg:IServerConfig)
    {
        this._cfg=cfg
    }
    removeServerWebSocketBySocketId(socketId:number)
    {
        this._ws_clients[socketId] = null
        delete this._ws_clients[socketId]
    }
    async run()
    {
        gCgServer.addSocketServer(this)
        let dbcfg=gServerCfg.db
        await gCgServer.initDb(dbcfg)
        this.initWebSocket()
    }
    pause()
    {
        if(!this._is_runging)
        {
            gLog.error("websocketserver has paused:"+this._cfg.port)
            return
        }
        this._is_runging=false
        this._listening_websocket.closeAllConnections()
        gLog.info("websocketserver paused:"+this._cfg.port)
    }
    resume()
    {
        if(this._is_runging)
        {
            gLog.error("websocketserver is running:"+this._cfg.port)
            return
        }
        this._is_runging=true
        gLog.error("websocketserver resumed:"+this._cfg.port)
    }
    /*
        把所有的客户端链接保存起来
        方便统计，广播等
    */
    addClient(ws_client:IClientWebSocket)
    {
        this._ws_clients[ws_client.socketId] = ws_client
    }
    isOriginAllowed(origin)
    {
        if(!this._is_runging)
        {
            return false
        }
        return true
    }
    initWebSocket(wss?)
    {
        let server = null
        if(wss)
        {
            let options =
            {
                key:fs.readFileSync(Config.rootDataDir+"ssl/ssl2.key"),
                cert: fs.readFileSync(Config.rootDataDir+"ssl/ssl2.crt"),
                //passphrase:'1234'//如果秘钥文件有密码的话，用这个属性设置密码
            }
            server = https.createServer(options,(request, response)=>
            {
                gLog.info((new Date()) + 'wss Received request for ' + request.url)
                response.writeHead(200)
                response.end()
            })
        }
        else
        {
            server = http.createServer((request, response)=>
            {
                gLog.info((new Date()) + 'ws Received request for ' + request.url)
                response.writeHead(200)
                response.end()
            })
        }

        server.listen(this._cfg.port, this.onListenning.bind(this))
        
        this._listening_websocket = new ws.server({
            httpServer: server,
            // You should not use autoAcceptConnections for production 
            // applications, as it defeats all standard cross-origin protection 
            // facilities built into the protocol and the browser.  You should 
            // *always* verify the connection's origin and decide whether or not 
            // to accept it. 
            autoAcceptConnections: false
        })
        this._listening_websocket.on('request', this.onRequest.bind(this))
        this._listening_websocket.on('close', this.onClose.bind(this))
    }
    onClose(connection: ws.connection, reason: number, desc: string)
    {
        
    }
    onListenning()
    {
        this._is_runging=true
        gEventTool.emit("socket_server_init_done")
        let info = (new Date()) + "  Server "+ this.name +" is listening on port "+this._cfg.port
        gLog.info(info)
    }
    onRequest(req:ws.request)
    {
        if(!this._is_runging)
        {
            req.reject()
            gLog.error(' Connection from origin ' + req.origin + ' rejected.')
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
            gLog.error(' Connection from origin ' + req.origin + ' rejected.')
            return
        }
        try
        {
            let conn = req.accept(this._accepted_protocol, req.origin)
            if(!conn)
            {
                gLog.error(' protocol reject')
                return
            }
            gLog.info((new Date()) + ' Connection accepted.')
            let server_name = this._getServerNameByCookies(req.cookies)
            this.createWebSocketObjectByProtocol(server_name,conn,req)
        }
        catch(e)
        {
            gLog.error(' protocol reject')
        }
    }
    createWebSocketObjectByProtocol(server_name:string,_ws:ws.connection,req:ws.request):IClientWebSocket
    {
        server_name=server_name||"default"
        let cls = this._name_vs_class[server_name]
        if(!cls)
        {
            gLog.error("(createWebSocketObjectByProtocol in server("+this.name+"))no this websocket handle class="+server_name)
            return null
        }
        let ws_server = <IClientWebSocket>(new cls(this))
        this.addClient(ws_server)
        ws_server.onConnect(_ws,req)
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
    /**
     * 广播消息
     * @param msg 
     */
    broadCast(msg:BaseMsg)
    {
        for(var key in this._ws_clients)
        {
            let ws = this._ws_clients[key] as IClientWebSocket
            ws.send(msg)
        }
    }
    /**
     * 获取任意客户端连接
     * @returns 
     */
    getAnyWebSocket()
    {
        for(var key in this._ws_clients)
        {
            return this._ws_clients[key] as IClientWebSocket
        }
        return null
    }
}