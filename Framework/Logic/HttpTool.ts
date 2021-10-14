import * as request from "request";
import * as qs from "querystring";
import { GLog } from "./Log";

export let GHttpTool:HttpTool=null
class HttpTool
{
    httpRequest(url:string,noParse?:boolean)
    {
        return new Promise<{error,response,body}>((resolve,reject)=>
        {
            request.get(url,{
                strictSSL:false,
                rejectUnauthorized:false
            }, (error, response, body)=> 
            {
                if(!noParse)
                {
                    try
                    {
                        if(body)
                        {
                            body = JSON.parse(body)
                        }
                    }
                    catch(e)
                    {
                        try{body=qs.parse(body)}catch(e){}
                    }
                }
                resolve({error,response,body})
            })
        })
    }
    httpPost(url,form)
    {
        return new Promise<{error,response,body}>((resolve,reject)=>
        {
            request.post({url:url, form: form}, (error, response, body)=>
            {
                let bd=body
                if(error)
                {
                    GLog.error("post:"+url)
                    GLog.error(error)
                }
                try
                {
                    if(body)
                    {
                        body = JSON.parse(body)
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