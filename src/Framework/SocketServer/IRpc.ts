import { BaseMsg } from "./IWebSocket";

export class RpcBaseMsg extends BaseMsg
{
    __rpcid=""
    __return=false
}

export abstract class IRpc
{
    abstract callRemote(msg: RpcBaseMsg);
}