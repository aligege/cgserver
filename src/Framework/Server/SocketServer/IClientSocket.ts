import { gLog } from '../../Logic/Log';
import { ISocketServer } from './ISocketServer';
import { ISocket } from './ISocket';
import { EProtoType } from '../ProtoFilter/IProtoFilter';
/**
 * 服务器接收到的客户端的连接
 * 客户端的session对象
 */
export class IClientSocket extends ISocket
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
        this._server.removeServerSocketBySocketId(this._socket_id)
    }
    broadCast(data)
    {
        if (!data)
        {
            gLog.info("Send Message warning:null data!")
            return
        }
        gLog.info("broadCast:----------------------------------")
        gLog.info(data)
        let msg = this._protoFilter.encode(data)
        this._server.broadCast(msg)
    }
    protected _onDecode(message:Buffer,...params)
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