import { IWebSocket } from './IWebSocket';
import * as WebSocket from 'websocket';
import { GLog } from '../Logic/Log';
import { EProtoType } from './ProtoFilter/IProtoFilter';

export class IClientWebSocket extends IWebSocket
{
    protected _host:string = ""
    /**
     * 连接的服务器地址
     */
    get host()
    {
        return this._host
    }
    protected _port:string = ""
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
    connect(domain,port)
    {
        this._host = domain || this._host
        this._port = port || this._port
        this._connect()
    }
    protected _connect()
    {
        let url = "ws://" + this._host + ":" + this._port + "/"
        GLog.info("Trying to connect to server : " + url)
        let ws = new WebSocket.client()
        ws.on("connect",super.onConnect.bind(this))
        ws.on("connectFailed",this.onClose.bind(this))
        ws.connect(url,null,null,{cookie:"client="+this._tipKey})
    }
    onOpen(e?)
    {
        super.onOpen(e)
        GLog.info("success to connect to " + this._host + ":" + this._port)
    }
    onClose(e)
    {
        super.onClose(e)
        GLog.info((new Date())+"connection is closed：host="+this._host+" port="+this._port)
        if(!this._need_close)
        {
            setTimeout(()=>
            {
                if(!this._need_close)
                {
                    this.connect(this._host,this._port)
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
    protected _onDecode(message:WebSocket.IMessage,...params)
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