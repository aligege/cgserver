import * as qiniu from "qiniu";
import { global } from "../global";

export class QiniuTool
{
    get host()
    {
        if(!global.gServerCfg.qiniu)
        {
            return ""
        }
        return global.gServerCfg.qiniu.host
    }
    getUploadToken(filename)
    {
        if(!global.gServerCfg.qiniu)
        {
            global.gLog.error("qiniu config not found!")
            return ""
        }
        let mac = new qiniu.auth.digest.Mac(global.gServerCfg.qiniu.accessKey, global.gServerCfg.qiniu.secretKey)
        let options = 
        {
            scope: global.gServerCfg.qiniu.bucket+":"+filename,
        }
        let putPolicy = new qiniu.rs.PutPolicy(options)
        let uploadToken = putPolicy.uploadToken(mac)
        return uploadToken
    }
}