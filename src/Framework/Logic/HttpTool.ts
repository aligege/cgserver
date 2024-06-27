import * as request from "request";
import * as qs from "querystring";
import { GLog } from "./Log";
import { core } from "../Core/Core";
import { parse, stringify } from 'lossless-json'

export let GHttpTool:HttpTool=null
class HttpTool
{
    get(options_url:request.OptionsWithUrl|string)
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
        return new Promise<{error,response,body}>((resolve,reject)=>
        {
            request.get(options, (error, response, body)=> 
            {
                let bd=body
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
                    try{body=qs.parse(body)}catch(e){body=bd}
                }
                resolve({error, response, body})
            })
        })
    }
    post(options_url:request.OptionsWithUrl|string)
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
        return new Promise<{error,response,body}>((resolve,reject)=>
        {
            request.post(options, (error, response, body)=>
            {
                let bd=body
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
                    try{body=qs.parse(body)}catch(e){body=bd}
                }
                resolve({error, response, body})
            })
        })
    }
}
GHttpTool = new HttpTool()