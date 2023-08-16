import { IWebSocket } from './IWebSocket';
import * as ws from 'websocket';
import { GLog } from '../Logic/Log';
import { EProtoType } from './ProtoFilter/IProtoFilter';

/**
 * 连接到服务器的websocket
 * 默认自动重连
 */
export class IServerWebSocket extends IWebSocket
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
    connect(domain:string,port:number)
    {
        this._host = domain || this._host
        this._port = port || this._port
        this._connect()
    }
    protected _connect()
    {
        let url = "ws://" + this._host + ":" + this._port + "/"
        GLog.info("Trying to connect to server : " + url)
        let _ws = new ws.client()
        _ws.on("connect",super.onConnect.bind(this))
        _ws.on("connectFailed",this.onClose.bind(this))
        _ws.connect(url,null,null,{cookie:"client="+this._tipKey})
    }
    onOpen(e?)
    {
        super.onOpen(e)
        GLog.info("success to connect to " + this._host + ":" + this._port)
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
    protected _onDecode(message:ws.Message,...params)
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