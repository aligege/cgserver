import { ERoleGroup } from "../Service/ini"

export let JsonAuthorityValidate=function(rg?:ERoleGroup)
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
            if(rg&&self.selfUser.role_group!=rg)
            {
                self.showJson({errcode:{id:2,des:"权限不足"},err:"权限不足"})
                return
            }
            return method.apply(this, arguments)
        }
    }
}