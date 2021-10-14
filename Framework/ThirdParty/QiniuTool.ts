import * as qiniu from "qiniu";
import { GFCfg } from "../Config/FrameworkConfig";

export let GQiniuTool:QiniuTool = null
class QiniuTool
{
    get host()
    {
        return GFCfg.third_cfg.qiniu.host
    }
    getUploadToken(filename)
    {
        let mac = new qiniu.auth.digest.Mac(GFCfg.third_cfg.qiniu.accessKey, GFCfg.third_cfg.qiniu.secretKey)
        let options = 
        {
            scope: GFCfg.third_cfg.qiniu.bucket+":"+filename,
        }
        let putPolicy = new qiniu.rs.PutPolicy(options)
        let uploadToken = putPolicy.uploadToken(mac)
        return uploadToken
    }
}
GQiniuTool = new QiniuTool()