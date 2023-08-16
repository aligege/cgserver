import _ = require("underscore");
import { GEventTool } from "../Logic/EventTool";
import { GLog } from "../Logic/Log";
import { IServerWebSocket } from "./IServerWebSocket";
import { IRpc, RpcBaseMsg } from "./IRpc";
import { BaseMsg } from "./IWebSocket";

export class IRpcServerWebSocket extends IServerWebSocket implements IRpc
{
    protected _genId(pre="")
    {
        return pre+"_"+Date.now()%10000000000+"_"+_.uniqueId()+_.random(9999999)
    }
    getNewMsg(cmd: string, errcode?: { id: number; des: string; }) {
        let msg = super.getNewMsg(cmd,errcode) as RpcBaseMsg|any
        msg.__rpcid=this._genId(cmd)
        return msg
    }
    extendRetMsg(msg:RpcBaseMsg,errcode?: { id: number; des: string; })
    {
        let basemsg = super.getNewMsg(msg.cmd,errcode)
        basemsg.__rpcid=msg.__rpcid
        _.extend(msg,basemsg)
        return msg
    }
    async callRemote(msg: RpcBaseMsg)
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
    receive_other_all(msg:RpcBaseMsg)
    {
        if(msg.__rpcid)
        {
            GEventTool.emit(msg.__rpcid,msg)
            return
        }
        GLog.error({des:"no handle",msg})
    }
    protected async _onMessage(msg:RpcBaseMsg)
    {
        if(msg.__return)
        {
            GEventTool.emit(msg.__rpcid,msg)
            return
        }
        super._onMessage(msg)
    }
}