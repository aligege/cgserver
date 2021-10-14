import * as fs from "fs";
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
        let path = "Data/"+this._file_name+"_"+this._suffix+".json"
        if(!fs.existsSync(path))
        {
            console.error(path+" not exist!")
            path = "Data/"+this._file_name+".json"
            console.error("try path:"+path)
            if(!fs.existsSync(path))
            {
                console.error(path+" not exist!")
                return true
            }
        }
        let content = fs.readFileSync(path).toString()
        let jsonData = JSON.parse(content)
        for(let key in jsonData)
        {
            this[key] = jsonData[key]
        }
        return true
    }
}