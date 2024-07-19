import ECKey from "ec-key";
import { v4 as uuidv4 } from 'uuid';

import * as fs from "fs";
import { Config } from '../Config/Config';
import { global } from "../global";
//developer.apple.com/documentation/appstorereceipts/responsebody
class ReceiptInfo
{
    cancellation_date=""
    cancellation_date_ms=""
    cancellation_date_pst=""
    cancellation_date_reason=""
    expires_date= "2021-03-10 14:25:54 Etc/GMT"
    expires_date_ms= "1615386354000"
    expires_date_pst= "2021-03-10 06:25:54 America/Los_Angeles"
    in_app_ownership_type:"FAMILY_SHARED"|"PURCHASED"
    is_in_intro_offer_period= false
    is_trial_period= false
    is_upgraded=false
    offer_code_ref_name=""
    original_purchase_date= "2021-03-10 08:22:26 Etc/GMT"
    original_purchase_date_ms= "1615364546000"
    original_purchase_date_pst= "2021-03-10 00:22:26 America/Los_Angeles"
    original_transaction_id= "1000000786747716"
    purchase_date= "2021-03-10 14:22:54 Etc/GMT"
    purchase_date_ms= "1615386174000"
    purchase_date_pst= "2021-03-10 06:22:54 America/Los_Angeles"
    quantity= 1
    subscription_group_identifier= "20745320"
    web_order_line_item_id= "1000000060695307"
    transaction_id= "1000000786974540"
    product_id= "com.eryi.eyreader.week"
}
class PendingRenewalInfo
{
    auto_renew_product_id= "com.eryi.eyreader.week"
    auto_renew_status= 0
    expiration_intent= 1
    grace_period_expires_date=""
    grace_period_expires_date_ms=""
    grace_period_expires_date_pst=""
    is_in_billing_retry_period= 0
    offer_code_ref_name=""
    original_transaction_id= "1000000786747716"
    price_consent_status=""
    product_id= "com.eryi.eyreader.week"
    promotional_offer_id=""
}
class InApp
{
    cancellation_date=""
    cancellation_date_ms=""
    cancellation_date_pst=""
    cancellation_reason=""
    expires_date= "2021-03-10 14:25:54 Etc/GMT"
    expires_date_ms= "1615386354000"
    expires_date_pst= "2021-03-10 06:25:54 America/Los_Angeles"
    is_in_intro_offer_period= false
    is_trial_period= false
    original_purchase_date= "2021-03-10 08:22:26 Etc/GMT"
    original_purchase_date_ms= "1615364546000"
    original_purchase_date_pst= "2021-03-10 00:22:26 America/Los_Angeles"
    original_transaction_id= "1000000786747716"
    product_id= "com.eryi.eyreader.week"
    promotional_offer_id=""
    purchase_date= "2021-03-10 14:22:54 Etc/GMT"
    purchase_date_ms= "1615386174000"
    purchase_date_pst= "2021-03-10 06:22:54 America/Los_Angeles"
    quantity= 1
    transaction_id= "1000000786974540"
    web_order_line_item_id= "1000000060695307"
}
class Receipt
{
    adam_id=-1
    app_item_id=-1
    application_version=""
    bundle_id=""
    download_id=-1
    expiration_date=""
    expiration_date_ms=""
    expiration_date_pst=""
    in_app:InApp=null
    original_application_version=""
    original_purchase_date=""
    original_purchase_date_ms=""
    original_purchase_date_pst=""
    preorder_date=""
    preorder_date_ms=""
    preorder_date_pst=""
    receipt_creation_date=""
    receipt_creation_date_ms=""
    receipt_creation_date_pst=""
    receipt_type=""
    request_date=""
    request_date_ms=""
    request_date_pst=""
    version_external_identifier=-1
}
export class ResponseBody
{
    environment:"Sandbox"|"Production"="Sandbox"
    is_retryable=false//出错之后的重试
    latest_receipt="0OkG/Sw=="
    latest_receipt_info: Array<ReceiptInfo>=null
    pending_renewal_info: Array<PendingRenewalInfo>=null
    receipt:Receipt=null
    status=0
}
export class NotificationType
{
    //退款
    static CANCEL="CANCEL"
    //变更续订方式，下次续订的时候生效，当前不变
    static DID_CHANGE_RENEWAL_PREF="DID_CHANGE_RENEWAL_PREF"
    /*
    续订状态发生变化的时候通知
    检查auto_renew_status_change_date_ms获取最新的状态更新时间.
    通过auto_renew_status了解当前续订状态.
    */
    static DID_CHANGE_RENEWAL_STATUS="DID_CHANGE_RENEWAL_STATUS"
    //自动续订了一个之前续订失败了的续订
    static DID_RECOVER="DID_RECOVER"
    //自动续订成功
    static DID_RENEW="DID_RENEW"
    //客户交互更新订阅，订阅可以立刻生效
    static INTERACTIVE_RENEWAL="INTERACTIVE_RENEWAL"
    
}
export class NotificationBody
{
    unified_receipt: ResponseBody=null
    environment="Sandbox"
    auto_renew_status="false"
    auto_renew_status_change_date="2021-03-11 03:03:14 Etc/GMT"
    bvrs="1"
    bid="com.eryi.eyreader"
    password="5203c7781e254aac8942290a0a2467ac"
    auto_renew_product_id="com.eryi.eyreader.week"
    notification_type=NotificationType.DID_RECOVER
}
class RequestBody
{
    "receipt-data"=""
    password="5203c7781e254aac8942290a0a2467ac"
    "exclude-old-transactions"=true
}

