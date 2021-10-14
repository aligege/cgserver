export function CreatorValidate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
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
        if(!self.isCreator)
        {
            self.showText("需要创始人权限")
            return
        }
        return method.apply(this, arguments)
    }
}