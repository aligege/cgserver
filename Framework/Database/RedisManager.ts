import { GFCfg } from '../Config/FrameworkConfig';
import { GLog } from '../Logic/Log';
import * as redis from 'redis';

export let GRedisMgr:RedisManager = null
export class RedisManager
{
    protected _redis:redis.RedisClient = null
    get redis()
    {
        return this._redis
    }
    protected _resis_init_succ:boolean=false
    protected _redisCfg:{open:boolean,
        host:string,
        port:number,
        database:number,
        password:string}=null
    constructor()
    {

    }
    async init(redisCfg:{open:boolean,
        host:string,
        port:number,
        database:number,
        password:string})
    {
        return new Promise((resolve)=>{
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
            GLog.info("begin conect redis="+JSON.stringify(redisCfg),true)
            this._redis = redis.createClient(redisCfg.port, redisCfg.host, { parser: "javascript", return_buffers: false, connect_timeout: 3000,password:redisCfg.password })
            this._redis.on("connect", ()=>
            {
                this.onConnect()
                resolve(null)
            })
            this._redis.on("end", this.onEnd.bind(this))
            var tmp_redis = this._redis
            this._redis.on("error", this.onError.bind(this))
        })
    }
    onConnect()
    {
        this._redis.select(GFCfg.db.redis.database||0)
        this._resis_init_succ = true
        GLog.info("redis has connected!",true)
    }
    onEnd()
    {
        this._resis_init_succ = false
        this._redis = null
        this.init(this._redisCfg)//重连
    }
    onError(err)
    {
        GLog.info("Error connected="+this._redis.connected+": "+ err,true)
        // this._redis=null
        // this.init()
    }
    expire(key,seconds)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.expire(key,seconds,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    incr(key)
    {
        return new Promise<number>((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.incr(key,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    set(key, value)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.set(key, value,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    get(key):Promise<string>
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.get(key,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    /**
     * 
     * @param key 
     * @param cb 有表示异步
     */
    del(key,cb?)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.del(key,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    hset(h, key, value)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.hset(h, key, value,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    hget(h, key)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.hget(h, key,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    hdel(key,sub_key)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.hdel(key,sub_key,(err, reply)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(reply)
            })
        })
    }
    /**
     * hash值，能转换位整数的就自动转换为整数
     * @param h key
     */
    hgetall(h):Promise<{ [key: string]: any }>
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.hgetall(h,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                    resolve(replys)
                    return
                }
                let value={}
                for(let k in replys)
                {
                    let v = replys[k]
                    let iv=parseInt(v)
                    if(v==""+iv)
                    {
                        value[k] = iv
                    }
                    else
                    {
                        value[k]=v
                    }
                }
                if(!replys)
                {
                    value=null
                }
                resolve(value)
            })
        })
    }
    /**
     * 
     * @param h 
     * @param array 
     */
    hmset(h,array)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.hmset(h, array,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    lpush(key,array)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.lpush(key, array,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    lrange(key:string,start?:number,end?:number)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            if(!this._redis)
            {
                return null
            }
            if(!start)
            {
                start = 0
            }
            if(!end)
            {
                end = -1
            }
            this._redis.lrange(key, start, end,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    ltrim(key:string,start:number,end?:number)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            if(!this._redis)
            {
                return null
            }
            if(!start)
            {
                start = 0
            }
            if(!end)
            {
                end = -1
            }
            this._redis.ltrim(key, start, end,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    sadd(key,array)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.sadd(key, array,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    smembers(key)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.smembers(key,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    srem(key,array)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.srem(key,array,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    keys(key)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.keys(key,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    multi()
    {
        if(!this._redis)
        {
            return null
        }
        return this._redis.multi()
    }
    exists(key:string)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.exists(key,(err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    exec(multi:redis.Multi):Promise<Array<any>>
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis||!multi)
            {
                resolve(null)
                return
            }
            multi.exec((err, replys)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(replys)
            })
        })
    }
    publish(channel:string,value:string)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.publish(channel,value,(err,num)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(num)
            })
        })
    }
    subscribe(channel:string)
    {
        return new Promise((resolve,reject)=>
        {
            if(!this._redis)
            {
                resolve(null)
                return
            }
            this._redis.subscribe(channel,(err,msg)=>
            {
                if(err)
                {
                    GLog.error(err)
                }
                resolve(msg)
            })
        })
    }
    on(message:string,cb:any)
    {
        if(!this._redis)
        {
            return
        }
        this._redis.on(message,cb)
    }
}
GRedisMgr = new RedisManager()