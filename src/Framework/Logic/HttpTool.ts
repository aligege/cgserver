import * as request from "request";
import * as qs from "querystring";
import { core } from "../Core/Core";
import { gLog } from "./Log";

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
            gLog.info("prepare get:"+options.url)
        }
        return new Promise((resolve,reject)=>
        {
            request.get(options, (error, response, body)=> 
            {
                let originbody=body
                if(error)
                {
                    gLog.error("get:"+options.url)
                    gLog.error(error)
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
                    gLog.info({
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
            gLog.info("prepare post:"+options.url)
            gLog.info("prepare post data:"+JSON.stringify(options.json||options.body||options.formData||options.form||options.qs))
        }
        return new Promise((resolve,reject)=>
        {
            request.post(options, (error, response, body)=>
            {
                let originbody=body
                if(error)
                {
                    gLog.error("post:"+options.url)
                    gLog.error(error)
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
                    gLog.info({
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

export let gHttpTool = new HttpTool()