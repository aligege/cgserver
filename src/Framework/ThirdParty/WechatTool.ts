import * as _ from "underscore";
import * as URLEncode from "urlencode";
import { gServerCfg } from "../Config/IServerConfig";
import { gLog } from "../Logic/Log";
import { gHttpTool } from "../Logic/HttpTool";

export class WechatOAMsg
{
    toUserName=""
    fromUserName=""//其实是一个userid
    createTime=-1
    msgType=""//text文本
    content=""
    msgId=-1//只有收到消息才会有
}

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

export class WechatTool
{
    /**
     * 获取获取code的url
     */
    getAuthCodeUrl()
    {
        if(!gServerCfg.wechat)
        {
            gLog.error("wechat config not found!")
            return null
        }
        let url = "https://open.weixin.qq.com/connect/qrconnect?appid="+ gServerCfg.wechat.app_id
        url+="&redirect_uri="+URLEncode.encode(gServerCfg.wechat.redirect_uri)
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
        if(!gServerCfg.wechat)
        {
            gLog.error("wechat config not found!")
            return null
        }
        let url="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+gServerCfg.wechat.app_id+"&secret="+gServerCfg.wechat.app_key+"&code="+auth_code+"&grant_type=authorization_code"
        let rs = await gHttpTool.get({url})
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
            gLog.error(rs.body)
        }
        return null
    }
    async getUserInfo(access_token:string,openid:string):Promise<WechatUserInfo>
    {
        let url = "https://api.weixin.qq.com/sns/userinfo?access_token="+access_token+"&openid="+openid
        let rs = await gHttpTool.get({url})
        if(rs.body)
        {
            return rs.body
        }
        return null
    }
    //公众号
    convertOAMsg(xmlStr:string)
    {
        if(!xmlStr)
        {
            return null
        }
        let msg = new WechatOAMsg()
        let pre = "<ToUserName><![CDATA["
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.toUserName=xmlStr.substr(0,xmlStr.indexOf("]"))
        pre = "<FromUserName><![CDATA["
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.fromUserName=xmlStr.substr(0,xmlStr.indexOf("]"))
        pre = "<CreateTime>"
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.createTime=parseInt(xmlStr.substr(0,xmlStr.indexOf("<")))
        pre = "<MsgType><![CDATA["
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.msgType=xmlStr.substr(0,xmlStr.indexOf("]"))
        pre = "<Content><![CDATA["
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.content=xmlStr.substr(0,xmlStr.indexOf("]"))
        pre = "<MsgId>"
        xmlStr=xmlStr.substr(xmlStr.indexOf(pre)+pre.length)
        msg.msgId=parseInt(xmlStr.substr(0,xmlStr.indexOf("<")))
        return msg
    }
    //公众号
    toReplyXmlStr(msg:WechatOAMsg)
    {
        let xmlStr="<xml>"
        xmlStr+="<ToUserName><![CDATA["+msg.toUserName+"]]></ToUserName>"
        xmlStr+="<FromUserName><![CDATA["+msg.fromUserName+"]]></FromUserName>"
        xmlStr+="<CreateTime>"+msg.createTime+"</CreateTime>"
        xmlStr+="<MsgType><![CDATA["+msg.msgType+"]]></MsgType>"
        xmlStr+="<Content><![CDATA["+msg.content+"]]></Content>"
        xmlStr+="</xml>"
        return xmlStr
    }
}

export let gWechatTool=new WechatTool()