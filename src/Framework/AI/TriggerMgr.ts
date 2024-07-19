import { Point } from './Point';
import { Entity } from './Entity';
import { AiObject } from './AiObject';
import { core } from "../Core/Core";
import { Rect } from './Astar';
import { global } from '../global';

export enum ETriggerType{
    Region=0,
    Condition
}
export enum EConditionType{
    Die=0,
    Hit,
    HP,
    MP,
}
export class Trigger
{
    region:Rect=null
}
let _GTriggerCode = 0

export class TriggerManager
{
    protected _regionTriggers:{ triggerInfos: Array<{trigger:Trigger}>, objInfos: Array<{obj:Entity,prePos:Point}>, aiObj: AiObject }=null
    protected _conditionTriggers={}
    //触发器的单个个体必须包含x,y,width,height,其他参数为各自需要添加
    init()
    {
        this.clearAll();
    }
    clearAll()
    {
        this.clearRegionTrigger();
        this.clearConditionTrigger();
    }
    clear(triggertype)
    {
        if (triggertype===undefined)
        {
            this.clearAll();
        }
        else if (triggertype == ETriggerType.Region)
        {
            this.clearRegionTrigger();
        }
        else
        {
            this.clearConditionTrigger();
        }
    }




    ////////////////////////////////////////////区域触发器//////////////////////////////////////////////////////
    //objs 需要检查的对象，regions触发起区域，callBackObj回调的对象
    initRegionTrigger(objs, triggers, callBackObj?:AiObject)
    {
        this.clearRegionTrigger();
        if (!triggers || triggers.length <= 0)
        {
            return;
        }
        for (let i = 0, length = triggers.length; i < length; ++i)
        {
            this._regionTriggers.triggerInfos[i] = { trigger: triggers[i] };
        }
        if (core.isArray(objs))
        {
            for (let i = 0, length = objs.length; i < length; ++i)
            {
                this._regionTriggers.objInfos[i] = { obj: objs[i],prePos:null };
            }
        }
        else
        {
            this._regionTriggers.objInfos[0] = { obj: objs,prePos:null };
        }
        if (typeof callBackObj !== "undefined")
        {
            this._regionTriggers.aiObj = callBackObj;
        }
        this._checkRegion();//初始化check
    }
    clearRegionTrigger()
    {
        this._regionTriggers = { triggerInfos: [], objInfos: [], aiObj: null };
    }

    addObjToRegionTrigger(obj)
    {
        this._regionTriggers.objInfos[this._regionTriggers.objInfos.length] = { obj: obj,prePos:null };
    }

    removeObjInRegionTrigger(obj)
    {
        for (let i = 0; i < this._regionTriggers.objInfos.length; ++i)
        {
            let o = this._regionTriggers.objInfos[i].obj;
            if (o === obj)
            {
                this._regionTriggers.objInfos=this._regionTriggers.objInfos.splice(i,1);
                return;
            }
        }
    }

    //是否在触发器内
    protected _isInTrigger(pos, region)
    {
        if (!pos || typeof region === "undefined")
        {
            return false;
        }
        global.gLog.info("pos.x" + pos.x + "  pos.y=" + pos.y);
        global.gLog.info("region.x" + region.x + "  region.y=" + region.y);
        if (pos.x < (region.x - region.width / 2))
        {
            return false;
        }
        if (pos.x > (region.x + region.width / 2))
        {
            return false;
        }
        if (pos.y < (region.y - region.height / 2))
        {
            return false;
        }
        if (pos.y > (region.y + region.height / 2))
        {
            return false;
        }
        return true;
    }
    //外部需要调用改接口
    check()
    {
        this._checkRegion();
    }
    _checkRegion()
    {
        for (let i = 0, length = this._regionTriggers.objInfos.length; i < length; ++i)
        {
            let info = this._regionTriggers.objInfos[i];
            if (!info)
            {
                continue;
            }
            let obj = info.obj;
            if (!obj)
            {
                this.removeObjInRegionTrigger(obj);//改对象已经无效
                continue;
            }
            let pos = obj.cellPos;

            if (!info.prePos)
            {
                info.prePos = pos;
                for (let i = 0, length = this._regionTriggers.triggerInfos.length; i < length; ++i)
                {
                    let triggerInfo = this._regionTriggers.triggerInfos[i];
                    if (this._isInTrigger(pos, triggerInfo.trigger.region))
                    {
                        //原本在外面或首次检测，触发进入事件
                        if (triggerInfo[obj.id] && triggerInfo[obj.id] == -1)
                        {
                            this._triggerIn(obj, triggerInfo.trigger);
                            triggerInfo[obj.id] = 1;
                        }
                    }
                    else
                    {
                        //原本在里面或者首次检测，现在不在了，触发走出触发器事件
                        if (triggerInfo[obj.id] && triggerInfo[obj.id] == 1)
                        {
                            this._triggerOut(obj, triggerInfo.trigger);
                        }
                        triggerInfo[obj.id] = -1;
                    }
                }
            }
        }
    }


    //从外面进入时触发
    _triggerIn(obj, trigger)
    {
        if (!this._regionTriggers.aiObj || !this._regionTriggers.aiObj.onTriggerIn)
        {
            return
        }
        global.gLog.info("some one triggered in")
        this._regionTriggers.aiObj.onTriggerIn(obj, trigger)
    }

    //从里面走出去的时候触发
    _triggerOut(obj, trigger)
    {
        if (!this._regionTriggers.aiObj || !this._regionTriggers.aiObj.onTriggerOut)
        {
            return
        }
        global.gLog.info("some one triggered out")
        this._regionTriggers.aiObj.onTriggerOut(obj, trigger)
    }














    //////////////////////////////////////条件触发器//////////////////////////////////////////////////
    initConditionTrigger()
    {
        this._conditionTriggers = {}
        for (let conditiontype in EConditionType)
        {
            this._conditionTriggers[conditiontype] = {}
        }
    }
    clearConditionTrigger()
    {
        this._conditionTriggers = []
        for (let conditiontype in EConditionType)
        {
            this._conditionTriggers[EConditionType[conditiontype]] = {}
        }
    }
    triggerCondition(conditiontype, params, conditions)
    {
        params = params || {};
        conditions = conditions || {};
        for (let code in this._conditionTriggers[conditiontype])
        {
            let info = this._conditionTriggers[conditiontype][code]
            for (let key in info.conditions)
            {
                if (info.conditions[key] !== conditions[key])
                {
                    return false
                }
            }
            info.callback(params)
        }
        return true
    }
    addConditionTriggerEvent(conditiontype, callback, conditions)
    {
        conditions = conditions || {}
        _GTriggerCode += 1
        this._conditionTriggers[conditiontype][_GTriggerCode] = { callback: callback, conditions: conditions }
        return { type: conditiontype, code: _GTriggerCode }
    }
    removeConditionTriggerEvent(conditiontype, code)
    {
        if (code === undefined)
        {
            this._conditionTriggers[conditiontype] = {}
        }
        else
        {
            delete this._conditionTriggers[conditiontype][code]
        }

    }
}