import { GServerCfg } from '../Config/IServerConfig';
import { GLog } from './../Logic/Log';
let SMSClient =require("@alicloud/sms-sdk")

export let GSmsTool:SMSTool=null
class SMSTool
{
    protected _is_init=false
    protected _sms_client=null
    init()
    {
        if(!GServerCfg.aliSms)
        {
            return false
        }
        if(this._is_init)
        {
            return true
        }
        this._is_init = true
        this._sms_client = new SMSClient({accessKeyId:GServerCfg.aliSms.accessKeyId,secretAccessKey:GServerCfg.aliSms.secretAccessKey})
        GLog.info("SMSClient init success!")
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
                SignName:GServerCfg.aliSms.signName,
                TemplateCode:GServerCfg.aliSms.templateCode,
                TemplateParam:JSON.stringify({code:code})
            }).then((res)=>
            {
                if(res.Code=="OK")
                {
                    resolve(null)
                }
                else
                {
                    GLog.error("phone:"+phone+" code:"+res.Code)
                    resolve(res.Code)
                }
            },(err)=>
            {
                GLog.error(err)
                resolve(err)
            })
        })
    }
}
GSmsTool=new SMSTool()