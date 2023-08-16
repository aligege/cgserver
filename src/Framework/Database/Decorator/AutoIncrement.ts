import { Property, TableProperty } from "./Property"

export function AutoIncrement(target: any, propertyName: string) 
{
    let table:TableProperty=target[TableProperty.key]=target[TableProperty.key]||new TableProperty()
    table.items[propertyName]=table.items[propertyName]||new Property()
    let pt:Property = table.items[propertyName]
    pt.auto_increment=true
}