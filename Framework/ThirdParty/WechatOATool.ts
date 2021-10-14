//OA=offical account公众号
export class WechatOAMsg
{
    // <xml>
    // <ToUserName><![CDATA[toUser]]></ToUserName>
    // <FromUserName><![CDATA[fromUser]]></FromUserName>
    // <CreateTime>1348831860</CreateTime>
    // <MsgType><![CDATA[text]]></MsgType>
    // <Content><![CDATA[this is a test]]></Content>
    // <MsgId>1234567890123456</MsgId>
    // </xml>
    toUserName=""
    fromUserName=""//其实是一个userid
    createTime=-1
    msgType=""//text文本
    content=""
    msgId=-1//只有收到消息才会有
}
export let GWechatOATool:WechatOATool=null
export class WechatOATool
{
    convertMsg(xmlStr:string)
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
GWechatOATool=new WechatOATool()