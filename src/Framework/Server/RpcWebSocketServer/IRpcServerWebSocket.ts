import _ = require("underscore");
import { IRpc, RpcMsg } from "./IRpc";
import { gLog } from "../../Logic/Log";
import { gEventTool } from "../../Logic/EventTool";
import { IServerWebSocket } from "../WebSocketServer/IServerWebSocket";

export class IRpcServerWebSocket extends IServerWebSocket implements IRpc
{
    /**
     * 自己的身份
     */
    protected _group=""
    protected _id=""
    //超时时间
    protected _timeout=3000
    constructor(group:string,id:string,timeout:number=3000)
    {
        super()
        this._group=group
        this._id=id
        this._timeout=timeout||3000
    }
    protected _genId(pre="")
    {
        return pre+"_"+Date.now()%10000000000+"_"+_.uniqueId()+_.random(9999999)
    }
    getNewMsg(cmd: string, errcode?: { id: number; des: string; }) {
        let msg = new RpcMsg(cmd,errcode)
        msg.__rpcid=this._genId(cmd)
        msg.__return=false
        msg.__is_mq=false
        msg.from_group=this._group
        msg.from_id=this._id
        msg.to_group=this._group
        msg.to_id=this._id
        return msg
    }
    toRetMsg(req_msg:RpcMsg,data:any,errcode?: { id: number; des: string; })
    {
        let ret_msg = this.getNewMsg(req_msg.cmd,errcode)
        //唯一标识必须保持一致
        ret_msg.__rpcid=req_msg.__rpcid
        ret_msg.__return=true
        ret_msg.__is_mq=req_msg.__is_mq
        ret_msg.from_group=this._group
        ret_msg.from_id=this._id
        ret_msg.to_group=req_msg.from_group
        ret_msg.to_id=req_msg.from_id
        ret_msg.data=data
        return ret_msg
    }
    async callRemote(msg: RpcMsg):Promise<RpcMsg|null>
    {
        if(!msg)
        {
            gLog.error("send null msg!")
            return null
        }
        if(msg.__is_mq)
        {
            //mq消息不需要回复
            this.send(msg)
            return null
        }
        return new Promise<RpcMsg>((resolve,reject)=>
        {
            let handler = null
            let func=(retRpcMsg:RpcMsg)=>
            {
                if(handler)
                {
                    clearTimeout(handler)
                    handler=null
                }
                resolve(retRpcMsg)
            }
            handler = setTimeout(()=>
            {
                gEventTool.off(msg.__rpcid,func)
                let error_msg=this.getNewMsg(msg.cmd,{id:10086,des:"timeout"})
                error_msg.__return=true
                resolve(error_msg)
            },this._timeout)
            gEventTool.once(msg.__rpcid,func)
            super.send(msg)
        })
    }
    receive_other_all(msg:RpcMsg)
    {
        gLog.error({des:"no handle",msg})
    }
    protected async _onMessage(msg:RpcMsg)
    {
        if(msg.__return)
        {
            let ret = this.filterMsg(msg)
            if(!ret)
            {
                return
            }
            gEventTool.emit(msg.__rpcid,msg)
            return
        }
        super._onMessage(msg)
    }
}