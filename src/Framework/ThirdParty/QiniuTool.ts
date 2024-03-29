import * as qiniu from "qiniu";
import { GServerCfg } from "../Config/IServerConfig";

export let GQiniuTool:QiniuTool = null
class QiniuTool
{
    get host()
    {
        return GServerCfg.third_cfg.qiniu.host
    }
    getUploadToken(filename)
    {
        let mac = new qiniu.auth.digest.Mac(GServerCfg.third_cfg.qiniu.accessKey, GServerCfg.third_cfg.qiniu.secretKey)
        let options = 
        {
            scope: GServerCfg.third_cfg.qiniu.bucket+":"+filename,
        }
        let putPolicy = new qiniu.rs.PutPolicy(options)
        let uploadToken = putPolicy.uploadToken(mac)
        return uploadToken
    }
}
GQiniuTool = new QiniuTool()