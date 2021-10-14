import * as _ from "underscore";

export let GCacheTool:CacheTool = null
class CacheItem
{
    key:string = ""
    value:any=null
    milliseconds:number=0
    expire_time=-1
}
class CacheTool
{
    protected _items=new Map<string,CacheItem>()
    constructor()
    {
        //一个小时清除一次过期缓存
        setInterval(this._refresh.bind(this),60*60*1000)
    }
    /**
     * 定时清除缓存
     */
    protected _refresh()
    {
        let time = new Date().getTime()
        let keys = _.clone(this._items.keys)
        for(let i in keys)
        {
            let key = keys[i]
            let item = this._items[key]
            if(!item)
            {
                delete this._items[key]
                continue
            }
            if(time>item.expire_time)
            {
                this.remove(key)
            }
        }
    }
    get(key,refresh?:boolean)
    {
        let item:CacheItem = this._items[key]
        if(!item)
        {
            return
        }
        let time = new Date().getTime()
        if(time>item.expire_time)
        {
            this.remove(key)
            return
        }
        if(refresh)
        {
            item.expire_time=time+item.milliseconds
        }
        return item.value
    }
    /**
     * 
     * @param key 
     * @param value 
     * @param time 缓存的毫秒数
     */
    add(key,value,milliseconds)
    {
        let item:CacheItem = this._items[key]
        if(!item)
        {
            item = new CacheItem()
            item.key = key
            this._items[key] = item
        }
        item.value = value
        item.milliseconds = milliseconds
        item.expire_time = new Date().getTime()+milliseconds
    }
    remove(key)
    {
        this._items[key] = null
        delete this._items[key]
    }
}
GCacheTool = new CacheTool()