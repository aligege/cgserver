import * as EventEmitter from "events";
export class EventTool
{
    protected _event_emitter=new EventEmitter()
    constructor()
    {
        this._event_emitter.setMaxListeners(0)
    }
    on(event:string,func:(...args: any[]) => void)
    {
        this._event_emitter.on(event,func)
    }
    off(event:string,func:(...args: any[]) => void)
    {
        this._event_emitter.off(event,func)
    }
    once(event:string,func:(...args: any[]) => void)
    {
        this._event_emitter.once(event,func)
    }
    emit(event:string,...args: any[])
    {
        this._event_emitter.emit(event,...args)
    }
    listenerCount(event:string)
    {
        let count = this._event_emitter.listenerCount(event)||0
        return count
    }
}