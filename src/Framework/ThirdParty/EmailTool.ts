
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
            if(!GServerCfg.email)
            {
                GLog.error("email config not found!")
                resolve("email config not found!")
                return
            }
            let transport = nodeMailer.createTransport({
                    host: GServerCfg.email.host,
                    port: GServerCfg.email.port,
                    secure: GServerCfg.email.secure,
                    auth: 
                    {
                        user: GServerCfg.email.auth.user,
                        pass: GServerCfg.email.auth.pass
                    }
            })
            let mail =
            {
                from: GServerCfg.email.from,
                to: to,
                subject: subject,
                html: html
            }
            transport.sendMail(mail,(_err,msg)=>
            {
                GLog.error(_err)
                resolve(_err)
            })
        })
    }
}
GEmailTool = new EmailTool()