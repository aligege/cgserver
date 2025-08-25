import * as _ from "underscore";
import { MongoBaseService } from "../Database/Mongo/MongoBaseService";
import mongoose from "mongoose";
import { EUserState } from "./ini";
import { IMongoBaseModel } from "../Database/Mongo/MongoManager";

export interface IMongoUserModel extends IMongoBaseModel
{
    account_id:string
    state:EUserState
    is_robot:boolean
    create_time:Date
    login_time:Date
    create_ip:string
    login_ip:string
    nickname:string
    logo:string
    sex:number
}
//暂时不实例化，方便重写
export class MongoUserService<T extends IMongoUserModel> extends MongoBaseService<T>
{
    constructor(extuserdef: mongoose.SchemaDefinition<T>)
    {
        const userSchema = new mongoose.Schema({...{
            _id: { type: Number, index: { unique: true } },
            account_id: { type: String, index: { unique: true } },
            state: { type: Number,default: EUserState.Normal },
            is_robot: { type: Boolean, default: false },
            create_time: { type: Date, default: Date.now },
            login_time: { type: Date, default: Date.now },
            create_ip: { type: String, default: "" },
            login_ip: { type: String, default: "" },
            nickname: { type: String, default: "noname" },
            logo: { type: String, default: "" },
            sex: { type: Number, default: 0 }
        },...extuserdef},{id:false});
        userSchema.virtual('id').get(function() {
            return this._id
        });
        super('user', userSchema);
    }
    async add(account_id:string,nickname?:string,sex?:number,logo?:string)
    {
        let m:Partial<T> = {}
        m.account_id=account_id
        if(nickname)
        {
            m.nickname=nickname
        }
        if(sex!==undefined)
        {
            m.sex=sex
        }
        if(logo)
        {
            m.logo=logo
        }
        //随机userid
        let id = 0
        do
        {
            id=_.random(10000000,99999999)
            let p = await this.findOne({id:id},{id:1})
            if(!p)
            {
                break
            }
        }while(true)
        m._id=id
        let model = await this.insert(m)
        return model;
    }
}