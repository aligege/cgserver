import { core } from "../../Core/Core";
import * as _ from "underscore";
import { IRpcServerWebSocket } from "./IRpcServerWebSocket";
import { gLog } from "../../Logic/Log";
import { RpcMsg } from "./IRpc";

class CgMqServerWebsocket extends IRpcServerWebSocket
{
    protected _cgmq:CgMq=null
    protected _listens:{[listen:string]:boolean}={}
    get listens()
    {
        return this._listens
    }
    constructor(cgmq:CgMq)
    {
        super(cgmq.cfg.group,cgmq.cfg.id,cgmq.cfg.timeout)
        this._cgmq=cgmq
        this._debug_msg=true
    }
    onOpen(e?: any): void {
        super.onOpen(e)
        this.init()
        this.listen(Object.keys(this._listens))
    }
    async init()
    {
        let msg = this.getNewMsg("init")
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    async listen(data:string[])
    {
        for(let i=0;i<data.length;i++)
        {
            let listen = data[i]
            if(!listen)
            {
                continue
            }
            this._listens[listen]=true
        }
        let msg = this.getNewMsg("listen")
        msg.data = data
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    async unlisten(data:string[])
    {
        for(let i=0;i<data.length;i++)
        {
            let listen = data[i]
            if(!listen)
            {
                continue
            }
            delete this._listens[listen]
        }
        let msg = this.getNewMsg("unlisten")
        msg.data = data
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    //把消息发送给rpc服务器，目的是调用远程函数
    async push(to_group:string,data:any,to_id="",listen="",is_mq:boolean=false):Promise<RpcMsg|null>
    {
        let msg = this.getNewMsg("msg")
        msg.to_group = to_group
        msg.to_id = to_id
        msg.data = data
        msg.listen = listen
        msg.__is_mq=is_mq
        let ret_rpcmsg = await this.callRemote(msg)
        return ret_rpcmsg
    }
    //收到来自远程的调用消息
    async receive_msg(req_msg:RpcMsg)
    {
        let data = await this._cgmq.onMsg(req_msg)
        if(req_msg.__is_mq)
        {
            //mq消息不需要回复
            return
        }
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
    wss=false
}
export class CgMq
{
    protected _ws:CgMqServerWebsocket=null
    get ws()
    {
        return this._ws
    }
    get listens()
    {
        if(!this._ws)
        {
            return {}
        }
        return this._ws.listens
    }
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
            gLog.error("dulplicate init for CgMq")
            return true
        }
        this._inited=true
        if(!this._ws)
        {
            this._ws=new CgMqServerWebsocket(this)
        }
        return new Promise<boolean>(async (resolve,reject)=>
        {
            this._ws.connect(cfg.wss,cfg.host,cfg.port)
            let pretime = Date.now()
            while(true)
            {
                if(this._ws.connected)
                {
                    resolve(true)
                    break
                }
                let now = Date.now()
                if(now-pretime>=this._cfg.timeout)
                {
                    this._ws.close()
                    resolve(false)
                    break
                }
                await core.sleep(100)
            }
        })
    }
    async callRemote(group:string,to_id:string,listen:string,func_name:string,is_mq:boolean=false,...args):Promise<RpcMsg|null>
    {
        let time=Date.now()
        let data = 
        {
            cmd:func_name,
            args:args
        }
        let ret_rpcmsg = await this._ws.push(group,data,to_id,listen,is_mq)
        if(this._ws.debug_msg)
        {
            gLog.info("["+(Date.now()-time)+"ms] callRemote:"+group+"-"+func_name+"-"+listen)
        }
        return ret_rpcmsg
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
    async listen(data:string[])
    {
        return await this._ws.listen(data)
    }
    async unlisten(data:string[])
    {
        return await this._ws.unlisten(data)
    }
}