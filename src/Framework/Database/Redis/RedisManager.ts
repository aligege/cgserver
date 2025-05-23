﻿import * as redis from 'redis';
import { gLog } from '../../Logic/Log';

type RedisClientType = redis.RedisClientType<redis.RedisDefaultModules&redis.RedisModules,redis.RedisFunctions,redis.RedisScripts>
export type RedisConfig = {open:boolean}&redis.RedisClientOptions
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
        if(!redisCfg||!redisCfg.open)
        {
            return
        }
        let p= new Promise((resolve)=>{
            if(this._redis)
            {
                resolve(null)
                return
            }
            this._redisCfg=redisCfg
            gLog.info("begin connect redis="+JSON.stringify(redisCfg))
            this._redis = redis.createClient(redisCfg)
            this._redis.on("connect", ()=>
            {
                this.onConnect()
                resolve(null)
            })
            this._redis.on("end", this.onEnd.bind(this))
            this._redis.on("error", this.onError.bind(this))
            this._redis.connect()
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
        gLog.info("redis has connected!")
    }
    onEnd()
    {
        this._redis = null
        this.init(this._redisCfg)//重连
    }
    onError(err)
    {
        gLog.info("Error connected="+this._redis+": "+ err)
    }
}

export let gRedisMgr=new RedisManager()