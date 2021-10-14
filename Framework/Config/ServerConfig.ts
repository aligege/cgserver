import { WebServerConfig } from './FrameworkConfig';
import { Config } from "./Config";

export class ServerConfig extends Config
{
    port=-1
    protected _server_name=""
    webserver:WebServerConfig=null
    get serverName()
    {
        return this._server_name
    }
    constructor(server_name)
    {
        super("FrameworkConfig")
        this._suffix=server_name
        this._server_name = server_name
    }
}