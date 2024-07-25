import { BaseController } from './BaseController';
import { ESessionType } from '../../Config/FrameworkConfig';
import { MongoCacheModel, gMongoCacheSer, } from '../../Service/MongoCacheService';
import { ERoleGroup } from '../../Service/ini';
import { MongoUserModel, MongoUserService } from '../../Service/MongoUserService';
import { gCacheTool } from '../../Logic/CacheTool';
import { gRedisMgr } from '../../Database/Redis/RedisManager';
import { gMongoServiceMgr } from '../../Database/Mongo/MongoServiceManager';
export class MongoBaseUserController<T extends MongoUserModel> extends BaseController
{
    protected _user_session_id="user_session_id"
    protected _self_user:T=null
    protected _user:T=null//网页内容的所属，比如，查看别人的博客，那这个信息就是作者的
    protected _session_id:string=null
    protected _userser:MongoUserService<MongoUserModel>=null
    get selfUser()
    {
        return <T>this._self_user
    }
    get isSelf()
    {
        return this._self_user && (this._self_user.id == this._user.id)
    }
    get isLogin()
    {
        return this._self_user&&true
    }
    get isCreator()
    {
        return this._self_user&&(this._self_user.role_group==ERoleGroup.Creator)
    }
    get isAdmin()
    {
        return this._self_user&&(this._self_user.role_group==ERoleGroup.Admin||this._self_user.role_group==ERoleGroup.Creator)
    }
    get isProxy()
    {
        return this._self_user&&(this._self_user.role_group==ERoleGroup.Proxy)
    }
    get isCommon()
    {
        return this._self_user&&(this._self_user.role_group==ERoleGroup.Common)
    }
    async init()
    {
        this._userser=gMongoServiceMgr.getService<MongoUserService<any>>("user")
        this._engine.cfg.session_type=this._engine.cfg.session_type||ESessionType.Cache
        this._session_id = this._request.getCookie(this._user_session_id)||this._request.params.session_id||this._request.postData.session_id
        let userId = -1
        if (this._session_id)
        {
            let user = await this._getUserBySession(this._session_id)
            if (!user)
            {
                this._update_session()
                //Session不存在清除客户端cookie
                this._response.clearCookie(this._user_session_id)
            }
            else
            {
                this._login(user)
                userId = user.id
            }
        }
        let params = this._request.params
        if (params.userId && params.userId!=userId+"")
        {
            this._user = <T>(await this._userser.getById(params.userId))
        }
        else
        {
            //不是别人的信息就查看自己的
            this._user = this._self_user
        }
    }
    protected async _getUserBySession(session:string)
    {
        let user:T= null
        if(!session)
        {
            return user
        }
        //每次强制从cache中先找，提高效率
        //if(this._engine.cfg.session_type==ESessionType.Cache)
        {
            user= gCacheTool.get(this._session_id)
        }
        if(user)
        {
            return user
        }
        if(this._engine.cfg.session_type==ESessionType.Redis)
        {
            let user_id = parseInt((await gRedisMgr.redis.get(this._session_id))||"-1")
            if(user_id>0)
            {
                user = <T>(await this._userser.getById(user_id))
            }
        }
        else if(this._engine.cfg.session_type==ESessionType.Mongo)
        {
            let user_id = (await gMongoCacheSer.getData(this._session_id))||-1
            if(user_id>0)
            {
                user = <T>(await this._userser.getById(user_id))
            }
        }
        if(user)
        {
            this._login(user)
        }
        return user
    }
    protected _logout()
    {
        if(this._session_id)
        {
            if(this._engine.cfg.session_type==ESessionType.Cache)
            {
                gCacheTool.remove(this._session_id)
            }
            else if(this._engine.cfg.session_type==ESessionType.Redis)
            {
                gRedisMgr.redis.del(this._session_id)
            }
            else if(this._engine.cfg.session_type==ESessionType.Mongo)
            {
                gMongoCacheSer.deleteOne({key:this._session_id})
            }
            this._session_id = null
        }
        this._response.clearCookie(this._user_session_id)
    }
    protected _login(user:T)
    {
        if(!user)
        {
            return;
        }
        if(!this._session_id)
        {
            this._session_id = Math.random().toString(36).substring(2)+user.id
        }
        let time = 0
        if(this._request.postData.remember=="on")
        {
            time = this._engine.cfg.cookie.expires.account_remember
        }
        else
        {
            time = this._engine.cfg.cookie.expires.account
        }
        this._response.setCookie(this._user_session_id,this._session_id,time)

        //if(this._engine.cfg.session_type==ESessionType.Cache)
        {
            if(time>24*60*60)
            {
                gCacheTool.add(this._session_id,user,24*60*60*1000)
            }
            else
            {
                gCacheTool.add(this._session_id,user,time*1000)
            }
        }
        if(this._engine.cfg.session_type==ESessionType.Redis)
        {
            gRedisMgr.redis.set(this._session_id,user.id).then(()=>
            {
                gRedisMgr.redis.expire(this._session_id,time)
            })
        }
        else if(this._engine.cfg.session_type==ESessionType.Mongo)
        {
            let cm = new MongoCacheModel()
            cm.key=this._session_id
            cm.data=user.id
            cm.expireAt=Date.now()+time*1000
            gMongoCacheSer.updateOne({key:cm.key},cm,true)
        }
        this._self_user = user
    }
    /**
     * 已经被启用
     */
    protected async _update_session()
    {

    }
    async update_user(user_id:number)
    {
        let user = <T>(await this._userser.getById(user_id))
        if(this._user&&this._user.id==user.id)
        {
            this._user = user
        }
        if(this._self_user&&this._self_user.id==user.id)
        {
            this._login(user)
        }
    }
    //填充每个页面需要的通用数据
    protected _init_data(datas)
    {
        let data = super._init_data(datas)
        data.model.isLogin = this.isLogin
        data.model.user = this._user
        data.model.selfUser = this._self_user
        data.model.isSelf = this.isSelf
        return data
    }
}