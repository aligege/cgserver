import * as request from "request";
import * as qs from "querystring";
import { GLog } from "./Log";
import { core } from "../Core/Core";
import { parse, stringify } from 'lossless-json'

export let GHttpTool:HttpTool=null
class HttpTool
{
    get(options_url:request.OptionsWithUrl|string):Promise<{error,response,body,originbody}>
    {
        let options:request.OptionsWithUrl=null
        if(core.isString(options_url))
        {
            options={url:options_url as string}
        }
        else
        {
            options=options_url as request.OptionsWithUrl
        }
        return new Promise((resolve,reject)=>
        {
            request.get(options, (error, response, body)=> 
            {
                let originbody=body
                if(error)
                {
                    GLog.error("get:"+options.url)
                    GLog.error(error)
                }
                try
                {
                    if(core.isString(body))
                    {
                        body = parse(body)
                    }
                }
                catch(e)
                {
                    try{body=qs.parse(body)}catch(e){body=originbody}
                }
                resolve({error, response, body, originbody})
            })
        })
    }
    post(options_url:request.OptionsWithUrl|string):Promise<{error,response,body,originbody}>
    {
        let options:request.OptionsWithUrl=null
        if(core.isString(options_url))
        {
            options={url:options_url as string}
        }
        else
        {
            options=options_url as request.OptionsWithUrl
        }
        return new Promise((resolve,reject)=>
        {
            request.post(options, (error, response, body)=>
            {
                let originbody=body
                if(error)
                {
                    GLog.error("post:"+options.url)
                    GLog.error(error)
                }
                try
                {
                    if(core.isString(body))
                    {
                        body = parse(body)
                    }
                }
                catch(e)
                {
                    try{body=qs.parse(body)}catch(e){body=originbody}
                }
                resolve({error, response, body, originbody})
            })
        })
    }
}
GHttpTool = new HttpTool()