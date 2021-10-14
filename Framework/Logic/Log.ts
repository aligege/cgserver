import { core } from "../Core/Core";
import * as logUpdate from "log-update";
import * as log4js from "log4js";
import * as colors from "colors";
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

export let GLog:Log=null
class Log
{
    //default log
    protected _logger:log4js.Logger = null
    //the log from client
    protected _client_logger:log4js.Logger = null
    //error and warn
    protected _errorLogger:log4js.Logger = null
    constructor()
    {
        this._logger = log4js.getLogger("log_date")
        this._client_logger = log4js.getLogger("client_log_date")
        this._errorLogger = log4js.getLogger("error_log_file")
    }
    init(cfg)
    {
        colors.enable()
        log4js.configure(cfg)
    }
    error(message?: any, ...optionalParams: any[])
    {
        if(core.isObject(message))
        {
            message = JSON.stringify(message)
        }
        this._errorLogger.error(message)
        var time = new Date()
        var time_str=core.format(time,"[YYYY-MM-DD HH:mm:SS.")
        time_str+=time.getMilliseconds()+"]"
        console.error(time_str+" "+message)
    }
    info(message,to_console?)
    {
        if(core.isObject(message))
        {
            message = JSON.stringify(message)
        }
        this._logger.info(message)
        if(to_console)
        {
            var time = new Date()
            var time_str=core.format(time,"[YYYY-MM-DD HH:mm:SS.")
            time_str+=time.getMilliseconds()+"]"
            console.log(time_str+" "+message)
        }
    }
    warn(message?: any, ...optionalParams: any[])
    {
        if(core.isObject(message))
        {
            message = JSON.stringify(message)
        }
        this._errorLogger.warn(message)
    }
    record(message?: any, ...optionalParams: any[])
    {
        this.info(message,optionalParams)
    }
    clientLog(message?: any, ...optionalParams: any[])
    {
        this._client_logger.error(message)
    }
    get logUpdate()
    {
        return logUpdate
    }
}
GLog=new Log()