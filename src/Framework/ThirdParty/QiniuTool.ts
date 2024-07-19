import * as qiniu from "qiniu";
import { gServerCfg } from "../Config/IServerConfig";
import { gLog } from "../Logic/Log";

export class QiniuTool
{
    get host()
    {
        if(!gServerCfg.qiniu)
        {
            return ""
        }
        return gServerCfg.qiniu.host
    }
    getUploadToken(filename)
    {
        if(!gServerCfg.qiniu)
        {
            gLog.error("qiniu config not found!")
            return ""
        }
        let mac = new qiniu.auth.digest.Mac(gServerCfg.qiniu.accessKey, gServerCfg.qiniu.secretKey)
        let options = 
        {
            scope: gServerCfg.qiniu.bucket+":"+filename,
        }
        let putPolicy = new qiniu.rs.PutPolicy(options)
        let uploadToken = putPolicy.uploadToken(mac)
        return uploadToken
    }
}