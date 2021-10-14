import * as _ from "underscore";
import { BaseService } from "../Database/BaseMongoService";
import { MongoBaseModel } from "../Database/MongoManager";
import { ERoleGroup } from "./ini";

export class UserModel extends MongoBaseModel
{
    id:number=-1
    account_id:number=-1
    nickname:string=""
    sex:number=-1
    logo:string=""
    state:number=0
    role_group:number=4
    role:number=0
    phone:string=""
    wechat:string=""
    qq:string=""
    email:string=""
    about:string=""
    pre_user_id:number=-1
    exp:number = 0
    level:number = 1//等级
    vip_exp:number = 0
    vip_level:number = 0//等级
    is_robot:number = 0
    create_time:number = 0
}
//暂时不实例化，方便重写
export let GUserSer:UserService<UserModel>=null
export class UserService<T extends UserModel> extends BaseService<T>
{
    constructor(type: { new(): T})
    {
        super("user",type)
        GUserSer = this
    }
    protected _newUserModel():T
    {
        return <T>(new UserModel())
    }
    protected async _createNewUser(account_id:number,nickname:string,sex:number,logo:string,group?:ERoleGroup)
    {
        group = group || ERoleGroup.Common
        let um = this._newUserModel()
        um.account_id = account_id
        um.nickname = nickname
        if(!um.nickname||um.nickname.length==0)
        {
            um.nickname = "noname"
        }
        um.sex = sex||0
        um.logo = logo||""
        um.account_id = account_id
        um.state = 0
        um.role_group = group
        um.role = 0
        //随机userid
        let id = 0
        do
        {
            id=_.random(1000000,9999999)
            let p = await this.get({id:1},{id:id})
            if(!p)
            {
                break
            }
        }while(true)
        um.id = id
        return um
    }
    async add(account_id:number,nickname:string,sex:number,logo:string,group?:ERoleGroup)
    {
        let um:any = await this._createNewUser(account_id,nickname,sex,logo,group)
        let rs = await this.insert(um)
        if(rs.errcode||rs.rs.insertedCount!=1)
        {
            return null
        }
        return rs.rs.ops[0]
    }
    async getByAccountId(account_id:number)
    {
        let pm:T = await this.get(null,{account_id:account_id})
        return pm
    }
    async updateBaseInfoByAccount(account_id:number,nickname:string,sex:number,logo:string)
    {
        let model=
        {
            nickname:nickname,
            sex:sex,
            logo:logo
        }
        let sr = await this.updateOne(model,{account_id:account_id})
        if(sr.errcode)
        {
            return "更新失败"
        }
        return
    }
}