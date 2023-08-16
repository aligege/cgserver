
import * as nodeMailer from "nodemailer";
import { GServerCfg } from "../Config/IServerConfig";
import { GLog } from "../Logic/Log";
export let GEmailTool:EmailTool=null
class EmailTool
{
    send(to:string,subject:string,html:string)
    {
        return new Promise((resolve,reject)=>
        {        
            let transport = nodeMailer.createTransport({
                    host: GServerCfg.third_cfg.email.host,
                    port: GServerCfg.third_cfg.email.port,
                    secure: GServerCfg.third_cfg.email.secure,
                    auth: 
                    {
                        user: GServerCfg.third_cfg.email.auth.user,
                        pass: GServerCfg.third_cfg.email.auth.pass
                    }
            })
            let mail =
            {
                from: GServerCfg.third_cfg.email.from,
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