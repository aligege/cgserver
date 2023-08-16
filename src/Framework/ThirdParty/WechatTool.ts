import * as _ from "underscore";
import * as URLEncode from "urlencode";
import { GServerCfg } from "../Config/IServerConfig";
import { GHttpTool } from "../Logic/HttpTool";
import { GLog } from "../Logic/Log";

export class WechatUserInfo
{
    openid="OPENID"
    nickname="NICKNAME"
    sex=1
    province="PROVINCE"
    city="CITY"
    country="COUNTRY"
    headimgurl= "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/0"
    privilege=[
        "PRIVILEGE1",
        "PRIVILEGE2"
    ]
    unionid="o6_bmasdasdsad6_2sgVt7hMZOPfL"
}

export let GWechatTool:WechatTool=null
export class WechatTool
{
    /**
     * 获取获取code的url
     */
    getAuthCodeUrl()
    {
        let appid="wx80f0f10fe1304e9d"
        let url = "https://open.weixin.qq.com/connect/qrconnect?appid="+ GServerCfg.third_cfg.wechat.app_id
        url+="&redirect_uri="+URLEncode.encode(GServerCfg.third_cfg.wechat.redirect_uri)
        url+="&response_type=code&scope=snsapi_login"
        //必须	client端的状态值。用于第三方应用防止CSRF攻击，成功授权后回调时会原样带回。请务必严格按照流程检查用户与state参数状态的绑定。
        let state=_.random(1000000,9999999)
        url+="&state="+state
        return url
    }
    async getAccessInfo(auth_code:string):Promise<any>
    {
        if(!auth_code)
        {
            return null
        }
        let url="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+GServerCfg.third_cfg.wechat.app_id+"&secret="+GServerCfg.third_cfg.wechat.app_key+"&code="+auth_code+"&grant_type=authorization_code"
        let rs = await GHttpTool.get(url)
        /*
        { 
            "access_token":"ACCESS_TOKEN", 
            "expires_in":7200, 
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID", 
            "scope":"SCOPE",
            "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
        }
        {"errcode":40029,"errmsg":"invalid code"}
        */
        if(rs.body&&rs.body.access_token)
        {
            return rs.body
        }
        else
        {
            GLog.error(rs.body)
        }
        return null
    }
    async getUserInfo(access_token:string,openid:string):Promise<WechatUserInfo>
    {
        let url = "https://api.weixin.qq.com/sns/userinfo?access_token="+access_token+"&openid="+openid
        let rs = await GHttpTool.get(url)
        if(rs.body)
        {
            return rs.body
        }
        return null
    }
}
GWechatTool=new WechatTool()