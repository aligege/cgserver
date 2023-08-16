import { core } from "../Core/Core";
import { GLog } from "../Logic/Log";
import { IRpcServerWebSocket } from "../SocketServer/IRpcServerWebSocket";
import { BaseMsg } from "../SocketServer/IWebSocket";
import * as _ from "underscore";
import { StringDecoder } from "string_decoder";
import { RpcBaseMsg } from "../SocketServer/IRpc";

//接受到的消息无需basemsg部分
class CgMqMsg extends RpcBaseMsg
{
    /**
     * 必填，目的身份
     */
    to_identity=""
    /**
     * 消息携带的数据
     */
    data:any=null
}
export class CgMqRetMsg extends CgMqMsg
{
     /**
      * 发送者身份
      */
     from_identity=""
     /**
      * audience 数量
      */
     count=0
}
class CgMqServerWebsocket extends IRpcServerWebSocket
{
    protected _cgmq:CgMq=null
    /**
     * 自己的身份
     */
    protected _identity=""
    constructor(cgmq:CgMq)
    {
        super()
        this._cgmq=cgmq
        this._identity=this._cgmq.cfg.identity
        this._debug_msg=true
    }
    onOpen(e?: any): void {
        this.init(this._cgmq.cfg.identity)
    }
    async init(identity:string)
    {
        let msg = this.getNewMsg("init")
        msg.identity=identity
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    async push(to_identity:string,data:any)
    {
        let msg = this.getNewMsg("msg") as CgMqMsg
        msg.to_identity = to_identity
        msg.data = data
        let jsonData = await this.callRemote(msg)
        return jsonData
    }
    async receive_msg(msg:CgMqRetMsg)
    {
        let data = await this._cgmq.onMsg(msg)
        msg.data = data
        msg.__return = true
        msg.to_identity=msg.from_identity
        msg.from_identity=this._identity
        this.send(msg)
    }
}
export class CgMqConfig
{
    identity=""
    host=""
    port=-1
}
export class CgMq
{
    protected _ws:CgMqServerWebsocket=null
    protected _inited=false
    protected _cfg:CgMqConfig=null
    protected _onmsg:(msg:CgMqRetMsg)=>any=null
    get cfg()
    {
        return this._cfg
    }
    get identity()
    {
        return this._cfg?.identity
    }
    async init(cfg:CgMqConfig,onmsg?:(msg:CgMqRetMsg)=>any)
    {
        if(!cfg)
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
    async callRemote(to_identity:string,func_name:string,...args)
    {
        let data = 
        {
            cmd:func_name,
            args:args
        }
        let jsonData:CgMqRetMsg = (await this._ws.push(to_identity,data)) as CgMqRetMsg
        return jsonData
    }
    async onMsg(msg:CgMqRetMsg)
    {
        if(this._onmsg)
        {
            let data = await core.safeCall(this._onmsg,null,msg)
            return data
        }
        return
    }
}