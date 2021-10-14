import AlipaySdk from 'alipay-sdk';
import { AliPayUtil, RsaSignParam } from "alipay_sdk2/AliPayUtil";
import * as fs from "fs";
import { GFCfg } from '../Config/FrameworkConfig';
import AlipayFormData from 'alipay-sdk/lib/form';
import { GLog } from '../Logic/Log';

export let GAlipayTool:AlipayTool=null
class AlipayTool
{
    protected _alipaySdk:AlipaySdk=null
    protected _aliPay:AliPayUtil=null

    protected _cfg={
        app_id: "",
        app_key:"",
        gateway:"",
        //RSA1 RSA2
        signType: <'RSA2'|'RSA'>'RSA2',
        /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
        keyType: <'PKCS1'|'PKCS8'>'PKCS1',
        alipay_root_cert_sn:"",
        alipay_cert_sn:"",
        app_cert_sn:"",
        notify_url:""
    }
    init()
    {
        if(!GFCfg.third_cfg.alipay
            ||!GFCfg.third_cfg.alipay.open)
        {
            return false
        }
        let suffix=""
        if(GFCfg.third_cfg.alipay.dev)
        {
            suffix="_dev"
        }
        this._cfg={
            app_id: GFCfg.third_cfg.alipay["app_id"+suffix],
            app_key: GFCfg.third_cfg.alipay["app_key"+suffix],
            gateway: GFCfg.third_cfg.alipay["gateway"+suffix],
            //RSA1 RSA2
            signType: GFCfg.third_cfg.alipay["signType"+suffix],
            /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
            keyType: GFCfg.third_cfg.alipay["signType"+suffix],
            alipay_root_cert_sn: GFCfg.third_cfg.alipay["alipay_root_cert_sn"+suffix],
            alipay_cert_sn: GFCfg.third_cfg.alipay["alipay_cert_sn"+suffix],
            app_cert_sn: GFCfg.third_cfg.alipay["app_cert_sn"+suffix],
            notify_url: GFCfg.third_cfg.alipay["notify_url"+suffix]
        }
        if(this._cfg.alipay_cert_sn)
        {
            this._aliPay = new AliPayUtil( this._cfg.alipay_cert_sn, this._cfg.app_key )
        }
        else
        {
            let app_key=""
            if(this._cfg.app_key.indexOf(".pem")>0)
            {
                app_key=fs.readFileSync(this._cfg.app_key, 'ascii')
            }
            else
            {
                app_key=this._cfg.app_key
            }
            this._alipaySdk = new AlipaySdk({
                appId: this._cfg.app_id,
                privateKey: app_key,
                gateway:this._cfg.gateway,
                signType:this._cfg.signType,
                keyType:this._cfg.keyType
            })
        }
    }
    /**
     * 
     * @param title 
     * @param order_id 
     * @param money 
     */
    doPay(title:string, order_id:string, money:number)
    {
        const param:RsaSignParam = {
            app_id:this._cfg.app_id,
            notify_url:this._cfg.notify_url,
            app_cert_sn:this._cfg.app_cert_sn,
            alipay_root_cert_sn:this._cfg.alipay_root_cert_sn,
            subject:title,
            trade_no: order_id,
            total_amount: money,
        };

        var str=this._aliPay.getPayCode( param )
        return str
    }
    rsaCheck(payInfo:any)
    {
        return this._aliPay.rsaCheck(payInfo)
    }
    /**
     * 
     * @param method get|post
     * @param notifyUrl 通知回调
     * @param returnUrl
     * @param outTradeNo 
     * @param money 价格
     * @param subject 标题
     * @param body 内容介绍
     */
    async getAlipayPage(method:"get" | "post",notifyUrl:string,returnUrl:string,outTradeNo:string,money:number,subject:string,body:string)
    {
        if(!this._alipaySdk)
        {
            GLog.error("并未配置alipay或者初始化失败")
            return
        }
        const formData = new AlipayFormData();
        // 调用 setMethod 并传入 get，会返回可以跳转到支付页面的 url
        formData.setMethod(method)
        formData.addField("return_url",returnUrl)
        formData.addField('notifyUrl', notifyUrl)
        formData.addField('bizContent', {
            outTradeNo: outTradeNo,
            productCode: "FAST_INSTANT_TRADE_PAY",
            totalAmount: money,
            subject: subject,
            body: body,
        });

        let url_or_html = await this._alipaySdk.exec(
            'alipay.trade.page.pay',
            {},
            { formData: formData }
        )
        return url_or_html
    }
}
GAlipayTool=new AlipayTool()