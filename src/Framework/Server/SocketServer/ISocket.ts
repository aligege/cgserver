import { IProtoFilter,EProtoType } from "../ProtoFilter/IProtoFilter";
import { core } from '../../Core/Core';
import * as _ from "underscore";
import { gProtoFactory } from "../ProtoFilter/ProtoFactory";
import { gSyncQueueTool } from "../../Logic/SyncQueueTool";
import { gLog } from "../../Logic/Log";
import * as net from "net";
import { PacketParser } from "./PacketParser";

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

export class ISocket
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
    protected _socket: net.Socket = null
    get socket()
    {
        return this._socket
    }
    protected _protoType:EProtoType = EProtoType.Json
    protected _protoFilter:IProtoFilter = null
    protected _protoPath = ""
    
    protected _ip:string = null
    get remoteHost()
    {
        if(!this._ip&&this._socket)
        {
            this._ip = this._socket.remoteAddress
            this._ip = this._ip.substring(this._ip.lastIndexOf(":")+1)
        }
        return this._ip
    }
    get connected()
    {
        if (this._socket
            &&this._socket.readyState=="open")
        {
            return true
        }
        return false
    }
    protected _nodebugmsgs:{[cmd:string]:boolean}={
        "heartbeat":true,
        "ping":true
    }
    protected _packetParser: PacketParser
    
    constructor(protoType=EProtoType.Json,protoPath="")
    {
        this._socket_id = parseInt(_.uniqueId())
        this._protoType=protoType
        this._protoPath=protoPath
        this._packetParser = new PacketParser()
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
    onConnect(_socket:net.Socket)
    {
        this._socket = _socket
        if(!this._protoFilter)
        {
            this._protoFilter = gProtoFactory.createFilter(this._protoType)
            this._protoFilter.init(this._protoPath)
        }
        this._socket.on("data",this._onData.bind(this))
        this._socket.on("error",this.onError.bind(this))
        this._socket.on("close",this.onClose.bind(this))
        this.onOpen()
    }
    protected _onData(message: Buffer)
    {
        try
        {
            this._packetParser.push(message)
            let packet = this._packetParser.parse()
            while (packet) {
                this._onMessage(packet)
                packet = this._packetParser.parse()
            }
        }
        catch (e)
        {
            gLog.error(this.tipKey+' Received Message Handle Error: ' + e)
        }
    }
    onMessage(message: Buffer)
    {
        try
        {
            let msg = this._onDecode(message)
            if(this._is_sync_msg)
            {
                gSyncQueueTool.add(this._socket_id+"",this._onMessage,this,msg)
            }
            else
            {
                this._onMessage(msg)
            }
        }
        catch (e)
        {
            gLog.error(this.tipKey+' Received Message Handle Error: ' + e)
        }
    }
    protected _onDecode(message: Buffer, ...params)
    {
        return this._protoFilter.decode(message, ...params)
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
            gLog.error({tipKey:this.tipKey,action:"receive",error:"no cmd",msg})
            return false
        }
        if(this._debug_msg && !this._nodebugmsgs[msg.cmd])
        {
            gLog.info({tipKey:this.tipKey,action:"receive",msg})
        }
        if (!msg.cmd)
        {
            gLog.error({tipKey:this.tipKey,action:"receive",error:"no cmd",msg})
            return false
        }
        return true
    }
    protected async _onMessage(data:any)
    {
        let time=Date.now()
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
                gLog.error(this.tipKey+' Received Message warning: no cmd handle,cmd=' + jsonData.cmd)
            }
        }
        else
        {
            await core.safeCall(func,this,jsonData)
        }
        if(this._debug_msg&&!this._nodebugmsgs[jsonData.cmd])
        {
            gLog.info("["+(Date.now()-time)+"ms] "+jsonData.cmd)
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
        gLog.info(this.tipKey+" "+this._socket_id+":onClose resonCode="+reasonCode+"  des="+description)
    }
    filterSendMsg(msg:BaseMsg)
    {
        if (!this.connected)
        {
            return false
        }
        if (!msg)
        {
            gLog.error(this.tipKey+" Send Message warning:null data!")
            return false
        }
        if(this._debug_msg&&!this._nodebugmsgs[msg.cmd])
        {
            gLog.info({tipKey:this.tipKey,action:"send",msg})
        }
        return true
    }
    send(msg:BaseMsg)
    {
        let ret = this.filterSendMsg(msg)
        if(!ret)
        {
            return
        }
        let data = this._onEncode(msg)
        this._socket.write(this._packetParser.pack(data))
    }
    /**
     * Close the connection. A close frame will be sent to the remote peer indicating
     * that we wish to close the connection, and we will then wait for up to
     * `config.closeTimeout` milliseconds for an acknowledgment from the remote peer
     * before terminating the underlying socket connection.
     */
    close(reasonCode?: number, description?: string)
    {
        this._socket.end()
    }
    /**
     * Send a close frame to the remote peer and immediately close the socket without
     * waiting for a response. This should generally be used only in error conditions.
     */
    drop(reasonCode?: number, description?: string, skipCloseFrame?: boolean)
    {
        this._socket.destroy()
    }
}