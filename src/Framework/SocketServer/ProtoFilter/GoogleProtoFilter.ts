import { IProtoFilter } from './IProtoFilter';
import { core } from '../../Core/Core';
import { GLog } from '../../Logic/Log';
import * as protobufjs from 'protobufjs';

export class GoogleProtoFilter implements IProtoFilter
{
    protected _root:protobufjs.Root=new protobufjs.Root()
    protected _inited=false
    init(path?:string):boolean
    {
        if(this._inited)
        {
            return
        }
        this._inited=true
        try
        {
            this._root.loadSync(path,{keepCase:true})
        }
        catch(e)
        {
            GLog.error(e)
            return false
        }
        return true
    }
    encode(data,root:string)
    { 
        let msg={cmd:data.cmd}
        msg[msg.cmd]=data
        msg[msg.cmd].cmd=undefined
        
        msg["errcode"]=data.errcode
        msg["tip"]=data.tip
        data.errcode=undefined

        delete data.errcode
        delete msg[msg.cmd].cmd

        let body = this._root.lookupType(root)
        var errMsg = body.verify(msg)
        if (errMsg)
            throw Error(errMsg)
        var msgBody = body.create(msg);
        var bufferBody = body.encode(msgBody).finish();
        return bufferBody
    }
    decode(data,root:string)
    {
        let body = this._root.lookupType(root)
        if(!body)
        {
            GLog.info("proto body not in proto(!"+root+")")
            return null
        }
        let msgBody = body.decode(data)
        if(!msgBody)
        {
            GLog.info("proto body decode wrong!")
            return null
        }
        let objBody = body.toObject(msgBody)
        let obj = objBody[objBody.cmd]
        obj.cmd=objBody.cmd
        return obj
    }
}