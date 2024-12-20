import * as colors from "colors";
import * as log4js from "log4js";
/**
 * 输出颜色
 */
colors.setTheme({  
  silly: 'rainbow',  
  input: 'grey',  
  verbose: 'cyan',  
  prompt: 'red',  
  info: 'green',  
  data: 'blue',  
  help: 'cyan',  
  warn: 'yellow',  
  debug: 'magenta',  
  error: 'red'  
});
export class Log
{
    //default log
    protected _logger:log4js.Logger = null
    //the log from client
    protected _client_logger:log4js.Logger = null
    //error and warn
    protected _error_logger:log4js.Logger = null
    protected _inited=false
    init(cfg?:log4js.Configuration)
    {
        if(this._inited)
        {
            return
        }
        this._inited=true
        if(!cfg)
        {
            return
        }
        colors.enable()
        log4js.configure(cfg)

        this._logger = log4js.getLogger()
        if(cfg.categories.client_logger)
        {
            this._client_logger = log4js.getLogger("client_logger")
        }
        if(cfg.categories.error_logger&&cfg.categories.error_logger.appenders.length>0)
        {
            this._error_logger = log4js.getLogger("error_logger")
        }
    }
    protected _convertMsg(message?:any)
    {
        if(this._isObject(message))
        {
            if(message.stack)
            {
                message=message.stack
            }
            else
            {
                message = JSON.stringify(message)
            }
        }
        return message
    }
    error(message?: any)
    {
        message=this._convertMsg(message)
        this._error_logger?.error(message)
    }
    info(message:any)
    {
        message=this._convertMsg(message)
        this._logger?.info(message)
    }
    warn(message?: any)
    {
        message=this._convertMsg(message)
        this._error_logger?.warn(message)
    }
    record(message?: any)
    {
        this.info(message)
    }
    clientLog(message?: any)
    {
        message=this._convertMsg(message)
        this._client_logger?.info(message)
    }
    protected _isObject(param):boolean
    {
        return typeof (param) === "object"
    }
    protected _isString(param):boolean
    {
        return typeof (param) === "string"
    }
    protected _isNumber(param):boolean
    {
        return typeof (param) === "number"
    }
}
export let gLog = new Log()