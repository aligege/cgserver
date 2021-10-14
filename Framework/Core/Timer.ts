import { core } from './Core';
import { GLog } from '../Logic/Log';
export class Timer
{
    protected _deadline:number = -1
    get deadline()
    {
        return this._deadline
    }
    protected _handler = null
    get handler()
    {
        return this._handler
    }
    get isRunning()
    {
        if(this._handler)
        {
            return true
        }
        return false
    }
    protected _call_back:Function = null
    protected _left_time:number = -1
    protected _is_interval:boolean=false
    constructor()
    {

    }
    setTimeout(handler: any, timeout?: any, ...args: any[])
    {
        this._call_back = handler
        this.clear()
        if(timeout==undefined)
        {
            timeout = 30000
        }
        this._deadline = Date.now() +　timeout
        this._handler = setTimeout(()=>
        {
            this._deadline = -1
            this._handler = null
            this._left_time = -1
            try
            {
                this._call_back()
            }
            catch(e)
            {
                if(e&&e.stack)
                {
                    GLog.error(e.stack)
                }
                else
                {   
                    GLog.error(e)
                }
            }
        }, timeout, ...args)
    }
    setInterval(handler: any, timeout?: any, ...args: any[])
    {
        this._call_back = handler
        this.clear()
        this._is_interval=true
        if(timeout==undefined)
        {
            timeout = 30000
        }
        this._deadline = -1
        this._left_time=timeout
        this._handler = setInterval(()=>
        {
            try
            {
                this._call_back()
            }
            catch(e)
            {
                if(e&&e.stack)
                {
                    GLog.error(e.stack)
                }
                else
                {   
                    GLog.error(e)
                }
            }
        }, timeout, ...args)
    }
    pause()
    {
        if(this._handler)
        {
            if(!this._is_interval)
            {
                this._left_time = this._deadline - Date.now()
                clearTimeout(this._handler)
            }
            else
            {
                clearInterval(this._handler)
            }
            this._deadline = -1
            this._handler = null
        }
    }
    resume()
    {
        if(this._left_time>0)
        {
            if(!this._is_interval)
            {
                this._deadline = Date.now() + this._left_time
                this._handler = setTimeout(()=>
                {
                    this._call_back()
                    this._deadline = -1
                    this._handler = null
                    this._left_time = -1
                }, this._left_time)
            }
            else
            {
                this.setInterval(this._call_back,this._left_time)
            }
        }
    }
    clear()
    {
        if(this._handler)
        {
            if(!this._is_interval)
            {
                clearTimeout(this._handler)
            }
            else
            {
                clearInterval(this._handler)
            }
        }
        this._deadline = -1
        this._handler = null
        this._left_time = -1
        this._is_interval=false
    }
}