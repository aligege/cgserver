import { gLog } from "../Logic/Log"

export let MongoActionCheck=function(ret=null)
{
    return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
    {
        let method = descriptor.value
        descriptor.value = async function () 
        {
            let start_time = Date.now()
            let self=this
            try
            {
                ret = await method.apply(this, arguments)
                let dt = Date.now() - start_time
                let collection = "unknown"
                if(arguments && arguments[0] && arguments[0].modelName)
                {
                    collection = arguments[0].modelName
                }
                self.debug && gLog.info({ dt, collection, action: method.name, arguments, dbName: self.dbName })
                return ret
            }
            catch (error)
            {
                gLog.error("MongoDB action error:", error);
                let collection = "unknown"
                if(arguments && arguments[0] && arguments[0].modelName)
                {
                    collection = arguments[0].modelName
                }
                let dt = Date.now() - start_time
                self.debug && gLog.info({ dt, collection, action: method.name, arguments, dbName: self.dbName })
                return ret
            }
        }
    }
}