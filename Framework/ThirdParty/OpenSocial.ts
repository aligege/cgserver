import { GHttpTool } from "../Logic/HttpTool";
import { GFCfg } from "../Config/FrameworkConfig";

export let GOpenSocial:OpenSocial=null
class OpenSocial
{
    protected _getNewMsg():any
    {
        return {
            app_id:GFCfg.third_cfg.open_social.app_id,
            app_secret:GFCfg.third_cfg.open_social.app_secret
        }
    }
    async getUser(unionid:string,openid:string)
    {
        let msg=
        {
            unionid:unionid,
            openid:openid
        }
        let rs=await GHttpTool.httpPost(GFCfg.third_cfg.open_social.user_url,msg)
        return rs.body
    }
    async updatePwd(unionid:string,openid:string,new_pwd:string)
    {
        let msg=
        {
            unionid:unionid,
            openid:openid,
            password:new_pwd
        }
        let jsonData = await GHttpTool.httpPost(GFCfg.third_cfg.open_social.update_pwd_url,msg)
        return jsonData.body||jsonData.error
    }
}
GOpenSocial = new OpenSocial()