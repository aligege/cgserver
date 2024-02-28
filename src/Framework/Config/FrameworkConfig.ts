import { MongoConfig } from "../Database/MongoManager";
import { GLog } from "../Logic/Log";
import { RpcConfig } from "../ThirdParty/Rpc";
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
}
export class FrameworkConfig extends Config
{
    /*
    *-1不输出到console，0，仅错误信息输出到console，1，都输出到console
    */
    console_level=0
    log=
    {
        appenders:  
        {
            console:
            {
                "type":"console",
                "category":"console"
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
                pattern: "yyyy-MM-dd.log"  
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
                appenders: ['log_date'],
                level:'ALL'
            },
            console: 
            { 
                appenders: ['console'],
                level:'ALL'
            },
            log_file: 
            { 
                appenders: ['log_file'],
                level:'ALL'
            },
            log_date: 
            { 
                appenders: ['log_date'],
                level:'ALL'
            },
            client_log_file: 
            { 
                appenders: ['client_log_file'],
                level:'ALL'
            },
            client_log_date: 
            { 
                appenders: ['client_log_date'],
                level:'ALL'
            },
            error_log_file: 
            { 
                appenders: ['error_log_file'],
                level:'ALL'
            },
        }
    }
    /**
     * 控制网络消息的
     */
    debug_msg=false
    local_host="127.0.0.1"
    internet_host="127.0.0.1"
    db=new DbConfig()
    third_cfg=
    {
        open_social:
        {
            app_id:"appid_42313131",
            app_secret:"apps_FDS4342J34JL432",
            auth_url:"http://47.99.195.103:6666/auth/account/",
            user_url:"http://47.99.195.103:6666/auth/userinfo/",
            update_pwd_url:"http://47.99.195.103:6666/auth/updatepwd/"
        },
        aliSms:
        {
            signName:"而已网络",
            accessKeyId:"LTAIeqjiZ5OCev0B",
            secretAccessKey:"0w1fmDEORshI94QqtampBaAPQDqUAj",
            templateCode:"SMS_154589473"
        },
        qiniu:
        {
            host      : "p0bj0dycx.bkt.clouddn.com",
            bucket    : "eryiniuniu",
            accessKey : "OETxflxP9V5ZzPcjE30asCv-YxWBvDpmMPJegtI4",
            secretKey : "kZWsom120P0-cfQt_9_1-wR_X8RwuLeMXKbU_uc4"
        },
        email:
        {
            host: "smtp.live.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: 
            {
                user: "chengang01@live.com", // generated ethereal user
                pass: "cg123!@#" // generated ethereal password
            },
            from:"OpenSocial <chengang01@live.com>"
        },
        qq:
        {
            app_id:"101775753",
            app_key:"753d0f02f3c4093062e7b2f56c7fcb0c",
            redirect_uri:"http://www.eryinet.com/qq/callback"
        },
        wechat:
        {
            app_id:"wx80f0f10fe1304e9d",
            app_key:"a76fc337c49b309886a6538d31c344e2",
            redirect_uri:"http://www.eryinet.com/wechat/callback"
        },
        alipay:
        {
            open:false,
            dev:false,
            app_id: "",
            app_key:"",
            gateway:"",
            //RSA1 RSA2
            signType: <'RSA2'|'RSA'>'RSA2',
            /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
            keyType: <'PKCS1'|'PKCS8'>'PKCS1',
            alipay_root_cert_sn:"",
            alipay_cert_sn:"",
            app_cert_sn:"",
            notify_url:"",

            app_id_dev: "",
            app_key_dev:"",
            gateway_dev:"",
            //RSA1 RSA2
            signType_dev: <'RSA2'|'RSA'>'RSA2',
            /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
            keyType_dev: <'PKCS1'|'PKCS8'>'PKCS1',
            alipay_root_cert_sn_dev:"",
            alipay_cert_sn_dev:"",
            app_cert_sn_dev:"",
            notify_url_dev:""
        },
        apple:
        {
            keyIds:{}
        },
        cgmq:<RpcConfig>null
    }
    //key是ip，value是domain
    ip_to_domain={}
    root_path=process.cwd()
    constructor()
    {
        super("FrameworkConfig")
    }
    init()
    {
        let ret = super.init()
        GLog.init(this.log,this.console_level||0)
        return ret
    }
}