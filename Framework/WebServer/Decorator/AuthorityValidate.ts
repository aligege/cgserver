import { ERoleGroup } from "../../Service/ini"

export let AuthorityValidate=function(rg?:ERoleGroup,ctr_name?:string)
{
    ctr_name=ctr_name||"Wechat"
    return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) 
    {
        let method = descriptor.value
        descriptor.value = function () 
        {
            let self=this
            if(!self.isLogin)
            {
                self.redirect(null,ctr_name)
                return
            }
            if(rg&&self.selfUser.role_group!=rg)
            {
                self.redirect(null,ctr_name)//权限不足
                return
            }
            return method.apply(this, arguments)
        }
    }
}