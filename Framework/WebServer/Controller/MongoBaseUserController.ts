import { BaseController } from './BaseController';
import { GCacheTool } from '../../Logic/CacheTool';
import { ESessionType } from '../../Config/FrameworkConfig';
import { GRedisMgr } from '../../Database/RedisManager';
import { MongoCacheModel, GMongoCacheSer } from '../../Service/MongoCacheService';
import { GUserSer, UserModel } from '../../Service/MongoUserService';
import { ERoleGroup } from '../../Service/ini';
export class MongoBaseUserController<T extends UserModel> extends BaseController
{
    protected _user_session_id="user_session_id"
    protected _self_user:T=null
    protected _user:T=null//网页内容的所属，比如，查看别人的博客，那这个信息就是作者的
    protected _session_id:string=null
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
        this._engine.cfg.session_type=this._engine.cfg.session_type||ESessionType.Cache
        this._session_id = this._request.getCookie(this._user_session_id)||this._request.params.session_id||this._request.postData.session_id
        let userId = -1
        if (this._session_id)
        {
            let user:T= null
            if(this._engine.cfg.session_type==ESessionType.Cache)
            {
                user= GCacheTool.get(this._session_id)
            }
            else if(this._engine.cfg.session_type==ESessionType.Redis)
            {
                let user_id = parseInt((await GRedisMgr.get(this._session_id))||"-1")
                if(user_id>0)
                {
                    user = <T>(await GUserSer.getById(user_id))
                }
            }
            else if(this._engine.cfg.session_type==ESessionType.Mongo)
            {
                let user_id = (await GMongoCacheSer.getData(this._session_id))||-1
                if(user_id>0)
                {
                    user = <T>(await GUserSer.getById(user_id))
                }
            }
            if (!user)
            {
                this._update_session()
                //Session不存在清除客户端cookie
                this._response.clearCookie(this._user_session_id)
            }
            else
            {
                await this._login(user)
                userId = user.id
            }
        }
        let params = this._request.params
        if (params.userId && params.userId!=userId+"")
        {
            this._user = <T>(await GUserSer.getById(params.userId))
        }
        else
        {
            //不是别人的信息就查看自己的
            this._user = this._self_user
        }
    }
    protected _logout()
    {
        if(this._session_id)
        {
            if(this._engine.cfg.session_type==ESessionType.Cache)
            {
                GCacheTool.remove(this._session_id)
            }
            else if(this._engine.cfg.session_type==ESessionType.Redis)
            {
                GRedisMgr.del(this._session_id)
            }
            else if(this._engine.cfg.session_type==ESessionType.Mongo)
            {
                GMongoCacheSer.deleteOne({key:this._session_id})
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
            this._session_id = Math.random().toString(36).substr(2)+user.id
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

        if(this._engine.cfg.session_type==ESessionType.Cache)
        {
            GCacheTool.add(this._session_id,user,time*1000)
        }
        else if(this._engine.cfg.session_type==ESessionType.Redis)
        {
            GRedisMgr.set(this._session_id,user.id).then(()=>
            {
                GRedisMgr.expire(this._session_id,time)
            })
        }
        else if(this._engine.cfg.session_type==ESessionType.Mongo)
        {
            let cm = new MongoCacheModel()
            cm.key=this._session_id
            cm.data=user.id
            cm.expireAt=Date.now()+time*1000
            GMongoCacheSer.updateOne(cm,{key:cm.key},true)
        }
        this._self_user = user
    }
    /**
     * 用户信息发生更改，同步更新session里面的用户信息
     */
    protected async _update_session()
    {
        if(!this._session_id)
        {
            return
        }
        let user_id=-1
        let um:T = null
        if(this._engine.cfg.session_type==ESessionType.Cache)
        {
            um = GCacheTool.get(this._session_id)
            if(um)
            {
                user_id=um.id
            }
        }
        else if(this._engine.cfg.session_type==ESessionType.Redis)
        {
            user_id = parseInt((await GRedisMgr.get(this._session_id))||"-1")
        }
        if(user_id<0)
        {
            this._session_id = null
            return
        }
        um=<T>(await GUserSer.getById(user_id))
        this._login(um)
    }
    async update_user(user_id:number)
    {
        let user = <T>(await GUserSer.getById(user_id))
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