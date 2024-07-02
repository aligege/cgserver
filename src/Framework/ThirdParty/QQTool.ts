import * as _ from "underscore";
import * as URLEncode from "urlencode";
import { GServerCfg } from "../Config/IServerConfig";
import { GHttpTool } from "../Logic/HttpTool";
import { GLog } from "../Logic/Log";

export class QQUserInfo
{
    ret=0
    msg=""
    is_lost=0
    nickname=""
    gender=""//"男"
    province=""//"四川"
    city=""//"成都"
    year=""//"1988"
    constellation=""
    figureurl=""//http://qzapp.qlogo.cn/qzapp/101775753/B5EA2E2138715A07DE91B5BACBA0CCE5/30
    figureurl_1=""//http://qzapp.qlogo.cn/qzapp/101775753/B5EA2E2138715A07DE91B5BACBA0CCE5/50
    figureurl_2=""//http://qzapp.qlogo.cn/qzapp/101775753/B5EA2E2138715A07DE91B5BACBA0CCE5/100
    figureurl_qq_1=""//http://thirdqq.qlogo.cn/g?b=oidb&k=jgOibQ4eLHDBT57oAib1DrOg&s=40&t=1556419177
    figureurl_qq_2=""//http://thirdqq.qlogo.cn/g?b=oidb&k=jgOibQ4eLHDBT57oAib1DrOg&s=100&t=1556419177
    figureurl_qq=""//http://thirdqq.qlogo.cn/g?b=oidb&k=jgOibQ4eLHDBT57oAib1DrOg&s=140&t=1556419177
    figureurl_type=""//"1"
    is_yellow_vip:""//"0"
    vip=""//"0"
    yellow_vip_level=""//"0"
    level=""//"0"
    is_yellow_year_vip=""//"0"
}

export let GQQTool:QQTool=null
export class QQTool
{
    /**
     * 获取Authorization Code
     * @param scope 可选	请求用户授权时向用户显示的可进行授权的列表。
                    可填写的值是API文档中列出的接口，以及一些动作型的授权（目前仅有：do_like），如果要填写多个接口名称，请用逗号隔开。
                    例如：scope=get_user_info,list_album,upload_pic,do_like
                    不传则默认请求对接口get_user_info进行授权。
                    建议控制授权项的数量，只传入必要的接口名称，因为授权项越多，用户越可能拒绝进行任何授权。
     * @param display 仅PC网站接入时使用。
                    用于展示的样式。不传则默认展示为PC下的样式。
                    如果传入“mobile”，则展示为mobile端下的样式。
     */
    getAuthCodeUrl(scope?:string,display?:string)
    {
        if(!GServerCfg.qq)
        {
            GLog.error("qq config not found!")
            return null
        }
        //必须	成功授权后的回调地址，必须是注册appid时填写的主域名下的地址，建议设置为网站首页或网站的用户中心
        let redirect_uri = URLEncode.encode(GServerCfg.qq.redirect_uri)
        //必须	申请QQ登录成功后，分配给应用的appid。
        let client_id = GServerCfg.qq.app_id
        //必须	授权类型，此值固定为“code”。
        let response_type="code"
        //必须	client端的状态值。用于第三方应用防止CSRF攻击，成功授权后回调时会原样带回。请务必严格按照流程检查用户与state参数状态的绑定。
        let state=_.random(1000000,9999999)
        //PC网站
        let url="https://graph.qq.com/oauth2.0/authorize?redirect_uri="+redirect_uri+"&response_type="+response_type+"&state="+state+"&client_id="+client_id
        if(scope)
        {
            url+="&scope="+scope
        }
        if(display)
        {
            url+="&display="+display
        }
        return url
    }
    async getAccessToken(auth_code:string):Promise<string>
    {
        if(!auth_code)
        {
            return null
        }
        if(!GServerCfg.qq)
        {
            GLog.error("qq config not found!")
            return null
        }
        //必须	授权类型，在本步骤中，此值为“authorization_code”。
        let grant_type = "authorization_code"
        //必须	申请QQ登录成功后，分配给应用的appid。
        let client_id = GServerCfg.qq.app_id
        //必须	申请QQ登录成功后，分配给网站的appkey。
        let client_secret = GServerCfg.qq.app_key
        //必须	成功授权后的回调地址，必须是注册appid时填写的主域名下的地址，建议设置为网站首页或网站的用户中心
        let redirect_uri = URLEncode.encode(GServerCfg.qq.redirect_uri)

        let url="https://graph.qq.com/oauth2.0/token?code="+auth_code+"&grant_type="+grant_type+"&client_id="+client_id+"&client_secret="+client_secret+"&redirect_uri="+redirect_uri
        let rs = await GHttpTool.get(url)
        if(rs.body&&rs.body.access_token)
        {
            return rs.body.access_token
        }
        else
        {
            GLog.error(rs.body)
        }
        return null
    }
    async getOpenId(access_token:string):Promise<string>
    {
        let url="https://graph.qq.com/oauth2.0/me?access_token="+access_token
        let rs = await GHttpTool.get(url)
        let body = rs.response?rs.response.body:null
        if(body)
        {
            body=body.replace("callback( ","")
            body=body.replace(" );\n","")
            try{body=JSON.parse(body)}catch(e){}
            if(!body.openid)
            {
                GLog.error(rs.response.body)
            }
            return body.openid
        }
        return null
    }
    async getUserInfo(access_token:string,openid:string):Promise<QQUserInfo>
    {
        if(!access_token||!openid)
        {
            return null
        }
        if(!GServerCfg.qq)
        {
            GLog.error("qq config not found!")
            return null
        }
        let url = "https://graph.qq.com/user/get_user_info?access_token="+access_token+"&oauth_consumer_key="+GServerCfg.qq.app_id+"&openid="+openid
        let rs = await GHttpTool.get(url)
        if(rs.body)
        {
            return rs.body
        }
        return null
    }
}
GQQTool=new QQTool()