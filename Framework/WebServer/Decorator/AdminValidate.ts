export function AdminValidate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
{
    let method = descriptor.value
    descriptor.value = function () 
    {
        let self=this
        if(!self.isLogin)
        {
            self.redirect(null,"Login")
            return
        }
        if(!self.isAdmin)
        {
            self.showText("需要管理员权限")
            return
        }
        return method.apply(this, arguments)
    }
}