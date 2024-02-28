import { GLog } from '../Logic/Log';
import * as redis from 'redis';
export class RedisConfig
{
    open=false
    host="127.0.0.1"
    port=6379
    database=0
    password=null
}
type RedisClientType = redis.RedisClientType<redis.RedisDefaultModules&redis.RedisModules,redis.RedisFunctions,redis.RedisScripts>
export let GRedisMgr:RedisManager&RedisClientType = null
export class RedisManager
{
    protected _redis:RedisClientType = null
    get redis()
    {
        return this._redis
    }
    protected _redisCfg:{open:boolean}&redis.RedisClientOptions=null
    async init(redisCfg:{open:boolean}&redis.RedisClientOptions)
    {
        let p= new Promise((resolve)=>{
            if(!redisCfg||!redisCfg.open)
            {
                resolve(null)
                return
            }
            if(this._redis)
            {
                resolve(null)
                return
            }
            this._redisCfg=redisCfg
            GLog.info("begin connect redis="+JSON.stringify(redisCfg))
            this._redis = redis.createClient(redisCfg)
            this._redis.on("connect", ()=>
            {
                this.onConnect()
                resolve(null)
            })
            this._redis.on("end", this.onEnd.bind(this))
            this._redis.on("error", this.onError.bind(this))
        })
        let ret = await p
        for(let key in this._redis)
        {
            if(typeof this._redis[key] == "function")
            {
                this[key] = this._redis[key].bind(this._redis)
            }
        }
        return ret
    }
    onConnect()
    {
        GLog.info("redis has connected!")
    }
    onEnd()
    {
        this._redis = null
        this.init(this._redisCfg)//重连
    }
    onError(err)
    {
        GLog.info("Error connected="+this._redis+": "+ err)
    }
}
GRedisMgr = (new RedisManager()) as any