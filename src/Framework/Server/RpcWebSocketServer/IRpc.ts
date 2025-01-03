import { BaseMsg } from "../WebSocketServer/IWebSocket"

export class RpcMsg extends BaseMsg
{
    __rpcid=""
    __return=false
    //mq消息不需要回复
    __is_mq=false
    /**
      * 发送者分组
      */
    from_group=""
    /**
     * 发送者分组下的某个具体对象id
     */
    from_id=""
    /**
     * 必填，目的组
     */
    to_group=""
    /**
     * 目的分组下的某个具体对象id
     */
    to_id=""
    /**
     * 监听的对象，比如，发送给push服务器的，监听了10086的服务器listen="10086",listen,也可以理解为子group
     */
    listen=""
    /**
     * 消息携带的数据
     */
    data:any=null
}

export abstract class IRpc
{
    abstract callRemote(msg: RpcMsg);
}