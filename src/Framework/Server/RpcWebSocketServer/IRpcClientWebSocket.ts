import _ = require("underscore");
import { IRpc, RpcMsg } from "./IRpc";
import { IClientWebSocket } from "../WebSocketServer/IClientWebSocket";
import { core } from "../../Core/Core";
import { gLog } from "../../Logic/Log";
import { gEventTool } from "../../Logic/EventTool";
import { IWebSocketServer } from "../WebSocketServer/IWebSocketServer";

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
        let msg = new RpcMsg(cmd,errcode)
        msg.__rpcid=this._genId(cmd)
        msg.__return=false
        //mq消息不需要回复
        msg.__is_mq=false
        msg.from_group=this._group
        msg.from_id=this._id
        msg.to_group=""
        msg.to_id=""
        msg.listen=""
        return msg
    }
    toRetMsg(req_msg:RpcMsg,data:any,errcode?: { id: number; des: string; })
    {
        let ret_msg = new RpcMsg(req_msg.cmd,errcode)
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
        if(msg.__is_mq)
        {
            //mq消息不需要回复
            this.send(msg)
            return
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
            this.send(msg)
        })
    }
    receive_init(req_msg:RpcMsg)
    {
        this._group=req_msg.from_group||""
        this._id=req_msg.from_id||""

        if(!req_msg.from_group)
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10004,des:"初始化消息必须带有identity"})
            ret_msg.from_group="cgrpc"
            ret_msg.from_id=""
            this.send(ret_msg)
            return
        }

        let ret_msg = this.toRetMsg(req_msg,null)
        ret_msg.from_group="cgrpc"
        ret_msg.from_id=""
        this.send(ret_msg)
    }
    receive_listen(req_msg:RpcMsg)
    {
        let data:string[] = req_msg.data
        if(!data||!core.isArray(data))
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10005,des:"listen data not correct must be string[]"})
            ret_msg.from_group="cgrpc"
            ret_msg.from_id=""
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
        ret_msg.from_group="cgrpc"
        ret_msg.from_id=""
        this.send(ret_msg)
    }
    receive_unlisten(req_msg:RpcMsg)
    {
        let data:string[] = req_msg.data
        if(!data||!core.isArray(data))
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10005,des:"listen data not correct must be string[]"})
            ret_msg.from_group="cgrpc"
            ret_msg.from_id=""
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
        ret_msg.from_group="cgrpc"
        ret_msg.from_id=""
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
    constructor(server:IWebSocketServer)
    {
        super(server)
        this._debug_msg=true
        this._group=""
        this._id=core.getUuid()
    }
    getWsByGroup(group:string,listen:string)
    {
        let wses:IRpcClientWebSocket[]=[]
        if(!group)
        {
            return wses
        }
        let allClients = this.server.wsClients
        for(let key in allClients)
        {
            let ct = allClients[key] as IRpcClientWebSocket
            if(ct._group==group&&ct.isListenning(listen))
            {
                wses.push(ct)
            }
        }
        return wses
    }
    getWsByGroupId(group:string,id:string)
    {
        if(!group)
        {
            return null
        }
        let allClients = this.server.wsClients
        for(let key in allClients)
        {
            let ct = allClients[key] as IRpcClientWebSocket
            if(ct._group==group&&ct._id==id)
            {
                return ct
            }
        }
        return null
    }
    async receive_msg(req_msg:RpcMsg)
    {
        if(!req_msg.__rpcid)
        {
            let retMsg = this.getNewMsg("msg",{id:10001,des:"非法rpc消息"})
            this.send(retMsg)
            return
        }
        if(!req_msg.to_group)
        {
            let ret_msg = this.toRetMsg(req_msg,req_msg.data,{id:10002,des:"消息中必须附带接受方的身份to_group"})
            this.send(ret_msg)
            return
        }
        let wses:IRpcClientWebSocket[]=[]
        if(req_msg.to_id)
        {
            let ws = this.getWsByGroupId(req_msg.to_group,req_msg.to_id)
            wses.push(ws)
        }
        else
        {
            wses = this.getWsByGroup(req_msg.to_group,req_msg.listen)
        }
        //发送给远程服务器的消息
        if(wses.length==0)
        {
            req_msg.errcode={id:10004,des:"一个接收者都没找到"}
            this.send(req_msg)
            return
        }
        let arets=[]
        let rpc_id=req_msg.__rpcid
        let rpc_id_index=0
        for(let key in wses)
        {
            let ws = wses[key]
            req_msg.__rpcid=rpc_id+"_"+rpc_id_index
            rpc_id_index++
            let ret = ws.callRemote(req_msg)
            arets.push(ret)
        }
        if(req_msg.__is_mq)
        {
            //mq消息不需要回复
            return
        }
        let rets=[]
        let first_ret:RpcMsg=null
        for(let key in arets)
        {
            let ret=await arets[key]
            rets.push(ret.data)
            if(!first_ret)
            {
                first_ret=ret
            }
        }
        //还原rpc_id
        req_msg.__rpcid=rpc_id
        //回复给调用来源的服务器
        let retMsg = this.toRetMsg(req_msg,rets)
        if(first_ret)
        {
            retMsg.from_group=req_msg.to_group
            retMsg.to_group=req_msg.from_group
            if(req_msg.to_id)
            {
                retMsg.from_id=first_ret.from_id
            }
            else
            {
                retMsg.from_id=""
            }
        }
        this.send(retMsg)
    }
}