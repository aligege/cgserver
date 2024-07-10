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
export let GLog:Log=null
class Log
{
    //default log
    protected _logger:log4js.Logger = null
    //the log from client
    protected _client_logger:log4js.Logger = null
    //error and warn
    protected _errorLogger:log4js.Logger = null
    protected _inited=false
    /**
     * 该level只是用来控制控制台的显示的
     * -1不输出到console，0，仅错误信息输出到console，1，都输出到console
     */
    
    protected _console_level=0
    init(cfg:log4js.Configuration,console_level=0)
    {
        if(this._inited)
        {
            return
        }
        this._inited=true
        colors.enable()
        log4js.configure(cfg)

        this._logger = log4js.getLogger(cfg.categories.default.appenders[0]||"log_date")
        this._client_logger = log4js.getLogger(cfg.categories.client_log_file.appenders[0]||"client_log_file")
        this._errorLogger = log4js.getLogger(cfg.categories.error_log_file.appenders[0]||"error_log_file")

        this._console_level=console_level
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
        this._errorLogger?.error(message)
        if(this._console_level>=0)
        {
            let time_str = this._getTimeStr()
            console.error(time_str+" "+message)
        }
    }
    info(message:any)
    {
        message=this._convertMsg(message)
        this._logger?.info(message)
        if(this._console_level>=0)
        {
            let time_str = this._getTimeStr()
            console.log(time_str+" "+message)
        }
    }
    warn(message?: any)
    {
        message=this._convertMsg(message)
        this._errorLogger?.warn(message)
        if(this._console_level>=0)
        {
            let time_str = this._getTimeStr()
            console.error(time_str+" "+message)
        }
    }
    record(message?: any)
    {
        this.info(message)
    }
    clientLog(message?: any)
    {
        message=this._convertMsg(message)
        this._client_logger?.error(message)
    }
    protected _getTimeStr()
    {
        let time = new Date()
        let time_str=this._format(time,"[YYYY-MM-DD HH:mm:SS.")
        time_str+=time.getMilliseconds()+"]"
        return time_str
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
    protected _format(src,formatStr)   
    {   
        if(this._isString(src))
        {
            let args = Array.prototype.slice.call(arguments, 1)
            return src.replace(/\{(\d+)\}/g, function(m, i)
            {
                return args[i]
            })
        }
        else
        {
            if(this._isNumber(src))
            {
                src = new Date(src)
            }
            let str = formatStr
            let Week = ['日','一','二','三','四','五','六']
        
            let month = src.getMonth()+1
            let year = src.getFullYear()
            let date = src.getDate()
            let hour = src.getHours()
            let min = src.getMinutes()
            let sec = src.getSeconds()
            let day = src.getDay()
            str=str.replace(/yyyy|YYYY/,year)
            str=str.replace(/yy|YY/,(year % 100)>9?(year % 100).toString():'0' + (year % 100))
        
            str=str.replace(/MM/,month>9?month.toString():'0' + month)
            str=str.replace(/M/g,month)
        
            str=str.replace(/w|W/g,Week[day])
        
            str=str.replace(/dd|DD/,date>9?date.toString():'0' + date)
            str=str.replace(/d|D/g,date)
        
            str=str.replace(/hh|HH/,hour>9?hour.toString():'0' + hour)
            str=str.replace(/h|H/g,hour)
            str=str.replace(/mm/,min>9?min.toString():'0' + min)
            str=str.replace(/m/g,min)
        
            str=str.replace(/ss|SS/,sec>9?sec.toString():'0' + sec)
            str=str.replace(/s|S/g,sec)
            return str
        }
    }
}
GLog=new Log()