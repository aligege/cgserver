import { core } from "../Core/Core";
import { GLog } from "../Logic/Log";
import { IRpcServerWebSocket } from "../SocketServer/IRpcServerWebSocket";
import * as _ from "underscore";
import { RpcMsg } from "../SocketServer/IRpc";

class CgMqServerWebsocket extends IRpcServerWebSocket
{
    protected _cgmq:CgMq=null
    constructor(cgmq:CgMq)
    {
        super(cgmq.cfg.group,cgmq.cfg.id,cgmq.cfg.timeout)
        this._cgmq=cgmq
        this._debug_msg=true
    }
    onOpen(e?: any): void {
        this.init()
    }
    async init()
    {
        let msg = this.getNewMsg("init")
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    //把消息发送给rpc服务器，目的是调用远程函数
    async push(to_group:string,data:any,to_id="")
    {
        let msg = this.getNewMsg("msg")
        msg.to_group = to_group
        msg.to_id = to_id
        msg.data = data
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    //收到来自远程的调用消息
    async receive_msg(req_msg:RpcMsg)
    {
        let data = await this._cgmq.onMsg(req_msg)
        let ret_msg = this.toRetMsg(req_msg,data)
        this.send(ret_msg)
    }
}
export class RpcConfig
{
    /**
     * 当前rpc分组，一旦确认不可更改
     */
    group=""
    /**
     * 当前rpc唯一id，一旦确认不可更改
     */
    id=""
    /**
     * rpc超时时间，默认3000ms
     */
    timeout=0
    host=""
    port=-1
}
export class CgMq
{
    protected _ws:CgMqServerWebsocket=null
    protected _inited=false
    protected _cfg:RpcConfig=null
    protected _onmsg:(msg:RpcMsg)=>any=null
    get id()
    {
        return this._cfg.id
    }
    get cfg()
    {
        return this._cfg
    }
    get group()
    {
        return this._cfg?.group||""
    }
    /**
     * 
     * @param cfg rpc服务器的配置
     * @param onmsg 
     * @returns 
     */
    async init(cfg:RpcConfig,onmsg?:(msg:RpcMsg)=>any)
    {
        if(!cfg||!cfg.group||!cfg.id)
        {
            return false
        }
        this._cfg=cfg
        this._onmsg=onmsg
        if(this._inited)
        {
            GLog.error("dulplicate init for CgMq")
            return true
        }
        this._inited=true
        if(!this._ws)
        {
            this._ws=new CgMqServerWebsocket(this)
        }
        return new Promise(async (resolve,reject)=>
        {
            this._ws.connect(cfg.host,cfg.port)
            let pretime = Date.now()
            while(true)
            {
                if(this._ws.connected)
                {
                    resolve(true)
                    break
                }
                let now = Date.now()
                if(now-pretime>=3*1000)
                {
                    this._ws.close()
                    resolve(false)
                    break
                }
                await core.sleep(100)
            }
        })
    }
    async callRemote(group:string,to_id:string,func_name:string,...args)
    {
        let data = 
        {
            cmd:func_name,
            args:args
        }
        let ret = (await this._ws.push(group,data,to_id)) as RpcMsg
        return ret
    }
    async onMsg(msg:RpcMsg)
    {
        if(this._onmsg)
        {
            let data = await core.safeCall(this._onmsg,null,msg)
            return data
        }
        return
    }
}