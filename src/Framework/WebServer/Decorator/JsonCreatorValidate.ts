export function JsonCreatorValidate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
{
    let method = descriptor.value
    descriptor.value = function () 
    {
        let self=this
        if(!self.isLogin)
        {
            self.showJson({errcode:{id:1,des:"请登陆后尝试"},err:"请登陆后尝试"})
            return
        }
        if(!self.isCreator)
        {
            self.showJson({errcode:{id:1,des:"需要创始人权限"},err:"需要创始人权限"})
            return
        }
        return method.apply(this, arguments)
    }
}