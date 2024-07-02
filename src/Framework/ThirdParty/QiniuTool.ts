import * as qiniu from "qiniu";
import { GServerCfg } from "../Config/IServerConfig";
import { GLog } from "../Logic/Log";

export let GQiniuTool:QiniuTool = null
class QiniuTool
{
    get host()
    {
        if(!GServerCfg.qiniu)
        {
            return ""
        }
        return GServerCfg.qiniu.host
    }
    getUploadToken(filename)
    {
        if(!GServerCfg.qiniu)
        {
            GLog.error("qiniu config not found!")
            return ""
        }
        let mac = new qiniu.auth.digest.Mac(GServerCfg.qiniu.accessKey, GServerCfg.qiniu.secretKey)
        let options = 
        {
            scope: GServerCfg.qiniu.bucket+":"+filename,
        }
        let putPolicy = new qiniu.rs.PutPolicy(options)
        let uploadToken = putPolicy.uploadToken(mac)
        return uploadToken
    }
}
GQiniuTool = new QiniuTool()