import { EErrorCode } from '../Config/_error_';
import { BaseService } from '../Database/BaseMongoService';
import { MongoBaseModel } from '../Database/MongoManager';
import { GCacheTool } from '../Logic/CacheTool';
import { GOpenSocial } from '../ThirdParty/OpenSocial';
import { GQQTool } from '../ThirdParty/QQTool';
import { GWechatTool } from '../ThirdParty/WechatTool';
import { EAccountFrom } from './ini';
import { GUserSer, UserModel } from './MongoUserService';

export class AccountModel extends MongoBaseModel
{
    id:number=-1
    phone:string=""
    email:string=""
    name:string=""
    password:string=""
    unionid:string=""//第三方
    openid:string=""
    create_time:number=-1
    create_ip:string=""
    login_time:number=-1
    login_ip:string=""
    from:number=0
    state:number=0
}
//暂时不实例化，方便重写
export let GAccountSer:AccountService=null
export class AccountService extends BaseService<AccountModel>
{
    protected _account_cache_key_pre="table_account_"
    protected _account_cache_time_sec=1*60*60*1000
    constructor()
    {
        super("account",AccountModel)
        GAccountSer = this
    }
    protected _getNewModel()
    {
        return new AccountModel()
    }
    /**
     * 注册新账号
     * @param unionid 
     * @param openid 
     * @param ip 
     * @param from 
     */
    async add(unionid:string,openid:string,ip:string,from:EAccountFrom)
    {
        let account = this._getNewModel()
        switch(from)
        {
            case EAccountFrom.OpenSocial:
            case EAccountFrom.WeChat:
            case EAccountFrom.QQ:
            case EAccountFrom.Apple:
            case EAccountFrom.Google:
            {
                account.unionid=unionid
                account.openid=openid
                break
            }
            case EAccountFrom.Email:
            {
                account.email=unionid
                account.password=openid
                break
            }
            case EAccountFrom.Phone:
            case EAccountFrom.QuickPhone:
            {
                account.phone=unionid
                account.password=openid
                break
            }
            case EAccountFrom.Name:
            case EAccountFrom.Guest:
            {
                account.name=unionid
                account.password=openid
                break
            }
        }
        account.create_time=Date.now()
        account.create_ip=ip
        account.login_time=Date.now()
        account.login_ip=ip
        account.from=from
        account.state=1
        account.id=await this.getNextId()
        let sr = await this.insert(account)
        if(sr.rs.insertedCount!=1)
        {
            return null
        }
        return sr.rs.ops[0]
    }
    /**
     * 通过第三方信息获取账号
     * @param unionid 
     * @param openid 
     */
    async getByThird(unionid:string,openid:string)
    {
        let key = this._account_cache_key_pre+unionid
        let am:AccountModel=GCacheTool.get(key)
        if(am)
        {
            return am
        }
        am = await this.get(null,{unionid:unionid,openid:openid})
        if(am)
        {
            GCacheTool.add(key,am,this._account_cache_time_sec)
        }
        return am
    }
    /**
     * 通过第三方信息获取账号
     * @param unionid 
     */
    async getByUnionid(unionid:string)
    {
        let key = this._account_cache_key_pre+unionid
        let am:AccountModel=GCacheTool.get(key)
        if(am)
        {
            return am
        }
        am = await this.get(null,{unionid:unionid})
        if(am)
        {
            GCacheTool.add(key,am,this._account_cache_time_sec)
        }
        return am
    }
    async getByPhone(phone:string)
    {
        let key = this._account_cache_key_pre+phone
        let am:AccountModel=GCacheTool.get(key)
        if(am)
        {
            return am
        }
        am = await this.get(null,{phone:phone})
        if(am)
        {
            GCacheTool.add(key,am,this._account_cache_time_sec)
        }
        return am
    }
    /**
     * 登陆接口
     * @param unionid 
     * @param openid 
     * @param ip 
     * @param from 
     * @param access_token qq、wechat使用
     */
    async login(unionid:string,openid:string,ip:string,from:EAccountFrom,access_token?:string,extra?:{nickname:string,sex:number,logo:string})
    {
        let rs = {errcode:null,account:<AccountModel>null,is_new:false}
        if(!unionid||!openid)
        {
            rs.errcode=EErrorCode.Wrong_Params
            return rs
        }
        let login_rs = await this._login(unionid,openid,from)
        rs.account=login_rs.account
        rs.errcode=login_rs.errcode
        let account = rs.account
        let extra_info:{nickname:string,sex:number,logo:string}=extra
        if(!account)
        {
            switch(from)
            {
                case EAccountFrom.OpenSocial:
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
        let user = await GUserSer.getByAccountId(account.id)
        if(!user)
        {
            switch(from)
            {
                case EAccountFrom.OpenSocial:
                case EAccountFrom.QQ:
                case EAccountFrom.WeChat:
                case EAccountFrom.Apple:
                case EAccountFrom.Google:
                {
                    if(!extra_info)
                    {
                        if(from==EAccountFrom.OpenSocial)
                        {
                            let body = await GOpenSocial.getUser(unionid,openid)
                            if(body&&body.errcode)
                            {
                                rs.errcode = body.errcode
                                return rs
                            }
                            else if(body&&body.user)
                            {
                                extra_info=
                                {
                                    logo:body.user.logo,
                                    sex:body.user.sex,
                                    nickname:body.user.nickname
                                }
                            }
                        }
                        else if(from==EAccountFrom.QQ)
                        {
                            let userInfo = await GQQTool.getUserInfo(access_token,openid)
                            if(userInfo.ret)
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
                            let userInfo = await GWechatTool.getUserInfo(access_token,openid)
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
                    let user = await GUserSer.add(account.id,extra_info.nickname,extra_info.sex,extra_info.logo)
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
                    let user:UserModel = null
                    if(extra_info)
                    {
                        user = await GUserSer.add(account.id,extra_info.nickname,extra_info.sex,extra_info.logo)
                    }
                    else
                    {
                        user = await GUserSer.add(account.id,null,null,null)
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
            if(extra)
            {
                await GUserSer.updateBaseInfoByAccount(account.id,extra_info.nickname,extra_info.sex,extra_info.logo)
            }
        }
        rs.account = account
        return rs
    }
    protected async _login(unionid:string,openid:string,from:EAccountFrom)
    {
        let rs = {errcode:null,account:<AccountModel>null}
        if(from==EAccountFrom.QQ
            ||from==EAccountFrom.WeChat
            ||from==EAccountFrom.OpenSocial
            ||from==EAccountFrom.Apple
            ||from==EAccountFrom.Google)
        {
            rs.account = await this.getByThird(unionid,openid)
        }
        else if(from==EAccountFrom.QuickPhone)
        {
            let key = "phone_code_"+unionid
            let code = GCacheTool.get(key)
            if(!code||code!=openid)
            {
                rs.errcode=EErrorCode.Wrong_Phone_Code
                return rs
            }
            rs.account = await this.getByPhone(unionid)
        }
        else if(from==EAccountFrom.Phone)
        {
            rs.account = await this.get(null,{phone:unionid,password:openid})
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Email)
        {
            rs.account = await this.get(null,{email:unionid,password:openid})
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Name||from==EAccountFrom.Guest)
        {
            rs.account = await this.get(null,{name:unionid,password:openid})
            if(!rs.account&&from==EAccountFrom.Name)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        return rs
    }
    /**
     * 修改密码
     * @param unionid 
     * @param openid
     * @param new_pwd 
     */
    async updatePwd(unionid:string,openid:string,new_pwd:string)
    {
        let rs = await GOpenSocial.updatePwd(unionid,openid,new_pwd)
        return rs
    }
    async register(type:EAccountFrom,key:string,password:string,ip:string,extra?)
    {
        let rs={user:<UserModel>null,errcode:null}
        extra=extra||{}
        let am = this._getNewModel()
        switch(type)
        {
            case EAccountFrom.Phone:
            {
                am.phone=key
                let temp=await this.get({id:1},{phone:key})
                if(temp)
                {
                    rs.errcode=EErrorCode.Account_Phone_Exist
                    return rs
                }
                break
            }
            case EAccountFrom.Email:
            {
                am.email=key
                let temp=await this.get({id:1},{email:key})
                if(temp)
                {
                    rs.errcode=EErrorCode.Account_Email_Exist
                    return rs
                }
                break
            }
            case EAccountFrom.Name:
            {
                am.name=key
                let temp=await this.get({id:1},{name:key})
                if(temp)
                {
                    rs.errcode=EErrorCode.Account_Name_Exist
                    return rs
                }
                break
            }
            default:
            {
                rs.errcode=EErrorCode.Account_Type_Error
                return rs
            }
        }
        am.password=password
        am.create_time=Date.now()
        am.create_ip=ip
        am.login_time=Date.now()
        am.login_ip=ip
        am.id = await this.getNextId()

        let rs_am = await this.insert(am)
        if(rs_am.rs.insertedCount!=1)
        {
            rs.errcode=EErrorCode.Mysql_Error
            return rs
        }
        let user = await GUserSer.add(am.id,extra.nickname,extra.sex,extra.logo)
        if(!user)
        {
            this.deleteOne({id:am.id})
            rs.errcode=EErrorCode.User_Create_Failed
            return rs
        }
        rs.user=user
        return rs
    }
}