import * as fs from "fs";
import { jsonc } from "jsonc";

export class Config
{
    protected _is_init:boolean=false
    protected _file_name=""
    protected _suffix=""
    /**
     * 是否是debug调试模式，主要区别于读取数据档，debug默认读取file_d文件，release默认读取file_r文件，如果不存在都会读取file文件
     */
    static debug=false
    static rootDataDir="data/"
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
        let path = Config.rootDataDir+this._file_name
        if(this._suffix)
        {
            path+="_"+this._suffix+".json"
        }
        else
        {
            path+=".json"
        }
        path=path.toLowerCase()
        if(!fs.existsSync(path))
        {
            console.error(path+" not exist!")
            return false
        }
        
        let content = fs.readFileSync(path).toString()
        let jsonData = jsonc.parse(content)
        for(let key in jsonData)
        {
            this[key] = jsonData[key]
        }
        console.log("loaded cfg="+path)
        return true
    }
}