import { GLog } from '../Logic/Log';
import { GProtoFactory } from './ProtoFilter/ProtoFactory';
import { IProtoFilter,EProtoType } from "./ProtoFilter/IProtoFilter";
import * as ws from 'websocket';
import { core } from '../Core/Core';
import * as _ from "underscore";
import { GServerCfg } from '../Config/IServerConfig';
import { GSyncQueueTool } from '../Logic/SyncQueueTool';

export class BaseMsg
{
    cmd: string
    errcode?: {id:number,des:string}
    servertime=Date.now()
    constructor(cmd:string,errcode?: {id:number,des:string})
    {
        this.cmd=cmd
        this.errcode=errcode
    }
}
export class IWebSocket
{
    /**
     * 是否同步消息
     * 默认为true
     */
    protected _is_sync_msg = true
    get isSynMsg()
    {
        return this._is_sync_msg
    }
    protected _debug_msg:boolean=false
    get debug_msg()
    {
        return this._debug_msg
    }
    set debug_msg(value)
    {
        this._debug_msg = value
    }
    protected _socket_id: number=0
    get socketId():number
    {
        return this._socket_id
    }
    protected _tipKey:string=""
    get tipKey()
    {
        return this._tipKey
    }
    protected _ws:ws.connection = null
    protected _req:ws.request = null
    protected _protoType:EProtoType = EProtoType.Json
    protected _protoFilter:IProtoFilter = null
    protected _protoPath = ""
    
    protected _ip:string = null
    get remoteHost()
    {
        if(!this._ip)
        {
            this._ip = this._ws.remoteAddress
            this._ip = this._ip.substring(this._ip.lastIndexOf(":")+1)
        }
        return this._ip
    }
    get connected()
    {
        if (this._ws
            &&this._ws.connected==true)
        {
            return true
        }
        return false
    }
    constructor(protoType=EProtoType.Json,protoPath="")
    {
        this._debug_msg = GServerCfg.debug_msg
        this._socket_id = parseInt(_.uniqueId())
        this._protoType=protoType
        this._protoPath=protoPath
    }
    getNewMsg(cmd:string, errcode?:{id:number,des:string}):BaseMsg|any
    {
        let msg = new BaseMsg(cmd,errcode)
        return msg
    }
    receive_heartbeat(jsonData)
    {
        this.send_heartbeat()
    }
    send_heartbeat()
    {
        let msg = this.getNewMsg("heartbeat")
        this.send(msg)
    }
    onConnect(_ws:ws.connection,_req:ws.request)
    {
        this._ws = _ws
        this._req = _req
        if(!this._protoFilter)
        {
            this._protoFilter = GProtoFactory.createFilter(this._protoType)
            this._protoFilter.init(this._protoPath)
        }
        this._ws.on("message",this.onMessage.bind(this))
        this._ws.on("error",this.onError.bind(this))
        this._ws.on("close",this.onClose.bind(this))
        this.onOpen()
    }
    onMessage(message:ws.Message)
    {
        try
        {
            let msg = this._onDecode(message)
            if(this._is_sync_msg)
            {
                GSyncQueueTool.add(this._socket_id+"",this._onMessage,this,msg)
            }
            else
            {
                this._onMessage(msg)
            }
        }
        catch (e)
        {
            GLog.error(this.tipKey+' Received Message Handle Error: ' + e)
        }
    }
    protected _onDecode(message:ws.Message,...params)
    {
        let msg=null
        if (message.type === 'utf8')
        {
            msg=this._protoFilter.decode(message.utf8Data,...params)
        }
        else if (message.type === 'binary')
        {
            msg=this._protoFilter.decode(message.binaryData,...params)
        }
        return msg
    }
    protected _onEncode(data:any,...params)
    {
        let msg = this._protoFilter.encode(data,...params)
        return msg
    }
    /**
     * 过滤消息，每个消息处理之前调用
     * @param msg 
     * @returns 
     */
    filterMsg(msg:BaseMsg)
    {
        if(!msg)
        {
            GLog.error({tipKey:this.tipKey,action:"receive",error:"no cmd",msg})
            return false
        }
        if(this._debug_msg && msg.cmd!="heartbeat")
        {
            GLog.info({tipKey:this.tipKey,action:"receive",msg})
        }
        if (!msg.cmd)
        {
            GLog.error({tipKey:this.tipKey,action:"receive",error:"no cmd",msg})
            return false
        }
        return true
    }
    protected async _onMessage(data:any)
    {
        let jsonData = data
        let func:Function = this["receive_"+jsonData.cmd]
        let ret = this.filterMsg(jsonData)
        if(!ret)
        {
            return
        }
        else if (!func)
        {
            let otherfunc:Function=this["receive_other_all"]
            if(otherfunc)
            {
                await core.safeCall(otherfunc,this,jsonData)
            }
            else
            {
                GLog.error(this.tipKey+' Received Message warning: no cmd handle,cmd=' + jsonData.cmd)
            }
        }
        else
        {
            await core.safeCall(func,this,jsonData)
        }
    }
    onOpen(e?)
    {
        
    }
    onError(e:Error)
    {
        
    }
    onClose(reasonCode:number, description:string)
    {
        GLog.info(this.tipKey+" onClose resonCode="+reasonCode+"  des="+description)
    }
    send(msg:BaseMsg)
    {
        if (!this.connected)
        {
            return
        }
        if (!msg)
        {
            GLog.error(this.tipKey+" Send Message warning:null data!")
            return
        }
        if(this._debug_msg
            &&msg.cmd!="heartbeat")
        {
            GLog.info({tipKey:this.tipKey,action:"send",msg})
        }
        let data = this._onEncode(msg)
        this._ws.send(data)
    }
    close()
    {
        this._ws.close()
    }
    getServerNameFromCmd(cmd)
    {
        if(!cmd||!core.isString(cmd))
        {
            return null
        }
        let index = cmd.indexOf("_")
        if(index<=0)
        {
            return null
        }
        return cmd.substring(0,index)
    }
}