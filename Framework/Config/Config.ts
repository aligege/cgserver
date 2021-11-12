import * as fs from "fs";
import { jsonc } from "jsonc";
export class Config
{
    protected _suffix:string=""
    protected _is_init:boolean=false
    protected _file_name=""
    constructor(filename)
    {
        this._file_name = filename
    }
    init()
    {
        if(this._is_init)
        {
            return false
        }
        let path = "data/"+this._file_name+"_"+this._suffix+".json"
        path=path.toLowerCase()
        if(!fs.existsSync(path))
        {
            console.error(path+" not exist!")
            path = "data/"+this._file_name+".json"
            path=path.toLowerCase()
            console.error("try path:"+path)
            if(!fs.existsSync(path))
            {
                console.error(path+" not exist!")
                return true
            }
        }
        let content = fs.readFileSync(path).toString()
        let jsonData = jsonc.parse(content)
        for(let key in jsonData)
        {
            this[key] = jsonData[key]
        }
        return true
    }
}