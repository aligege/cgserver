import { GoogleProtoFilter } from './GoogleProtoFilter';
import { JsonProtoFilter } from './JsonProtoFilter';
import { IProtoFilter } from './IProtoFilter';
import { EProtoType } from "./IProtoFilter";

export let GProtoFactory:ProtoFactory=null
type ProtoFilterClass = new()=>IProtoFilter
class ProtoFactory
{
    protected _filters=new Map<EProtoType,IProtoFilter>()
    protected _type_filter_classes=new Map<EProtoType,ProtoFilterClass>()
    constructor()
    {
        this.registerFilter(EProtoType.Json,JsonProtoFilter)
        this.registerFilter(EProtoType.GoogleProtoBuffer,GoogleProtoFilter)
    }
    registerFilter(type:EProtoType,proto_filter_class:ProtoFilterClass)
    {
        this._type_filter_classes[type]=proto_filter_class
    }
    createFilter(type:EProtoType):IProtoFilter
    {
        let filter = this._filters.get(type)
        if(filter)
        {
            return filter
        }
        let proto_class = this._type_filter_classes[type]
        if(proto_class)
        {
            filter=new proto_class()
        }
        else
        {
            //默认
            filter=new JsonProtoFilter()
        }
        this._filters.set(type,filter)
        return filter
    }
}
GProtoFactory=new ProtoFactory()