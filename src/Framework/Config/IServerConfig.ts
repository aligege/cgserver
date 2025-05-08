import { gLog } from '../Logic/Log';
import { FrameworkConfig } from './FrameworkConfig';

export class IServerConfig extends FrameworkConfig
{
    protected _server_name=""
    get serverName()
    {
        return this._server_name
    }
    constructor(server_name:string)
    {
        super()
        this._server_name = server_name
        this._suffix=this._server_name
    }
    init()
    {
        if(gServerCfg)
        {
            gLog.error("ServerConfig init must be unique")
            return
        }
        gServerCfg=this
        let ret = super.init()
        if(!ret)
        {
            return ret
        }
        return ret
    }
}
export let gServerCfg:IServerConfig=null