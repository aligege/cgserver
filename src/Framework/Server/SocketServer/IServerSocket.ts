import { ISocket } from './ISocket';
import { EProtoType } from '../ProtoFilter/IProtoFilter';
import { gLog } from '../../Logic/Log';
import * as net from "net";
/**
 * 连接到服务器的websocket
 * 默认自动重连
 */
export class IServerSocket extends ISocket
{
    protected _host:string = ""
    /**
     * 连接的服务器地址
     */
    get host()
    {
        return this._host
    }
    protected _port:number = -1
    /**
     * 连接的服务器端口
     */
    get port()
    {
        return this._port
    }
    protected _need_close:boolean=false
    constructor(protoType=EProtoType.Json,protoPath="")
    {
        super(protoType,protoPath)
    }
    connect(domain:string,
        port:number)
    {
        this._host = domain || this._host
        this._port = port || this._port
        this._connect()
    }
    protected _connect()
    {
        if(this._socket)
        {
            this._socket.destroy()
            this._socket = null
        }
        this._need_close = false
        let url = `${this._host}:${this._port}`
        gLog.info(this._socket_id+":try to connect to " + url)
        this._socket = new net.Socket()
        this._socket.connect(this._port,this._host)
        this._socket.on("connect",()=>
        {
            this.onConnect(this._socket)
        })
    }
    onOpen(e?)
    {
        super.onOpen(e)
        gLog.info(this._socket_id+":success to connect to " + this._host + ":" + this._port)
    }
    onClose(reasonCode:number, description:string)
    {
        super.onClose(reasonCode, description)
        if(!this._need_close)
        {
            setTimeout(()=>
            {
                if(!this._need_close)
                {
                    this._connect()
                }
            },1000)
            return true
        }
        else
        {
            return false
        }
    }
    close()
    {
        this._need_close = true
        super.close()
    }
    protected _onDecode(message:Buffer,...params)
    {
        let msg = super._onDecode(message,"msgRes")
        return msg
    }
    protected _onEncode(data,...params)
    {
        let msg = super._onEncode(data,"msgReq")
        return msg
    }
}