import { GoogleProtoFilter } from './GoogleProtoFilter';
import { JsonProtoFilter } from './JsonProtoFilter';
import { IProtoFilter } from './IProtoFilter';
import { EProtoType } from "./IProtoFilter";

export let GProtoFactory:ProtoFactory=null
class ProtoFactory
{
    protected _filters=new Map<EProtoType,IProtoFilter>()
    createFilter(type:EProtoType):IProtoFilter
    {
        let filter = this._filters.get(type)
        if(filter)
        {
            return filter
        }
        switch(type)
        {
            case EProtoType.GoogleProtoBuffer:
            {
                filter = new GoogleProtoFilter()
                break
            }
            default:
            {
                filter = new JsonProtoFilter()
                break
            }
        }
        this._filters.set(type,filter)
        return filter
    }
}
GProtoFactory=new ProtoFactory()