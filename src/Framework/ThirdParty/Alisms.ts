import { gServerCfg } from "../Config/IServerConfig"
import { gLog } from "../Logic/Log"

let SMSClient =require("@alicloud/sms-sdk")

export class AliSmsConfig
{
    open=false
    signName=""
    accessKeyId=""
    secretAccessKey=""
    templateCode=""
}

export class SMSTool
{
    protected _is_init=false
    protected _sms_client=null
    protected _cfg:AliSmsConfig=null
    init(cfg:AliSmsConfig)
    {
        if(!cfg
            ||!cfg.open)
        {
            return false
        }
        this._cfg = cfg
        if(this._is_init)
        {
            return true
        }
        this._is_init = true
        this._sms_client = new SMSClient({accessKeyId:cfg.accessKeyId,secretAccessKey:cfg.secretAccessKey})
        gLog.info("SMSClient init success!")
    }
    /**
     * 发送短信验证码
     * @param code 验证码
     * @param phone 手机号
     * @param callback 回调
     */
    sendSMS(code:string|{[key:string]:string},phone:string):Promise<String>
    {
        let param = typeof code == "string" ? {code:code} : code
        return new Promise((resolve,reject)=>
        {
            this._sms_client.sendSMS({
                PhoneNumbers:phone,
                SignName:this._cfg.signName,
                TemplateCode:this._cfg.templateCode,
                TemplateParam:JSON.stringify(param)
            }).then((res)=>
            {
                if(res.Code=="OK")
                {
                    resolve(null)
                }
                else
                {
                    gLog.error("phone:"+phone+" code:"+res.Code)
                    resolve(res.Code)
                }
            },(err)=>
            {
                gLog.error(err)
                resolve(err)
            })
        })
    }
}

export let gSMSTool=new SMSTool()