import { FrameworkConfig } from './FrameworkConfig';

export class IServerConfig extends FrameworkConfig
{
    port=-1
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
        let ret = super.init()
        if(!ret)
        {
            return ret
        }
        gServerCfg=this
        return ret
    }
}
export let gServerCfg:IServerConfig=null