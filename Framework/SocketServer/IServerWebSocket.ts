import { ISocketServer } from './ISocketServer';
import { IWebSocket } from './IWebSocket';
import { GLog } from '../Logic/Log';
import { EProtoType } from './ProtoFilter/IProtoFilter';
import * as WebSocket from 'websocket'

export class IServerWebSocket extends IWebSocket
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
    onClose (reasonCode)
    {
        super.onClose(reasonCode)
        this._server.removeServerWebSocketBySocketId(this._socket_id)
    }
    broadCast(data)
    {
        let serverWS = this._server.serverWebSocket
        if (!data)
        {
            GLog.info("Send Message warning:null data!")
            return
        }
        GLog.info("broadCast:----------------------------------")
        GLog.info(data)
        let msg = this._protoFilter.encode(data)
        serverWS.broadcast(msg)
    }
    protected _onDecode(message:WebSocket.IMessage,...params)
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