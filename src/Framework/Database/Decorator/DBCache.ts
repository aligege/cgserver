import * as fs from "fs";
import { gLog } from "../../Logic/Log";

export class VersionModel
{
    table:string=""
    version:number=0
    /**
     * 创建时间
     */
    create_time:number=0

    /**
     * 创建时间
     */
    update_time:number=0
}

export class DBCache
{
    protected _versions:{[table_name:string]:VersionModel}={}
    protected _path=__dirname+"/tmp_table_version.json"
    async init()
    {
        gLog.warn("mysql auto 功能建议只使用在开发环境中，因为会导致数据丢失，数据表重建")
        if(fs.existsSync(this._path))
        {
            try{
                let table=fs.readFileSync(this._path)
                this._versions=JSON.parse(table.toString()) as any
            }
            catch(e)
            {
                gLog.info("error:"+this._path)
                process.exit()
            }
        }
        else
        {
            this._versions={}
            fs.writeFileSync(this._path,JSON.stringify(this._versions))
        }
    }
    async setVersion(table:string,version:number)
    {
        let vm:VersionModel = this._versions[table]
        if(!vm)
        {
            vm = new VersionModel()
            vm.table=table
            vm.version=version
            vm.create_time=Date.now()
            vm.update_time=Date.now()
            this._versions[table]=vm
            fs.writeFileSync(this._path,JSON.stringify(this._versions))
        }
        else if(vm.version!=version)
        {
            vm.version=version
            vm.update_time=Date.now()
            fs.writeFileSync(this._path,JSON.stringify(this._versions))
        }
    }
    getVersion(table:string)
    {
        let vm:VersionModel = this._versions[table]
        if(!vm)
        {
            return -1
        }
        return vm.version
    }
}
export let gDbCache=new DBCache()