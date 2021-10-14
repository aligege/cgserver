import { TableProperty } from "./Property"

export function Table(table_name:string,version:number,comment?:string,charset?:string,auto_increment?:number) {
    return function(constructor: Function)
    {
        let table:TableProperty = constructor.prototype[TableProperty.key]=constructor.prototype[TableProperty.key]||new TableProperty()
        table.table=table_name
        table.version=version
        table.comment=comment||table.comment
        table.charset=charset||table.charset
        table.auto_increment=auto_increment||table.auto_increment
    }
}