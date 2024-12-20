import { gLog } from "../Logic/Log";
import { Config } from "./Config";
import { DbConfig } from "./DbConfig";
export enum ESessionType
{
    Cache,
    Redis,
    Mongo
}
export class WebServerConfig
{
    cache={}
    session_type=ESessionType.Cache
    debug=false
    web_name="web"
    port=0
    cookie=
    {
        prefix:"tiny_cookie_",
        expires:
        {
            account_remember: 7 * 24 * 60 * 60,
            account: 10 * 60
        }
    }
    routs=
    {
        /**
         * 如果设置了这一项，那网址里面就不用带模块名称，是不回解析的
         */
        onlyModule:"Web",
        defaults: { module:"Web",controller : "Index", action : "Index"}
    }
    ssl:
    {
        key:string,
        crt:string
    }=null
    //默认不跨域
    cors:
    {
        origin:string|string[],  //指定接收的地址，将localhost改成前端IP地址
        methods:string|string[],  //指定接收的请求类型
        allowedHeaders:string|string[],
        credentials:boolean
    }=null
    static:{route:string,path:string}[]=null
    rootview=""
}
class AliSmsConfig
{
    signName=""
    accessKeyId=""
    secretAccessKey=""
    templateCode=""
}
class QiNiuConfig
{
    host      =""
    bucket    =""
    accessKey =""
    secretKey =""
}
class EmailConfig
{
    host=""
    port=587
    secure=false
    auth: 
    {
        user:string,
        pass:string
    }=null
    from=""
}
class QQConfig
{
    app_id=""
    app_key=""
    redirect_uri=""
}
class WechatConfig
{
    app_id=""
    app_key=""
    redirect_uri=""
}
class AlipayConfig
{
    open=false
    dev=false
    app_id=""
    app_key=""
    gateway=""
    //RSA1 RSA2
    signType=""
    /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
    keyType=""
    alipay_root_cert_sn=""
    alipay_cert_sn=""
    app_cert_sn=""
    notify_url=""

    app_id_dev=""
    app_key_dev=""
    gateway_dev=""
    //RSA1 RSA2
    signType_dev=""
    /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
    keyType_dev=""
    alipay_root_cert_sn_dev=""
    alipay_cert_sn_dev=""
    app_cert_sn_dev=""
    notify_url_dev:""
}
export class FrameworkConfig extends Config
{
    log=
    {
        appenders:  
        {
            console:
            {
                type:"console",
                category:"console"
            },
            log_file:
            {  
                category:"log_file",  
                type: "file",  
                filename: "./logs/log_file/file.log",  
                maxLogSize: 10*1024*1024,
                backups: 100,
            },  
            log_date:
            {  
                category:"log_date",  
                type: "dateFile",  
                filename: "./logs/log_date/date",  
                alwaysIncludePattern: true,  
                pattern: "yyyy-MM-dd-hh.log",
                numBackups: 100,
            },
            client_log_file:
            {  
                category:"log_file",  
                type: "file",  
                filename: "./logs/client_log_file/file.log",  
                maxLogSize: 10*1024*1024,
                backups: 100,
            },  
            client_log_date:
            {  
                category:"log_date",  
                type: "dateFile",  
                filename: "./logs/client_log_date/date",  
                alwaysIncludePattern: true,  
                pattern: "yyyy-MM-dd.log",
                numBackups: 100,
            },
            error_log_file:
            {  
                category:"error_log_file",  
                type: "file",  
                filename: "./logs/error_log_file/file.log",  
                maxLogSize: 5*1024*1024,
                backups: 100,
            }
        },
        categories: 
        { 
            default: 
            { 
                appenders: ['log_file','console'],
                level:'ALL'
            },
            client_logger: 
            { 
                appenders: ['client_log_file','console'],
                level:'ALL'
            },
            error_logger: 
            { 
                appenders: ['error_log_file','console'],
                level:'ALL'
            }
        }
    }
    db=new DbConfig()
    aliSms:AliSmsConfig=null
    qiniu:QiNiuConfig=null
    email:EmailConfig=null
    qq:QQConfig=null
    wechat:WechatConfig=null
    alipay:AlipayConfig=null
    apple:
    {
        keyIds:{}
    }
    root_path=process.cwd()
    constructor()
    {
        super("FrameworkConfig")
    }
    init()
    {
        let ret = super.init()
        gLog.init(this.log)
        return ret
    }
}