
import * as nodeMailer from "nodemailer";
import { global } from "../global";

export class EmailTool
{
    send(to:string,subject:string,html:string)
    {
        return new Promise((resolve,reject)=>
        {   
            if(!global.gServerCfg.email)
            {
                global.gLog.error("email config not found!")
                resolve("email config not found!")
                return
            }
            let transport = nodeMailer.createTransport({
                    host: global.gServerCfg.email.host,
                    port: global.gServerCfg.email.port,
                    secure: global.gServerCfg.email.secure,
                    auth: 
                    {
                        user: global.gServerCfg.email.auth.user,
                        pass: global.gServerCfg.email.auth.pass
                    }
            })
            let mail =
            {
                from: global.gServerCfg.email.from,
                to: to,
                subject: subject,
                html: html
            }
            transport.sendMail(mail,(_err,msg)=>
            {
                global.gLog.error(_err)
                resolve(_err)
            })
        })
    }
}