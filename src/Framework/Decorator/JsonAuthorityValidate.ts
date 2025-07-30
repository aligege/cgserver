export let JsonAuthorityValidate=function()
{
    return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
    {
        let method = descriptor.value
        descriptor.value = function () 
        {
            let self=this
            if(!self.isLogin)
            {
                self.showJson({errcode:{id:1,des:"未登陆"},err:"未登陆"})
            }
            return method.apply(this, arguments)
        }
    }
}