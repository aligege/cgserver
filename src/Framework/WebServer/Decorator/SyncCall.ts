import { GSyncQueueTool } from "../../Logic/SyncQueueTool"
/**
 * 异步函数变为同步函数，当前进程有效
 * @param target 
 * @param propertyName 
 * @param descriptor 
 */
export function SyncCall(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
{
    let method = descriptor.value
    descriptor.value = function () 
    {
        let self=this
        let ret = GSyncQueueTool.add(method.name,async ()=>
        {
            return await method.apply(self, arguments)
        })
        return ret
    }
}