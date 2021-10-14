import { EPropertyType } from './../Database/Decorator/Property';
import { BaseModel, BaseService } from './../Database/BaseService';
import { GMysqlMgr } from '../Database/MysqlManager';
import { GCacheTool } from '../Logic/CacheTool';
import { EErrorCode } from '../Config/_error_';
import { GOpenSocial } from '../ThirdParty/OpenSocial';
import { GUserSer, UserModel } from './UserService';
import { GQQTool } from '../ThirdParty/QQTool';
import { GWechatTool } from '../ThirdParty/WechatTool';
import { Table } from '../Database/Decorator/Table';
import { PrimaryKey } from '../Database/Decorator/PrimaryKey';
import { NotNull } from '../Database/Decorator/NotNull';
import { Type } from '../Database/Decorator/Type';
import { AutoIncrement } from '../Database/Decorator/AutoIncrement';
import { EAccountFrom } from './ini';

@Table("account",1,"账号")
export class AccountModel extends BaseModel
{
    @Type(EPropertyType.Int)
    @NotNull
    @PrimaryKey
    @AutoIncrement
    id:number = -1

    @NotNull
    @Type(EPropertyType.Varchar)
    phone:string=""

    @NotNull
    @Type(EPropertyType.Varchar)
    email:string=""

    @NotNull
    @Type(EPropertyType.Varchar)
    name:string=""

    @NotNull
    @Type(EPropertyType.Varchar)
    password:string=""

    @NotNull
    @Type(EPropertyType.Varchar,"",128)
    unionid:string=""//第三方

    @NotNull
    @Type(EPropertyType.Varchar,"",128)
    openid:string=""

    @NotNull
    @Type(EPropertyType.BigInt)
    create_time:number=-1

    @NotNull
    @Type(EPropertyType.Varchar)
    create_ip:string=""

    @NotNull
    @Type(EPropertyType.BigInt)
    login_time:number=-1

    @NotNull
    @Type(EPropertyType.Varchar)
    login_ip:string=""

    @NotNull
    @Type(EPropertyType.Int)
    from:number=0

    @NotNull
    @Type(EPropertyType.Int)
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
        super(AccountModel)
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
        delete account.id
        let sr = await this.insert(account)
        if(sr.error
            ||!sr.results.insertId)
        {
            return null
        }
        account.id = sr.results.insertId
        return account
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
        am = await this.get(null,"unionid=? and openid=?",[unionid,openid])
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
        am = await this.get(null,"unionid=?",[unionid])
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
        am = await this.get(null,"phone=?",[phone])
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
                        this.removeById(account.id)
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
                        this.removeById(account.id)
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
        if(user&&extra_info)
        {
            await GUserSer.updateProperty("nickname=?,sex=?,logo=?","id=?",[extra_info.nickname,extra_info.sex||0,extra_info.logo,user.id])
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
            rs.account = await this.get(null,"phone=? and password=?",[unionid,openid])
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Email)
        {
            rs.account = await this.get(null,"email=? and password=?",[unionid,openid])
            if(!rs.account)
            {
                rs.errcode=EErrorCode.Login_Failed
            }
        }
        else if(from==EAccountFrom.Name||from==EAccountFrom.Guest)
        {
            rs.account = await this.get(null,"name=? and password=?",[unionid,openid])
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
                let temp=await this.get("id","phone=?",[key])
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
                let temp=await this.get("id","email=?",[key])
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
                let temp=await this.get("id","name=?",[key])
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

        let sr = await this.insert(am)
        if(sr.results.insertId)
        {
            am.id=sr.results.insertId
        }
        else
        {
            am = null
        }
        if(!am)
        {
            rs.errcode=EErrorCode.Mysql_Error
            return rs
        }
        let user = await GUserSer.add(am.id,extra.nickname,extra.sex,extra.logo)
        if(!user)
        {
            this.removeById(am.id)
            rs.errcode=EErrorCode.User_Create_Failed
            return rs
        }
        rs.user=user
        return rs
    }
}