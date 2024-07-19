import { core } from "../Core/Core"
import { RpcMsg } from "../SocketServer/IRpc"
import { global } from "../global"
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
    constructor(group:string,id:string,cgmq:CgMq)
    {
        this._to_group=group
        this._to_id=id
        this._cgmq=cgmq
    }
    async call(func_name:string,...args):Promise<any|any[]>
    {
        this._retmsg = await this._cgmq.callRemote(this._to_group,this._to_id,func_name,...args)
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
    getRemote(group:string,id:string="")
    {
        return new Remote(group,id,this._cgmq)
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
            global.gLog.error({des:"rpc no cmd",msg})
            return
        }
        let data = await core.safeCall(func,this,...msg.data?.args,msg)
        return data
    }
}