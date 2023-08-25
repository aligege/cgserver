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

/**
 * 异步函数变为同步函数，当前进程有效
 * @param param_index 动态参数的索引
 */
export function SyncCall2(param_index?:number)
{
    return (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>)=>
    {
        let method = descriptor.value
        descriptor.value = function () 
        {
            let key = propertyName
            if(param_index != undefined&&param_index<arguments.length)
            {
                key = propertyName + "_" + arguments[param_index]
            }
            let ret = GSyncQueueTool.add(key,async ()=>
            {
                return await method.apply(target, arguments)
            })
            return ret
        }
    }
}