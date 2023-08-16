import { core } from "../Core/Core"
import { GLog } from "../Logic/Log"
import { CgMq, CgMqConfig, CgMqRetMsg } from "./CgMq"

class Remote
{
    protected _retmsg:CgMqRetMsg=null
    get retMsg()
    {
        return this._retmsg
    }
    protected _cgmq:CgMq=null
    get cgmq()
    {
        return this._cgmq
    }
    protected _to_identity=""
    constructor(identity:string,cgmq:CgMq)
    {
        this._to_identity=identity
        this._cgmq=cgmq
    }
    async call(func_name:string,...args):Promise<any|any[]>
    {
        this._retmsg = await this._cgmq.callRemote(this._to_identity,func_name,...args)
        if(!this._retmsg.data)
        {
            return
        }
        let datas:any[]=this._retmsg.data 
        if(datas.length==1)
        {
            return datas[0]
        }
        return datas
    }
}
export class RpcConfig extends CgMqConfig
{

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
    getRemote(identity:string)
    {
        return new Remote(identity,this._cgmq)
    }
    async onMsg(msg:CgMqRetMsg)
    {
        if(!msg||!msg.data||!msg.data.cmd)
        {
            return
        }
        let cmd:string = msg.data.cmd
        let func = this[cmd]
        if(!func)
        {
            GLog.error({des:"rpc no cmd",msg})
            return
        }
        let data = await core.safeCall(func,this,...msg.data?.args,msg)
        return data
    }
}