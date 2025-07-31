import { gLog } from "../Logic/Log"

export let MongoActionCheck=function(ret=null)
{
    return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
    {
        let method = descriptor.value
        descriptor.value = function () 
        {
            let self=this
            try
            {
                let start_time = Date.now()
                ret = method.apply(this, arguments)
                let dt = Date.now() - start_time
                self.debug && gLog.info({ key: method.name, dt, arguments })
                return ret
            }
            catch (error)
            {
                gLog.error("MongoDB action error:", error);
                gLog.error(arguments);
                return ret
            }
        }
    }
}