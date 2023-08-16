import { GServerCfg } from "../Config/IServerConfig";
import { GHttpTool } from "../Logic/HttpTool";

export let GOpenSocial:OpenSocial=null
class OpenSocial
{
    protected _getNewMsg():any
    {
        return {
            app_id:GServerCfg.third_cfg.open_social.app_id,
            app_secret:GServerCfg.third_cfg.open_social.app_secret
        }
    }
    async getUser(unionid:string,openid:string)
    {
        let msg=
        {
            unionid:unionid,
            openid:openid
        }
        let rs=await GHttpTool.post({url:GServerCfg.third_cfg.open_social.user_url,json:msg})
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
        let jsonData = await GHttpTool.post({url:GServerCfg.third_cfg.open_social.update_pwd_url,json:msg})
        return jsonData.body||jsonData.error
    }
}
GOpenSocial = new OpenSocial()