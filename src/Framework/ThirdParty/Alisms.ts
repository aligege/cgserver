import { gServerCfg } from "../Config/IServerConfig"
import { gLog } from "../Logic/Log"

let SMSClient =require("@alicloud/sms-sdk")

export class SMSTool
{
    protected _is_init=false
    protected _sms_client=null
    init()
    {
        if(!gServerCfg.aliSms)
        {
            return false
        }
        if(this._is_init)
        {
            return true
        }
        this._is_init = true
        this._sms_client = new SMSClient({accessKeyId:gServerCfg.aliSms.accessKeyId,secretAccessKey:gServerCfg.aliSms.secretAccessKey})
        gLog.info("SMSClient init success!")
    }
    /**
     * 发送短信验证码
     * @param code 验证码
     * @param phone 手机号
     * @param callback 回调
     */
    sendSMS(code:number,phone:string):Promise<String>
    {
        return new Promise((resolve,reject)=>
        {
            this._sms_client.sendSMS({
                PhoneNumbers:phone,
                SignName:gServerCfg.aliSms.signName,
                TemplateCode:gServerCfg.aliSms.templateCode,
                TemplateParam:JSON.stringify({code:code})
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