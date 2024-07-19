import * as request from "request";
import * as qs from "querystring";
import { core } from "../Core/Core";
import { global } from "../global";

export class HttpTool
{
    protected _debug=false
    get debug()
    {
        return this._debug
    }
    set debug(value)
    {
        this._debug=value
    }


    get(options_url:request.OptionsWithUrl|string):Promise<{error,response,body,originbody}>
    {
        let time=Date.now()
        let options:request.OptionsWithUrl=null
        if(core.isString(options_url))
        {
            options={url:options_url as string}
        }
        else
        {
            options=options_url as request.OptionsWithUrl
        }
        if(this._debug)
        {
            global.gLog.info("prepare get:"+options.url)
        }
        return new Promise((resolve,reject)=>
        {
            request.get(options, (error, response, body)=> 
            {
                let originbody=body
                if(error)
                {
                    global.gLog.error("get:"+options.url)
                    global.gLog.error(error)
                }
                try
                {
                    if(core.isString(body))
                    {
                        body = JSON.parse(body)
                    }
                }
                catch(e)
                {
                    try{body=qs.parse(body)}catch(e){body=originbody}
                }
                if(this._debug)
                {
                    global.gLog.info({
                        dttime:(Date.now()-time)+"ms",
                        url:options.url,
                        originbody:originbody
                    })
                }
                resolve({error, response, body, originbody})
            })
        })
    }
    post(options_url:request.OptionsWithUrl|string):Promise<{error,response,body,originbody}>
    {
        let time=Date.now()
        let options:request.OptionsWithUrl=null
        if(core.isString(options_url))
        {
            options={url:options_url as string}
        }
        else
        {
            options=options_url as request.OptionsWithUrl
        }
        if(this._debug)
        {
            global.gLog.info("prepare post:"+options.url)
        }
        return new Promise((resolve,reject)=>
        {
            request.post(options, (error, response, body)=>
            {
                let originbody=body
                if(error)
                {
                    global.gLog.error("post:"+options.url)
                    global.gLog.error(error)
                }
                try
                {
                    if(core.isString(body))
                    {
                        body = JSON.parse(body)
                    }
                }
                catch(e)
                {
                    try{body=qs.parse(body)}catch(e){body=originbody}
                }
                if(this._debug)
                {
                    global.gLog.info({
                        dttime:(Date.now()-time)+"ms",
                        url:options.url,
                        originbody:originbody
                    })
                }
                resolve({error, response, body, originbody})
            })
        })
    }
}