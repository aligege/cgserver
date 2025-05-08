import { BaseMsg } from './ISocket';
import { gCgServer } from '../../cgserver';
import { gLog } from '../../Logic/Log';
import { gEventTool } from '../../Logic/EventTool';
import * as net from 'net';
import { IClientSocket } from './IClientSocket';
export class SocketServerConfig
{
    port:number=0
    name:string=""
}
export class ISocketServer
{
    protected _cfg:SocketServerConfig=null
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
        return this._cfg.name
    }
    //监听websocket
    private _server:net.Server= null
    get server()
    {
        return this._server
    }
    //来自于用户的链接
    protected _clients:{[socketid:number]:IClientSocket}={}
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
    protected _cls=null
    registerSocketHandleClass(cls)
    {
        this._cls=cls
    }
    constructor(cfg:SocketServerConfig)
    {
        this._cfg=cfg
    }
    removeServerSocketBySocketId(socketId:number)
    {
        this._clients[socketId] = null
        delete this._clients[socketId]
    }
    async run()
    {
        gCgServer.addSocketServer(this)
        this.initSocket()
    }
    pause()
    {
        if(!this._is_runging)
        {
            gLog.error("socketserver has paused:"+this._cfg.port)
            return
        }
        this._is_runging=false
        for(let key in this._clients)
        {
            this._clients[key].close()
        }
        gLog.info("socketserver paused:"+this._cfg.port)
    }
    resume()
    {
        if(this._is_runging)
        {
            gLog.error("socketserver is running:"+this._cfg.port)
            return
        }
        this._is_runging=true
        gLog.error("socketserver resumed:"+this._cfg.port)
    }
    /*
        把所有的客户端链接保存起来
        方便统计，广播等
    */
    addClient(ws_client:IClientSocket)
    {
        this._clients[ws_client.socketId] = ws_client
    }
    initSocket(wss?)
    {
        this._server = net.createServer()
        this._server.listen(this._cfg.port, this.onListenning.bind(this))
        this._server.on("connection",this.onConnection.bind(this))
        this._server.on('close', this.onClose.bind(this))
    }
    onClose()
    {
        
    }
    onListenning()
    {
        this._is_runging=true
        gEventTool.emit("socket_server_init_done")
        let info = (new Date()) + "  SocketServer "+ this.name +" is listening on port "+this._cfg.port
        gLog.info(info)
    }
    onConnection(socket:net.Socket)
    {
        if(!this._is_runging)
        {
            socket.end()
            gLog.error(' Connection rejected.')
            return
        }
        try
        {
            gLog.info((new Date()) + ' Connection accepted.')
            this.createSocketObjectByProtocol(socket)
        }
        catch(e)
        {
            gLog.error(' protocol reject')
        }
    }
    createSocketObjectByProtocol(socket:net.Socket):IClientSocket
    {
        let cls = this._cls
        if(!cls)
        {
            gLog.error("(createSocketObjectByProtocol in server("+this.name+"))no this socket handle class")
            return null
        }
        let s_client = <IClientSocket>(new cls(this))
        this.addClient(s_client)
        s_client.onConnect(socket)
        return s_client
    }
    /**
     * 广播消息
     * @param msg 
     */
    broadCast(msg:BaseMsg)
    {
        for(var key in this._clients)
        {
            let ws = this._clients[key] as IClientSocket
            ws.send(msg)
        }
    }
    /**
     * 获取任意客户端连接
     * @returns 
     */
    getAnyWebSocket()
    {
        for(var key in this._clients)
        {
            return this._clients[key] as IClientSocket
        }
        return null
    }
}