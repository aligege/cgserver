
import * as nodeMailer from "nodemailer";
import { gServerCfg } from "../Config/IServerConfig";
import { gLog } from "../Logic/Log";

export class EmailTool
{
    send(to:string,subject:string,html:string)
    {
        return new Promise((resolve,reject)=>
        {   
            if(!gServerCfg.email)
            {
                gLog.error("email config not found!")
                resolve("email config not found!")
                return
            }
            let transport = nodeMailer.createTransport({
                    host: gServerCfg.email.host,
                    port: gServerCfg.email.port,
                    secure: gServerCfg.email.secure,
                    auth: 
                    {
                        user: gServerCfg.email.auth.user,
                        pass: gServerCfg.email.auth.pass
                    }
            })
            let mail =
            {
                from: gServerCfg.email.from,
                to: to,
                subject: subject,
                html: html
            }
            transport.sendMail(mail,(_err,msg)=>
            {
                gLog.error(_err)
                resolve(_err)
            })
        })
    }
}