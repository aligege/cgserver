import { gHttpTool } from "../Logic/HttpTool"

export class CgRankErrcode
{
    id=0
    des=""
}
export class CgRankRankItem
{
    id:string=""
    score:number=0
    rank:number=0
    other:{[key:string]:any}={}
}
export class CgRankRankData
{
    //每个榜都有一个关键词
    key:string=""
    //数据
    maps:{[id:string]:CgRankRankItem}={}
    //有序列表
    list:CgRankRankItem[]=[]
    timeout:number=-1
}
export class CgRankCommandItem
{
    id:string=""
    score:number=0
    inc:{[key:string]:number}={}
    set:{[key:string]:any}={}
}
export class CgRankTool
{
    protected _url=""
    protected _password=""
    init(url:string,password:string)
    {
        this._url=url
        this._password=password
        return true
    }
    async setTimeout(key:string,timeout:number)
    {
        let msg=
        {
            cmd:"setTimeout",
            key:key,
            timeout:timeout,
            password:this._password
        }
        await gHttpTool.post({url:this._url,data:msg})
        return
    }
    async getTimeout(key:string)
    {
        let msg=
        {
            cmd:"getTimeout",
            key:key,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {timeout:number}
    }
    /**
     * 
     * @param key 排行榜的关键字
     * @returns 
     */
    async removeRank(key:string):Promise<{errcode?:CgRankErrcode}>
    {
        let msg=
        {
            cmd:"removeRank",
            key:key,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body
    }
    async saveAllRank():Promise<{keys:string[]}>
    {
        let msg=
        {
            cmd:"saveAllRank",
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body
    }
    async getRankItem(key:string,id:string)
    {
        let msg=
        {
            cmd:"getRankItem",
            key:key,
            id:id,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {rank:CgRankRankItem}
    }
    async getRankItems(key:string,ids:string[])
    {
        let msg=
        {
            cmd:"getRankItems",
            key:key,
            ids:ids,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:{[id:string]:CgRankRankItem}}
    }
    /**
     * 
     * @param key 
     * @param start 
     * @param count 小于等于0表示全部
     */
    async getRankList(key:string,start:number,count:number)
    {
        let msg=
        {
            cmd:"getRankList",
            key:key,
            start:start,
            count:count,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:CgRankRankItem[]}
    }
    async getRankCount(key:string)
    {
        let msg=
        {
            cmd:"getRankCount",
            key:key,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {count:number}
    }
    async getRevRankList(key:string,start:number,count:number)
    {
        let msg=
        {
            cmd:"getRevRankList",
            key:key,
            start:start,
            count:count,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:CgRankRankItem[]}
    }
    async addToRank(key:string,id:string,score:number,other:any,isreplace=false)
    {
        let msg=
        {
            cmd:"addToRank",
            key:key,
            id:id,
            score:score,
            other:other,
            isreplace:isreplace,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {rank:CgRankRankItem}
    }
    async addsToRank(key:string,datas:{[id:string]:CgRankCommandItem},isreplace=false)
    {
        let msg=
        {
            cmd:"addsToRank",
            key:key,
            datas:datas,
            isreplace:isreplace,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:{[id:string]:CgRankRankItem}}
    }
    async removeFromRank(key:string,id:string)
    {
        let msg=
        {
            cmd:"removeFromRank",
            key:key,
            id:id,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {rank:CgRankRankItem}
    }
    async updateInRank(key:string,command:CgRankCommandItem)
    {
        let msg=
        {
            cmd:"updateInRank",
            key:key,
            command:command,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {rank:CgRankRankItem}
    }
    async updatesInRank(key:string,commands:{[id:string]:CgRankCommandItem})
    {
        let msg=
        {
            cmd:"updatesInRank",
            key:key,
            commands:commands,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:{[id:string]:CgRankRankItem}}
    }
    async executeCommand(key:string,commands:{[id:string]:CgRankCommandItem})
    {
        let msg=
        {
            cmd:"executeCommand",
            key:key,
            commands:commands,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {ranks:{[id:string]:CgRankRankItem}}
    }
    async anyCall(call:string,...args)
    {
        let msg=
        {
            cmd:call,
            args:args,
            password:this._password
        }
        let rs = await gHttpTool.post({url:this._url,data:msg})
        return rs.body as {result:any}
    }
}

export let gCgRankTool=new CgRankTool()