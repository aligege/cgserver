import { BaseMsg } from "./IWebSocket";

export class RpcMsg extends BaseMsg
{
    __rpcid=""
    __return=false
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
     * 消息携带的数据
     */
    data:any=null
}

export abstract class IRpc
{
    abstract callRemote(msg: RpcMsg);
}