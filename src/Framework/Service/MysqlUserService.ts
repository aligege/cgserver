import * as _ from "underscore";
import { MysqlBaseService, BaseModel } from "../Database/Mysql/MysqlBaseService";
import { PrimaryKey } from "../Database/Decorator/PrimaryKey";
import { NotNull } from "../Database/Decorator/NotNull";
import { EPropertyType } from "../Database/Decorator/Property";
import { Type } from "../Database/Decorator/Type";
import { EUserState } from "./ini";

export class MysqlUserModel extends BaseModel
{
    @Type(EPropertyType.Int)
    @NotNull
    @PrimaryKey
    id:number=-1

    @NotNull
    @Type(EPropertyType.Int,-1)
    account_id:number=-1

    @NotNull
    @Type(EPropertyType.Varchar,"noname",32)
    nickname:string=""

    @NotNull
    @Type(EPropertyType.SmallInt,0)
    sex:number=-1

    @NotNull
    @Type(EPropertyType.Varchar,"",255)
    logo:string=""

    @NotNull
    @Type(EPropertyType.Int,0)
    state:number=EUserState.Waitting

    @NotNull
    @Type(EPropertyType.Int,4)
    role_group:number=4

    @NotNull
    @Type(EPropertyType.Int,0)
    role:number=0

    @NotNull
    @Type(EPropertyType.Varchar,"")
    phone:string=""

    @NotNull
    @Type(EPropertyType.Varchar,"")
    email:string=""

    @NotNull
    @Type(EPropertyType.Varchar,"",512)
    about:string=""

    @NotNull
    @Type(EPropertyType.Int,-1)
    pre_user_id:number=-1
    
    @NotNull
    @Type(EPropertyType.Int,0)
    exp:number = 0

    @NotNull
    @Type(EPropertyType.Int,1)
    level:number = 1//等级

    @NotNull
    @Type(EPropertyType.Int,0)
    vip_exp:number = 0

    @NotNull
    @Type(EPropertyType.Int,0)
    vip_level:number = 0//等级

    @NotNull
    @Type(EPropertyType.TinyInt,0)
    is_robot:number = 0

    @NotNull
    @Type(EPropertyType.BigInt,0)
    create_time:number = 0
}
//暂时不实例化，方便重写
export let GUserSer:MysqlUserService<MysqlUserModel>=null
export class MysqlUserService<T extends MysqlUserModel> extends MysqlBaseService<T>
{
    constructor(type: { new(): T})
    {
        super(type)
        GUserSer = this
    }
    protected async _createNewUser(account_id:number,nickname:string,sex:number,logo:string)
    {
        let um = new this._t_type()
        um.account_id = account_id
        um.nickname = nickname
        if(!um.nickname||um.nickname.length==0)
        {
            um.nickname = "noname"
        }
        um.sex = sex||0
        um.logo = logo||""
        um.account_id = account_id
        um.state = EUserState.Waitting
        um.role = 0
        //随机userid
        let id = 0
        do
        {
            id=_.random(1000000,9999999)
            let p = await this.get("id","id=?",[id])
            if(!p)
            {
                break
            }
        }while(true)
        um.id = id
        return um
    }
    async updateBaseInfoByAccount(account_id:number,nickname:string,sex:number,logo:string)
    {
        let sr = await this.updateProperty("nickname=?,sex=?,logo=?","account_id=?",[nickname,sex,logo,account_id])
        if(sr.error&&sr.execResult.affectedRows<=0)
        {
            return "更新失败"
        }
        return
    }
    async add(account_id:number,nickname:string,sex:number,logo:string)
    {
        let um:any = await this._createNewUser(account_id,nickname,sex,logo)
        let sr = await this.insert(um)
        if(sr.error||sr.queryResult.length<=0)
        {
            return null
        }
        return um
    }
    async getByAccountId(account_id:number)
    {
        let pm:T = await this.get(null,"account_id=?",[account_id])
        return pm
    }
}