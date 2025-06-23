import { AlipaySdk, AlipaySdkCommonResult, AlipaySdkConfig } from 'alipay-sdk';
import { gLog } from '../Logic/Log';

export interface AlipayExtendParams {
    sys_service_provider_id?: string; // 系统服务商ID
    hb_fq_num?: string; // 花呗分期数
    hb_fq_seller_percent?: string; // 花呗分期卖家的承担收费比例
    industry_reflux_info?: string; // 行业数据回流信息
    card_type?: string; // 卡类型
    royalty_freeze?: string; // 分账冻结金额
}
export interface AlipayGoodsDetail {
    goods_id: string; // 商品ID
    goods_name: string; // 商品名称
    quantity: number; // 商品数量
    price: number; // 商品单价
    alipay_goods_id?: string; // 支付宝商品ID
    goods_category?: string; // 商品类目
    category_tree?: string; // 商品类目树
    show_url?: string; // 商品的展示地址
    time_expire?: string; // 商品超时时间
    extend_params?: AlipayExtendParams; // 扩展参数
}
export interface AlipayExtUserInfo {
    cert_no?: string; // 证件号码
    min_age?: string; // 最小年龄
    name?: string; // 用户姓名
    mobile?: string; // 手机号码
    cert_type?: string; // 证件类型
    need_check_info?: string; // 是否需要校验信息
    identity_hash?: string; // 用户信息校验值
}
export interface AlipayAppPayParams {
    out_trade_no: string;      // 商户订单号
    total_amount: string;      // 订单总金额
    subject: string;          // 订单标题
    notify_url?: string;      // 异步通知地址
    product_code?: string;     // 产品码
    good_detail?: AlipayGoodsDetail[];      // 商品明细
    time_expire?: string; // 订单超时时间
    extend_params?: AlipayExtendParams; // 扩展参数
    passback_params?: string; // 回跳参数
    merchant_order_no?: string; // 商户订单号
    ext_user_info?: AlipayExtUserInfo; // 用户信息
    query_options?: string[]; // 查询选项
}
export interface FundBillListItem{
    amount:string //金额
    fundChannel:string //资金渠道
}
export interface AlipayCallbackInfo{
    gmt_create:string
    charset:string
    seller_email:string
    subject:string
    sign:string
    buyer_id:string
    invoice_amount:string
    notify_id:string
    fund_bill_list:string
    notify_type:string
    //TRADE_SUCCESS
    trade_status:string
    receipt_amount:string
    buyer_pay_amount:string
    app_id:string
    sign_type:string
    seller_id:string
    gmt_payment:string
    notify_time:string
    version:string
    out_trade_no:string
    total_amount:string
    trade_no:string
    auth_app_id:string
    buyer_logon_id:string
    point_amount:string
}
export enum EAlipayExecType
{
    exec,
    sdkExec,
    pageExec
}
export class AlipayTool
{
    protected _alipaySdk:AlipaySdk=null
    get alipaySdk()
    {
        return this._alipaySdk
    }
    async init(cfg:AlipaySdkConfig&{open:boolean})
    {
        if(!cfg
            ||!cfg.open)
        {
            return false
        }
        let ret = true
        // 实例化客户端
        this._alipaySdk = new AlipaySdk(cfg);
        const result = await this._alipaySdk.curl('POST', '/v3/alipay/user/deloauth/detail/query', {
            body: {
              date: '20230102',
              offset: 20,
              limit: 1,
            },
        });
        if(result&&result.responseHttpStatus==200)
        {
            gLog.info(result)
            gLog.info("alipay init success!")
        }
        else
        {
            gLog.error(result)
            gLog.error("alipay init failed!")
            ret = false
        }
        return ret
    }

    /**
     * 创建支付宝APP支付订单
     * @param params 支付参数
     * @returns 支付订单信息
     */
    async trade_app_pay(params: AlipayAppPayParams,execType:EAlipayExecType=EAlipayExecType.exec):Promise<string|null|AlipaySdkCommonResult>
    {
        return await this.exec('alipay.trade.app.pay',params,execType)
    }

    /**
     * 验证支付宝支付回调
     * @param notifyData 回调数据
     * @returns 验证结果
     */
    async verifyNotify(notifyData: AlipayCallbackInfo): Promise<boolean> {
        try {
            if (!this._alipaySdk) {
                return false;
            }

            // 验证签名
            const signValid = await this._alipaySdk.checkNotifySign(notifyData);
            if (!signValid) {
                gLog.error({tip:'支付宝回调签名验证失败'});
                return false;
            }

            // 验证交易状态
            if (notifyData.trade_status !== 'TRADE_SUCCESS' && notifyData.trade_status !== 'TRADE_FINISHED') {
                gLog.error({tip:'支付宝回调交易状态异常:',status:notifyData.trade_status});
                return false;
            }

            return true;
        } catch (error) {
            gLog.error({tip:'验证支付宝回调失败:',error});
            return false;
        }
    }
    async exec(method:string,params:any,execType:EAlipayExecType=EAlipayExecType.exec):Promise<string|null|AlipaySdkCommonResult>
    {
        try
        {
            if (!this._alipaySdk) {
                return null
            }
            let result = null
            switch(execType)
            {
                case EAlipayExecType.exec:
                    result = await this._alipaySdk.exec(
                        method,
                        params
                    )
                    break;
                case EAlipayExecType.sdkExec:
                    result = await this._alipaySdk.sdkExec(
                        method,
                        params
                    )
                    break;
                case EAlipayExecType.pageExec:
                    result = await this._alipaySdk.pageExec(
                        method,
                        params
                    )
                    break;
            }
            return result
        }
        catch (error) 
        {
            gLog.error({tip:'执行支付宝请求失败:',method,params, error:error});
            return null;
        }
    }

    /**
     * 查询订单状态
     * @param outTradeNo 商户订单号
     * @returns 订单状态
     */
    async trade_query(outTradeNo: string,execType:EAlipayExecType=EAlipayExecType.exec): Promise<string|null|AlipaySdkCommonResult> {
        return await this.exec('alipay.trade.query',{
            bizContent:
            {
                out_trade_no: outTradeNo
            }
        },execType)
    }
}

export let gAlipayTool=new AlipayTool()