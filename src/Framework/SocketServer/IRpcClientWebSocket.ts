import _ = require("underscore");
import { GEventTool } from "../Logic/EventTool";
import { GLog } from "../Logic/Log";
import { IRpc, RpcMsg } from "./IRpc";
import { IClientWebSocket } from "./IClientWebSocket";
import { core } from "../Core/Core";

export class IRpcClientWebSocket extends IClientWebSocket implements IRpc
{
    /**
     * 自己的身份
     */
    protected _group=""
    protected _id=""
    //超时时间
    protected _timeout=3000
    protected _genId(pre="")
    {
        return pre+"_"+core.getUuid()
    }
    getNewMsg(cmd: string, errcode?: { id: number; des: string; }) {
        let msg = super.getNewMsg(cmd,errcode) as RpcMsg
        msg.__rpcid=this._genId(cmd)
        msg.from_group=this._group
        msg.from_id=this._id
        return msg
    }
    toRetMsg(req_msg:RpcMsg,data:any,errcode?: { id: number; des: string; })
    {
        let ret_msg = this.getNewMsg(req_msg.cmd,errcode)
        //唯一标识必须保持一致
        ret_msg.__return=true
        ret_msg.__rpcid=req_msg.__rpcid
        ret_msg.data=data
        ret_msg.from_group=this._group
        ret_msg.from_id=this._id
        ret_msg.to_group=req_msg.from_group
        ret_msg.to_id=req_msg.from_id
        return ret_msg
    }
    async callRemote(msg: RpcMsg)
    {
        if(!msg)
        {
            GLog.error("send null msg!")
            return
        }
        if(!msg.__rpcid)
        {
            msg.__rpcid=this._genId(msg.cmd)
        }
        return new Promise((resolve,reject)=>
        {
            let handler = null
            let func=(jsonData)=>
            {
                if(handler)
                {
                    clearTimeout(handler)
                    handler=null
                }
                resolve(jsonData)
            }
            handler = setTimeout(()=>
            {
                GEventTool.off(msg.__rpcid,func)
                resolve({errcode:{id:10086,des:"timeout"}})
            },3000)
            GEventTool.once(msg.__rpcid,func)
            super.send(msg)
        })
    }
    receive_other_all(msg:RpcMsg)
    {
        GLog.error({des:"no handle",msg})
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
            GEventTool.emit(msg.__rpcid,msg)
            return
        }
        super._onMessage(msg)
    }
}