export class AppleTool
{
    protected _verifyUrl="https://buy.itunes.apple.com/verifyReceipt"
    protected _sandboxVerifyUrl="https://sandbox.itunes.apple.com/verifyReceipt"
    async onNotify(nb:NotificationBody)
    {
        let ris=nb.unified_receipt?.latest_receipt_info
        var latest_one:ReceiptInfo=(ris?.length>0?ris[0]:null)
        let msg=
        {
            "notification_type":nb.notification_type,
            "status":nb.unified_receipt.status,
            "environment":nb.environment,
            "auto_renew_status":nb.auto_renew_status,
            "orginal_transaction_id":latest_one?.original_transaction_id,
            "transaction_id":latest_one?.transaction_id,
            "expire_date":latest_one?.expires_date,
            "receipt_expire_date":nb.unified_receipt?.receipt?.expiration_date
        }
        global.gLog.info(msg)
        global.gLog.info(nb)
    }
    async onVerify(receipt:string,environment:string)
    {
        global.gLog.info("begin onVerify============================"+environment)
        let url = this._verifyUrl
        // if(environment.toLowerCase()=="sandbox")
        // {
        //     url=this._sandboxVerifyUrl
        // }
        global.gLog.info("url============================"+url)
        let reqb = new RequestBody()
        reqb['receipt-data']=receipt
        //先验证生产环境
        var resb:ResponseBody = (await global.gHttpTool.post({url,form:JSON.stringify(reqb)})).body
        global.gLog.info("production end onVerify_Res============================status="+(resb?resb.status:"null"))
        //状态21007表示是沙盒环境
        if(resb&&resb.status==21007)
        {
            url=this._sandboxVerifyUrl
            resb = (await global.gHttpTool.post({url,form:JSON.stringify(reqb)})).body
            global.gLog.info("sandbox end onVerify_Res============================status="+(resb?resb.status:"null"))
        }
        global.gLog.info(resb)
        return resb
    }
    signature(nickname:string,create_time:number,appBundleID:string,productIdentifier:string,offerIdentifier:string)
    {
        let keyIdentifier="";
        for(var k in global.gServerCfg.apple.keyIds)
        {
            keyIdentifier=k
            break
        }
        var nonce = uuidv4()
	    var payload = appBundleID + '\u2063' +
        keyIdentifier + '\u2063' +
                  productIdentifier + '\u2063' +
                  offerIdentifier + '\u2063' +
                  nickname  + '\u2063'+
                  nonce.toLowerCase() + '\u2063' +
                  create_time;

        // Get the PEM-formatted private key string associated with the Key ID.
        const path = global.gServerCfg.apple.keyIds[keyIdentifier]
        const keyString = fs.readFileSync(Config.rootDataDir+path).toString()

        // Create an Elliptic Curve Digital Signature Algorithm (ECDSA) object using the private key.
        const key = new ECKey(keyString, 'pem')

        // Set up the cryptographic format used to sign the key with the SHA-256 hashing algorithm.
        const cryptoSign = key.createSign('SHA256');

        // Add the payload string to sign.
        cryptoSign.update(payload);

        /*
            The Node.js crypto library creates a DER-formatted binary value signature,
            and then base-64 encodes it to create the string that you will use in StoreKit.
        */
        const signature = cryptoSign.sign('base64');

        /*
            Check that the signature passes verification by using the ec-key library.
            The verification process is similar to creating the signature, except it uses 'createVerify'
            instead of 'createSign', and after updating it with the payload, it uses `verify` to pass in
            the signature and encoding, instead of `sign` to get the signature.

            This step is not required, but it's useful to check when implementing your signature code.
            This helps debug issues with signing before sending transactions to Apple.
            If verification succeeds, the next recommended testing step is attempting a purchase
            in the Sandbox environment.
        */
        const verificationResult = key.createVerify('SHA256').update(payload).verify(signature, 'base64');
        if(verificationResult)
        {
            return { 'keyIdentifier': keyIdentifier, 'nonce': nonce, 'timestamp': create_time, 'signature': signature }
        }
        return
    }
}