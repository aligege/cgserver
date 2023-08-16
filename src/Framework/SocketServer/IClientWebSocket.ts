import { ISocketServer } from './ISocketServer';
import { IWebSocket } from './IWebSocket';
import { GLog } from '../Logic/Log';
import { EProtoType } from './ProtoFilter/IProtoFilter';
import * as ws from 'websocket';
/**
 * 服务器接收到的客户端的连接
 * 客户端的session对象
 */
export class IClientWebSocket extends IWebSocket
{
    protected _server:ISocketServer=null
    get server()
    {
        return this._server
    }
    constructor(server:ISocketServer,protoType=EProtoType.Json,protoPath="")
    {
        super(protoType,protoPath)    
        this._server = server
        this._tipKey=this._server.name
    }
    onClose (reasonCode:number, description:string)
    {
        super.onClose(reasonCode, description)
        this._server.removeServerWebSocketBySocketId(this._socket_id)
    }
    broadCast(data)
    {
        if (!data)
        {
            GLog.info("Send Message warning:null data!")
            return
        }
        GLog.info("broadCast:----------------------------------")
        GLog.info(data)
        let msg = this._protoFilter.encode(data)
        this._server.broadCast(msg)
    }
    protected _onDecode(message:ws.Message,...params)
    {
        let msg = super._onDecode(message,"msgReq")
        return msg
    }
    protected _onEncode(data,...params)
    {
        let msg = super._onEncode(data,"msgRes")
        return msg
    }
}