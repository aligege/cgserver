import { GLog } from '../Logic/Log';
import { GProtoFactory } from './ProtoFilter/ProtoFactory';
import { IProtoFilter,EProtoType } from "./ProtoFilter/IProtoFilter";
import * as ws from 'websocket';
import { core } from '../Core/Core';
import { GFCfg } from '../Config/FrameworkConfig';
import * as _ from "underscore";
let WebSocketIdMgr = 
{
    id : _.random(0,9998),
    
    getNewID ()
    {
        return this.id++
    },
}

export class IWebSocket
{
    protected _await = false
    get await()
    {
        return this._await
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
    protected _ws:ws.connection =null
    protected _protoType:EProtoType=EProtoType.Json
    protected _protoFilter:IProtoFilter=null
    protected _protoPath=""
    
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
        this._debug_msg = GFCfg.debug_msg
        this._socket_id = WebSocketIdMgr.getNewID()
        this._protoType=protoType
        this._protoPath=protoPath
    }
    getNewMsg(cmd, errcode?):any
    {
        let msg =
        {
            cmd: cmd,
            errcode: errcode,
            servertime:new Date().getTime()
        }
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
    onConnect(_ws:ws.connection)
    {
        this._ws = _ws
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
    protected _msgs:Array<any>=[]
    onMessage(message:ws.Message)
    {
        try
        {
            let msg = this._onDecode(message)
            if(this._await)
            {
                this._msgs.push(msg)
                if(!this._run_await)
                {
                    this._awaitMessages()
                }
            }
            else
            {
                this._onMessage(msg)
            }
        }
        catch (e)
        {
            GLog.error('Received Message Handle Error: ' + e)
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
    protected _onEncode(data,...params)
    {
        let msg = this._protoFilter.encode(data,...params)
        return msg
    }
    protected _run_await = false
    protected async _awaitMessages()
    {
        this._run_await=true
        while(this._msgs.length>0)
        {
            let msg = this._msgs.shift()
            await this._onMessage(msg)
        }
        this._run_await=false
    }
    /**
     * 过滤消息，每个消息处理之前调用
     * @param jsonData 
     * @returns 
     */
    filterMsg(jsonData)
    {
        if(this._debug_msg
            &&jsonData 
            && jsonData.cmd!="heartbeat")
        {
            GLog.info(this.tipKey+"  receive:--------",true)
            GLog.info(jsonData,true)
        }
        if (!jsonData.cmd || jsonData.cmd == "")
        {
            GLog.error('Received Message warning: no cmd param,data=')
            GLog.error(jsonData)
            return false
        }
        return true
    }
    protected async _onMessage(data)
    {
        let jsonData = data
        let ret = this.filterMsg(jsonData)
        if(!ret)
        {
            return
        }
        else if (!this["receive_"+jsonData.cmd])
        {
            if(this["receive_other_all"])
            {
                try
                {
                    await this["receive_other_all"](jsonData)//默认支持其他所有处理消息
                }
                catch(e)
                {
                    if(e&&e.stack)
                    {
                        GLog.error(e.stack)
                    }
                    else
                    {
                        GLog.error(e+"  msg:data="+JSON.stringify(jsonData))
                    }
                }
            }
            else
            {
                GLog.error('Received Message warning: no cmd handle,cmd=' + jsonData.cmd)
            }
        }
        else
        {
            try
            {
                await this["receive_" + jsonData.cmd](jsonData)
            }
            catch(e)
            {
                if(e&&e.stack)
                {
                    GLog.error("error msg:data="+JSON.stringify(jsonData)+"\n"+e.stack)
                }
                else
                {
                    GLog.error(e+"  msg:data="+JSON.stringify(jsonData))
                }
            }
        }
    }
    onOpen(e?)
    {
        
    }
    onError(e)
    {
        GLog.info(e)
    }
    onClose(e)
    {
        
    }
    send(data)
    {
        if (!this.connected)
        {
            return
        }
        if (!data)
        {
            GLog.error("Send Message warning:null data!")
            return
        }
        if(this._debug_msg
            &&data.cmd!="heartbeat")
        {
            GLog.info(this.tipKey+"  send:-----------------------------------",true)
            GLog.info(data,true)
        }
        let msg = this._onEncode(data)
        this._ws.send(msg)
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