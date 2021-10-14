import { Property, EPropertyType, TableProperty } from "./Property"

export function Type(type:string,def?:any,len?:number) 
{
    return function (target: any, propertyName: string) 
    {
        let table:TableProperty=target[TableProperty.key]=target[TableProperty.key]||new TableProperty()
        table.items[propertyName]=table.items[propertyName]||new Property()
        let pt:Property = table.items[propertyName]
        pt.type=type
        if(def!=undefined)
        {
            pt.default=def
        }
        else
        {
            pt.default=EPropertyType.defs[type]
        }
        pt.type_len=len||pt.type_len
    }
}