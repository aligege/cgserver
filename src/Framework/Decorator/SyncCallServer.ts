import { core } from "../Core/Core"
import { gSyncQueueTool } from "../Logic/SyncQueueTool"
import { gMongoCacheSer } from "../Service/MongoCacheService"

/**
 * 异步函数变为同步函数
 * 服务器间的异步，效率低
 * 只支持mongo模式
 * @returns 
 */
export function SyncCallServer(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
{
    let method = descriptor.value
    descriptor.value = async ()=>
    {
        let key = "sync_"+method.name
        let func = async ()=>
        {
            let item = await gMongoCacheSer.getData(key)
            let ret = null
            while(item)
            {
                await core.sleep(200)
                item = await gMongoCacheSer.getData(key)
            }
            //10秒后过期，避免卡死
            let mcm = await gMongoCacheSer.addData(key,true,Date.now()+10*1000)
            if(!mcm)
            {
                await func()
            }
            return
        }
        await func()
        let ret = gSyncQueueTool.add(method.name,async ()=>
        {
            return await method.apply(self, arguments)
        })
        await gMongoCacheSer.deleteOne({key})
        return ret
    }
}
/**
 * 异步函数变为同步函数
 * 服务器间的异步，效率低
 * 只支持mongo模式
 * @returns 
 */
export let SyncCallServer2=function(params_index?:number)
{
    return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
    {
        let method = descriptor.value
        descriptor.value = async ()=>
        {
            let key = "sync_"+method.name
            if(params_index != undefined&&params_index<arguments.length)
            {
                key = key+"_"+arguments[params_index]
            }
            let func = async ()=>
            {
                let item = await gMongoCacheSer.getData(key)
                let ret = null
                while(item)
                {
                    await core.sleep(200)
                    item = await gMongoCacheSer.getData(key)
                }
                //10秒后过期，避免卡死
                let mcm = await gMongoCacheSer.addData(key,true,Date.now()+10*1000)
                if(!mcm)
                {
                    await func()
                }
                return
            }
            await func()
            let ret = gSyncQueueTool.add(method.name,async ()=>
            {
                return await method.apply(self, arguments)
            })
            await gMongoCacheSer.deleteOne({key})
            return ret
        }
    }
}