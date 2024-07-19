import AlipaySdk from 'alipay-sdk';
import * as aliUtil from 'alipay-sdk/lib/util';

import { AliPayUtil, RsaSignParam } from "alipay_sdk2/AliPayUtil";
import * as fs from "fs";
import AlipayFormData from 'alipay-sdk/lib/form';
import { Config } from '../Config/Config';
import { global } from '../global';

export class AlipayResult
{
    alipay_trade_app_pay_response={
        code:"10000",
        msg:"Success",
        app_id:"2021003143637369",
        auth_app_id:"2021003143637369",
        charset:"utf-8",
        timestamp:"2022-08-10 16:38:04",
        out_trade_no:"62f36e657a355ecc1cb8eec2",
        total_amount:"0.05",
        trade_no:"2022081022001489431433911625",
        seller_id:"2088441785429273"
    }
    sign="d/Guf6QYnuk9fFlRS1EUFTY+n3/jQKp7IwQENG4WXO+qxMGglPXa3RhUHaJELTMwC4tcKhz8Z8GCiiI1Y7G84kAql1jyoekaOMWvdPRDOjkAqouP3oh5v9r23BziJUxgv/kanBRfOoTKvIT7R0L5DyfxMpEoHdssPHAtENMiniCVZlRUkAhHxjmgMrP0rzMtBvqctC5Me6UiV1yBdGWecLk9RNwMTZF8QSXKVpWXmhmimdjjFjGMcE6r7LoV9YW1Bsvjoq2kdRMX7CJZufGk1Y5Qz8Cv+E9QxTnDJMtA0XyYzte53/dSw0W3Z4Gbosn/kV4QDBRzN39NwwuoFwGuVg=="
    sign_type="RSA2"
}
export class AlipayCallBack
{
    gmt_create="2022-08-10 16=38=03"
    charset="utf-8"
    seller_email="zdpuke@163.com"
    subject="一把砖石"
    sign="gytkeBGeea9V05lI6Qvvut8CZnXtXJmbb0dMDd76a6fgN2k2IO0HH4wkJylMQG3EXYJQctysURDtIB0dhqaZbDVtePsM3iQVeI2jwT3YS3XGS4xi13k8foag9vCcSgojKjxJS3ihfzuyK/Pc+KDTOQftoWP2s1dPUpJNGLcZp4sUFysl0Iyzf+2vXh4OJUPQ3DvCqePnDUawq1+AUUj63WHWvdsGCP70+eTsbKxJxWBhHfMVrwkOmUI0zivcHpHLVHbfTFvaM5LAa/ivSU8jiDHqgHYFZqqzTyZ1DLxEy0Ypo3sKBs5eK/UhdsNf5tjse7PxYJwMU2ziIo9gnqv6fQ=="
    buyer_id=2088202482689432
    invoice_amount="0.05"
    notify_id=2.022081000222164e+33
    fund_bill_list=[{amount:"0.05",fundChannel:"PCREDIT"}]
    notify_type="trade_status_sync"
    trade_status="TRADE_SUCCESS"
    receipt_amount="0.05"
    app_id=2021003143637369
    buyer_pay_amount="0.05"
    sign_type="RSA2"
    seller_id=2088441785429273
    gmt_payment="2022-08-10 16:38:03"
    notify_time="2022-08-10 16:38:04"
    version=1
    out_trade_no="62f36e657a355ecc1cb8eec2"
    total_amount="0.05"
    trade_no=2.0220810220014894e+27
    auth_app_id=2021003143637369
    buyer_logon_id="138****3531"
    point_amount=0
}

export class AlipayTool
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
        if(!global.gServerCfg.alipay
            ||!global.gServerCfg.alipay.open)
        {
            return false
        }
        let suffix=""
        if(global.gServerCfg.alipay.dev)
        {
            suffix="_dev"
        }
        this._cfg={
            app_id: global.gServerCfg.alipay["app_id"+suffix],
            app_key: global.gServerCfg.alipay["app_key"+suffix],
            gateway: global.gServerCfg.alipay["gateway"+suffix],
            //RSA1 RSA2
            signType: global.gServerCfg.alipay["signType"+suffix],
            /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
            keyType: global.gServerCfg.alipay["signType"+suffix],
            alipay_root_cert_sn: global.gServerCfg.alipay["alipay_root_cert_sn"+suffix],
            alipay_cert_sn: global.gServerCfg.alipay["alipay_cert_sn"+suffix],
            app_cert_sn: global.gServerCfg.alipay["app_cert_sn"+suffix],
            notify_url: global.gServerCfg.alipay["notify_url"+suffix]
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
                app_key=fs.readFileSync(Config.rootDataDir+this._cfg.app_key, 'ascii')
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
        global.gLog.info("alipay init success!")
    }
    /**
     *  charset:"utf-8",method:"alipay.trade.app.pay",sign_type:"RSA2,version:"1.0"
     * @param out_trade_no 
     * @param total_amount 
     * @param subject 
     * @param body 
     * @param timeout_express 
     * @param product_code 
     * @returns 
     */
    protected _buildOrderParams(out_trade_no:string,total_amount:number,subject="1",body="我是测试数据",timeout_express="30m",product_code="QUICK_MSECURITY_PAY")
    {
        let order_params = {
            notifyUrl:this._cfg.notify_url,
            bizContent:{
                timeout_express:timeout_express,
                product_code:product_code,
                total_amount:total_amount,
                subject:encodeURIComponent(subject),
                body:encodeURIComponent(body),
                out_trade_no:out_trade_no
            }
        }
        return order_params
    }
    protected _sign(order_params:any)
    {
        let sign=aliUtil.sign("alipay.trade.app.pay",order_params,this._alipaySdk.config)
        return sign
    }
    getOrderInfo(out_trade_no:string,total_amount:number,subject="1",body="我是测试数据")
    {
        let order_params = this._buildOrderParams(out_trade_no,total_amount,subject,body)
        let sign = this._sign(order_params)
        let {url,execParams}=this._alipaySdk["formatUrl"]("",sign)
        const order_info = (url + '&biz_content=' + encodeURIComponent(execParams.biz_content)).substring(1)
        return order_info
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
            global.gLog.error("并未配置alipay或者初始化失败")
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