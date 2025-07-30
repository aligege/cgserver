import mongoose from 'mongoose';
import { EErrorCode, Errcode } from '../Config/_error_';
import { MongoBaseService } from '../Database/Mongo/MongoBaseService';
import { gCacheTool } from '../Logic/CacheTool';
import { gQQTool } from '../ThirdParty/QQTool';
import { gWechatTool } from '../ThirdParty/WechatTool';
import { EAccountFrom, EAccountState } from './ini';
import { IMongoUserModel, MongoUserService } from './MongoUserService';

export interface IMongoAccountModel extends mongoose.Document
{
    phone:string
    email:string
    name:string
    password:string
    unionid:string//第三方
    openid:string
    create_time:Date
    create_ip:string
    login_time:Date
    login_ip:string
    from:EAccountFrom
    state:EAccountState
}

export class MongoAccountService<T extends IMongoAccountModel> extends MongoBaseService<T>
{
    get userService():MongoUserService<IMongoUserModel>
    {
        throw new Error("请重写userService方法");
    }
    constructor(extaccountdef: mongoose.SchemaDefinition<T>)
    {
        const accountSchema = new mongoose.Schema({...{
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            name: { type: String, default: "" },
            password: { type: String, default: "" },
            unionid: { type: String, default: "" }, // 第三方唯一标识
            openid: { type: String, default: "" }, // 第三方开放ID
            create_time: { type: Date, default: new Date() },
            create_ip: { type: String, default: "" },
            login_time: { type: Date, default: new Date() },
            login_ip: { type: String, default: "" },
            from: { type: Number,default: EAccountFrom.Guest }, // 来源
            state: { type: Number,default: EAccountState.Waitting } // 状态
        },...extaccountdef});
        super('account',accountSchema);
        let userService=this.userService
    }
    /**
     * 注册新账号
     * @param unionid 
     * @param openid 
     * @param ip 
     * @param from 
     */
    async add(key:string,pass:string,ip:string,from:EAccountFrom)
    {
        let account = {} as Partial<T>;
        switch(from)
        {
            case EAccountFrom.WeChat:
            case EAccountFrom.QQ:
            case EAccountFrom.Apple:
            case EAccountFrom.Google:
            {
                account.unionid=key
                account.openid=pass
                break
            }
            case EAccountFrom.Email:
            {
                account.email=key
                account.password=pass
                break
            }
            case EAccountFrom.Phone:
            case EAccountFrom.QuickPhone:
            {
                account.phone=key
                account.password=pass
                break
            }
            case EAccountFrom.Name:
            case EAccountFrom.Guest:
            {
                account.name=key
                account.password=pass
                break
            }
        }
        account.create_ip=ip
        account.login_ip=ip
        account.from=from
        let sr = await this.insert(account)
        return sr.model
    }
    /**
     * 通过第三方信息获取账号
     * @param unionid 
     * @param openid 
     */
    async getByThird(unionid:string,openid:string)
    {
        let am:T = await this.findOne({unionid:unionid,openid:openid})
        return am
    }
    /**
     * 通过第三方信息获取账号
     * @param unionid 
     */
    async getByUnionid(unionid:string)
    {
        let am:T = await this.findOne({unionid:unionid})
        return am
    }
    async getByPhone(phone:string)
    {
        let am:T = await this.findOne({phone:phone+""})
        return am
    }
    /**
     * 登陆接口
     * @param unionid 用户名、邮箱、手机号或者第三方的unionid
     * @param openid 密码或者第三方的openid
     * @param ip 登录ip
     * @param from 登录来源
     * @param access_token qq、wechat使用
     */
    async login(unionid:string,openid:string,ip:string,from:EAccountFrom,force_user=true,access_token?:string)
    {
        let rs = {errcode:null,account:<T>null,is_new:false}
        if(!unionid||!openid)
        {
            rs.errcode=EErrorCode.Wrong_Params
            return rs
        }
        unionid+=""
        openid+=""
        let login_rs = await this._login(unionid,openid,from)
        rs.account=login_rs.account
        rs.errcode=login_rs.errcode
        if(rs.errcode)
        {
            return rs
        }
        let account = rs.account
        let extra_info:{nickname:string,sex:number,logo:string}=<any>{}
        if(!account)
        {
            switch(from)
            {
                case EAccountFrom.QQ:
                case EAccountFrom.WeChat:
                case EAccountFrom.Guest:
                case EAccountFrom.QuickPhone:
                case EAccountFrom.Apple:
                case EAccountFrom.Google:
                {
                    account = await this.add(unionid,openid,ip,from)
                    break
                }
                default:
                {
                    rs.errcode = EErrorCode.No_Account
                    return rs
                }
            }
        }
        if(!account)
        {
            rs.errcode = EErrorCode.No_Account
            return rs
        }
        if(force_user)
        {
            let userser = this.userService
            let user = await userser.findOne({account_id:account.id})
            if(!user)
            {
                switch(from)
                {
                    case EAccountFrom.QQ:
                    case EAccountFrom.WeChat:
                    case EAccountFrom.Apple:
                    case EAccountFrom.Google:
                    {
                        if(!extra_info)
                        {
                            if(from==EAccountFrom.QQ)
                            {
                                let userInfo = await gQQTool.getUserInfo(access_token,openid)
                                if(!userInfo)
                                {
                                    rs.errcode=EErrorCode.Server_Error
                                    return rs
                                }
                                extra_info=
                                {
                                    logo:userInfo.figureurl_qq,
                                    sex:(userInfo.gender=="男"?1:0),
                                    nickname:userInfo.nickname
                                }
                            }
                            else if(from==EAccountFrom.WeChat)
                            {
                                let userInfo = await gWechatTool.getUserInfo(access_token,openid)
                                if((<any>userInfo).errcode)
                                {
                                    rs.errcode=EErrorCode.Server_Error
                                    return rs
                                }
                                extra_info=
                                {
                                    logo:userInfo.headimgurl,
                                    sex:(userInfo.sex==1?1:0),
                                    nickname:userInfo.nickname
                                }
                            }
                            else if(from==EAccountFrom.Apple||from==EAccountFrom.Google)
                            {
                                extra_info=
                                {
                                    logo:"32",
                                    sex:0,
                                    nickname:"noname"
                                }
                            }
                        }
                        let user = await userser.add(account.id,extra_info.nickname,extra_info.sex,extra_info.logo)
                        if(!user)
                        {
                            this.deleteOne({id:account.id})
                            rs.errcode=EErrorCode.User_Create_Failed
                            return rs
                        }
                        break;
                    }
                    case EAccountFrom.QuickPhone:
                    case EAccountFrom.Guest:
                    {
                        let user:IMongoUserModel = null
                        if(extra_info)
                        {
                            user = await userser.add(account.id,extra_info.nickname,extra_info.sex,extra_info.logo)
                        }
                        else
                        {
                            user = await userser.add(account.id)
                        }
                        if(!user)
                        {
                            this.deleteOne({id:account.id})
                            rs.errcode=EErrorCode.User_Create_Failed
                            return rs
                        }
                        break;
                    }
                    default:
                    {
                        rs.errcode = EErrorCode.No_Account
                        return rs
                    }
                }
                rs.is_new=true
            }
        }
        account.login_time=new Date()
        account.login_ip=ip
        await account.save()
        rs.account = account
        return rs
    }
    protected async _login(key:string,pass:string,from:EAccountFrom)
    {
        key+=""
        pass+=""
        let rs = {errcode:<Errcode>null,account:<T>null}
        if(from==EAccountFrom.QQ
            ||from==EAccountFrom.WeChat
            ||from==EAccountFrom.Apple
            ||from==EAccountFrom.Google)
        {
            rs.account = await this.getByThird(key,pass)
        }
        else if(from==EAccountFrom.QuickPhone)
        {
            let _phone_key = "phone_code_"+key
            let code = gCacheTool.get(_phone_key)
            if(!code||code!=pass)
            {
                rs.errcode=EErrorCode.Wrong_Phone_Code
                return rs
            }
            rs.account = await this.getByPhone(key)
        }
        else if(from==EAccountFrom.Phone)
        {
            rs.account = await this.findOne({phone:key,password:pass})
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Email)
        {
            rs.account = await this.findOne({email:key,password:pass})
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Name||from==EAccountFrom.Guest)
        {
            rs.account = await this.findOne({name:key,password:pass})
            if(!rs.account&&from==EAccountFrom.Name)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        return rs
    }
}