import { core } from "../Core/Core"
import { gLog } from "../Logic/Log"
import { CgMq, RpcConfig } from "../Server/RpcWebSocketServer/CgMq"
import { RpcMsg } from "../Server/RpcWebSocketServer/IRpc"

class Remote
{
    protected _retmsg:RpcMsg|null=null
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
    protected _is_mq:boolean=false
    constructor(group:string,id:string,cgmq:CgMq,listen:string,is_mq:boolean=false)
    {
        this._to_group=group
        this._to_id=id
        this._listen=listen
        this._is_mq=is_mq
        this._cgmq=cgmq
    }
    async call(func_name:string,...args)
    {
        this._retmsg = await this._cgmq.callRemote(this._to_group,this._to_id,this._listen,func_name,this._is_mq,...args)
        let datas:any[]=[]
        if(this._retmsg)
        {
            datas=this._retmsg.data
        }
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
    getRemote(group:string,id="",listener="",is_mq:boolean=false)
    {
        return new Remote(group,id,this._cgmq,listener,is_mq)
    }
    //mq消息不需要回复
    getRemoteMq(group:string,id="",listener="")
    {
        return this.getRemote(group,id,listener,true)
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
    async listen(listeners:string[])
    {
        let ret = await this._cgmq.listen(listeners)
        return ret
    }
    async unlisten(listeners:string[])
    {
        let ret = await this._cgmq.unlisten(listeners)
        return ret
    }
}