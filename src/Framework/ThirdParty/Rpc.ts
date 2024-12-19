import { core } from "../Core/Core"
import { gLog } from "../Logic/Log"
import { RpcMsg } from "../SocketServer/IRpc"
import { CgMq, RpcConfig } from "./CgMq"

class Remote
{
    protected _retmsg:RpcMsg=null
    get retMsg()
    {
        return this._retmsg
    }
    protected _cgmq:CgMq=null
    get cgmq()
    {
        return this._cgmq
    }
    protected _to_group=""
    protected _to_id=""
    protected _listen=""
    constructor(group:string,id:string,cgmq:CgMq,listen:string)
    {
        this._to_group=group
        this._to_id=id
        this._listen=listen
        this._cgmq=cgmq
    }
    async call(func_name:string,...args)
    {
        this._retmsg = await this._cgmq.callRemote(this._to_group,this._to_id,this._listen,func_name,...args)
        let datas:any[]=this._retmsg.data
        let ret={rets:datas,ret:null}
        if(datas&&datas.length>0)
        {
            ret.ret=datas[0]
        }
        return ret
    }
}

export class Rpc
{
    protected _cgmq:CgMq=null
    get cgmq()
    {
        return this._cgmq
    }
    async init(cfg:RpcConfig)
    {
        this._cgmq=new CgMq()
        let ret = await this._cgmq.init(cfg,this.onMsg.bind(this))
        return ret
    }
    getRemote(group:string,id="",listen="")
    {
        return new Remote(group,id,this._cgmq,listen)
    }
    async onMsg(msg:RpcMsg)
    {
        if(!msg||!msg.data||!msg.data.cmd)
        {
            return
        }
        let cmd:string = msg.data.cmd
        let func = this[cmd]
        if(!func)
        {
            gLog.error({des:"rpc no cmd",msg})
            return
        }
        let data = await core.safeCall(func,this,...msg.data?.args,msg)
        return data
    }
}