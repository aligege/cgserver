import { ISocket } from './ISocket';
import * as ws from 'websocket';
import { EProtoType } from '../ProtoFilter/IProtoFilter';
import * as http from "http";
import { gLog } from '../../Logic/Log';
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
    protected _requestedProtocols: string | string[]=null
    get requestedProtocols()
    {
        return this._requestedProtocols
    }
    protected _origin: string=null
    get origin()
    {
        return this._origin
    }
    protected _headers: http.OutgoingHttpHeaders=null
    get headers()
    {
        return this._headers
    }
    protected _extraRequestOptions: http.RequestOptions=null
    get extraRequestOptions()
    {
        return this._extraRequestOptions
    }

    protected _need_close:boolean=false
    constructor(protoType=EProtoType.Json,protoPath="")
    {
        super(protoType,protoPath)
    }
    connect(domain:string,
        port:number,
        requestedProtocols: string | string[]=null,
        origin: string=null,
        headers: http.OutgoingHttpHeaders=null,
        extraRequestOptions: http.RequestOptions=null)
    {
        this._host = domain || this._host
        this._port = port || this._port
        this._requestedProtocols = requestedProtocols || this._requestedProtocols
        this._origin = origin || this._origin
        this._headers = headers || this._headers
        this._extraRequestOptions = extraRequestOptions || this._extraRequestOptions
        this._connect()
    }
    protected _connect()
    {
        let url = "ws://" + this._host + ":" + this._port + "/"
        gLog.info("Trying to connect to server : " + url)
        let _ws = new ws.client()
        _ws.on("connect",this.onConnect.bind(this))
        _ws.on("connectFailed",this.onClose.bind(this))
        _ws.connect(url,this._requestedProtocols,this._origin,this._headers,this._extraRequestOptions)
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