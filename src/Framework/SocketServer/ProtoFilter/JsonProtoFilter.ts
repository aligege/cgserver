import { IProtoFilter } from './IProtoFilter';
import { core } from '../../Core/Core';
import { GLog } from '../../Logic/Log';
import { parse, stringify } from 'lossless-json'

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
                data = parse(data)
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
