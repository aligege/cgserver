import _ = require("underscore");
import { IRpc, RpcMsg } from "./IRpc";
import { IClientWebSocket } from "./IClientWebSocket";
import { core } from "../../Core/Core";
import { gLog } from "../../Logic/Log";
import { gEventTool } from "../../Logic/EventTool";

export class IRpcClientWebSocket extends IClientWebSocket implements IRpc
{
    /**
     * 自己的身份
     */
    protected _group=""
    protected _id=""
    //超时时间
    protected _timeout=3000
    protected _listens:{[key:string]:boolean}={}
    isListenning(listen:string)
    {
        if(!listen)
        {
            return true
        }
        return !!this._listens[listen]
    }
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
        ret_msg.from_group=req_msg.to_group
        ret_msg.from_id=this._id
        ret_msg.to_group=req_msg.from_group
        ret_msg.to_id=req_msg.from_id
        return ret_msg
    }
    async callRemote(msg: RpcMsg)
    {
        if(!msg)
        {
            gLog.error("send null msg!")
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
                gEventTool.off(msg.__rpcid,func)
                resolve({errcode:{id:10086,des:"timeout"}})
            },3000)
            gEventTool.once(msg.__rpcid,func)
            super.send(msg)
        })
    }
    receive_init(req_msg:RpcMsg)
    {
        if(req_msg.__rpcid)
        {
            req_msg.__return=true
        }
        if(!req_msg.from_group)
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10004,des:"初始化消息必须带有identity"})
            this.send(ret_msg)
            return
        }
        this._group=req_msg.from_group
        this._id=req_msg.from_id

        let ret_msg = this.toRetMsg(req_msg,null)
        this.send(ret_msg)
    }
    receive_listen(req_msg:RpcMsg)
    {
        if(req_msg.__rpcid)
        {
            req_msg.__return=true
        }
        let data:string[] = req_msg.data
        if(!data||!core.isArray(data))
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10005,des:"listen data not correct must be string[]"})
            this.send(ret_msg)
            return
        }
        for(let i=0;i<data.length;i++)
        {
            let listen = data[i]
            if(!listen)
            {
                continue
            }
            this._listens[listen]=true
        }

        let ret_msg = this.toRetMsg(req_msg,null)
        this.send(ret_msg)
    }
    receive_unlisten(req_msg:RpcMsg)
    {
        if(req_msg.__rpcid)
        {
            req_msg.__return=true
        }
        let data:string[] = req_msg.data
        if(!data||!core.isArray(data))
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10005,des:"listen data not correct must be string[]"})
            this.send(ret_msg)
            return
        }
        for(let i=0;i<data.length;i++)
        {
            let listen = data[i]
            if(!listen)
            {
                continue
            }
            this._listens[listen]=undefined
            delete this._listens[listen]
        }
        let ret_msg = this.toRetMsg(req_msg,null)
        this.send(ret_msg)
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