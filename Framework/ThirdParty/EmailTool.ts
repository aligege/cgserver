
import * as nodeMailer from "nodemailer";
import { GLog } from "../Logic/Log";
import { GFCfg } from "../Config/FrameworkConfig";
export let GEmailTool:EmailTool=null
class EmailTool
{
    send(to:string,subject:string,html:string)
    {
        return new Promise((resolve,reject)=>
        {        
            let transport = nodeMailer.createTransport({
                    host: GFCfg.third_cfg.email.host,
                    port: GFCfg.third_cfg.email.port,
                    secure: GFCfg.third_cfg.email.secure,
                    auth: 
                    {
                        user: GFCfg.third_cfg.email.auth.user,
                        pass: GFCfg.third_cfg.email.auth.pass
                    }
            })
            let mail =
            {
                from: GFCfg.third_cfg.email.from,
                to: to,
                subject: subject,
                html: html
            }
            transport.sendMail(mail,(_err,msg)=>
            {
                GLog.error(JSON.stringify(_err))
                resolve(_err)
            })
        })
    }
}
GEmailTool = new EmailTool()