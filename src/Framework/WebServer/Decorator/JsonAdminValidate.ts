export function JsonAdminValidate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
{
    let method = descriptor.value
    descriptor.value = function () 
    {
        let self=this
        if(!self.isAdmin)
        {
            self.showJson({errcode:{id:1,des:"需要管理员或创始人权限"},err:"需要管理员或创始人权限"})
            return
        }
        return method.apply(this, arguments)
    }
}