import { IProtoFilter } from './IProtoFilter';
import { core } from '../../Core/Core';
import { GLog } from '../../Logic/Log';
export class JsonProtoFilter implements IProtoFilter
{
    init(path?:string)
    {
        return true
    }
    encode(data)
    {
        if(!core.isString(data))
        {
            data = JSON.stringify(data) 
        }
        return data
    }
    decode(data)
    {
        try
        {
            if(core.isString(data))
            {
                data = JSON.parse(data)
            }
        }
        catch(e)
        {
            GLog.error("decode json data Failed-----data="+data)
            return
        }
        return data
    }
}
