﻿let Md5 = require("md5");
let os = require('os');
let request = require('request');

import * as _ from "underscore";
export class core 
{
    static isObject(param):boolean
    {
        return typeof (param) === "object"
    }
    static isArray(param):boolean
    {
        return param instanceof Array
    }
    static isNumber(param):boolean
    {
        return typeof (param) === "number"
    }
    static isNaN(param):boolean
    {
        return isNaN(param)
    }
    static isFunction(param):boolean
    {
        return typeof (param) === "function"
    }
    static isString(param):boolean
    {
        return typeof (param) === "string"
    }
    static clone(obj)
    {
        if (typeof obj==="undefined")
        {
            return null
        }
        if (core.isArray(obj))
        {
            let newArray = new Array()
            for (let i = 0, length = obj.length; i < length; ++i)
            {
                newArray[i] = this.clone(obj[i])
            }
            return newArray
        }
        if (core.isObject(obj))
        {
            let newObj = new Object()
            for (let i in obj)
            {
                newObj[i] = this.clone(obj[i])
            }
            return newObj
        }
        return obj
    }
    //合并但是不改变dest
    static merge(dest, src)
    {
        let t = core.clone(dest)
        if (!src)
        {
            return t
        }
        if (core.isArray(src))
        {
            t = t || []
            let tlen = t.length
            for (let i = 0, len = src.length; i < len; ++i)
            {
                let value = src[i]
                if (core.isFunction(value))
                {
                    continue
                }
                if (core.isArray(value) || core.isObject(value))
                {
                    if (i < tlen)
                    {
                        t[i] = core.merge(null, value)
                    }
                    else
                    {
                        t.push(core.merge(null, value))
                    }

                }
                else
                {
                    if (i < tlen)
                    {
                        t[i] = value
                    }
                    else
                    {
                        t.push(value)
                    }
                }
            }
        }
        else if (core.isObject(src))
        {
            t = t || {}
            for (let key in src)
            {
                let value = src[key]
                if (core.isFunction(value))
                {
                    continue
                }
                if (core.isArray(value) || core.isObject(value))
                {
                    t[key] = core.merge(null, value)
                }
                else
                {
                    t[key] = value
                }
            }
        }
        else
        {
            t = src
        }
        return t
    }
    //只是取出template里面已经有的部分
    static getExit(template, src)
    {
        if (!src || !template)
        {
            return {}
        }
        let t = {}
        for (let key in src)
        {
            if (template[key]===undefined)
            {
                continue
            }
            let value = src[key]
            if (core.isFunction(value))
            {
                continue
            }
            if (core.isArray(value) || core.isObject(value))
            {
                t[key] = core.getExit(template[key], value)
            }
            else
            {
                t[key] = value
            }
        }
        return t
    }

    static toArray(table):any[]
    {
        let array = []
        for (let key in table)
        {
            if (core.isFunction(table[key]))
            {
                continue
            }
            array.push(key)
            array.push(table[key])
        }
        return array
    }

    static foreach(items, callback)
    {
        if (!items || !callback)
        {
            return
        }
        if (core.isNumber(items))
        {
            for (let i = 0; i < items; ++i)
            {
                let ret = callback(i)
                if(ret)
                {
                    return
                }
            }
        }
        else if (core.isString(items))
        {
            for (let i = 0, length = items.length; i < length; i++)
            {
                let ret = callback(i,items.charAt(i))
                if(ret)
                {
                    return
                }
            }
        }
        else if (core.isArray(items))
        {
            for (let i = 0, length = items.length; i < length; ++i)
            {
                let ret = callback(i,items[i])
                if(ret)
                {
                    return
                }
            }
        }
        else if (core.isObject(items))
        {
            for (let key in items)
            {
                let ret = callback(key,items[key])
                if(ret)
                {
                    return
                }
            }
        }
        return
    }

    static getLength(items):number
    {
        if(core.isArray(items))
        {
            return items.length
        }
        if(core.isObject)
        {
            let len = 0
            core.foreach(items,function()
            {
                ++len
            })
            return len
        }
        return 0
    }
    
    static char2buf(str)
    {
    　　let out = new ArrayBuffer(str.length*2)
    　　let u16a= new Uint16Array(out)
    　　let strs = str.split("")
    　　for(let i =0 ; i<strs.length;i++)
        {
            u16a[i]=strs[i].charCodeAt()
    　　}
    　　return out
    }

    static array2arraybuffer(array) 
    {
        let b = new ArrayBuffer(array.length)
        let v = new DataView(b, 0)
        for (let i = 0; i < array.length; i++) 
        {
            v.setUint8(i, array[i])
        }
        return b
    }

    static arraybuffer2array(buffer:ArrayBufferLike) 
    {
        let v = new DataView(buffer, 0)
        let a = new Uint8Array(v.byteLength)
        for (let i = 0; i < v.byteLength; i++)
        {
            a[i] = v.getUint8(i)
        }
        return a
    }

    static firstCharUpCase(str)
    {
        let reg = /\b(\w)|\s(\w)/g 
        str = str.toLowerCase() 
        return str.replace(reg,function(m){return m.toUpperCase()}) 
    } 

    static convertIntToUInt8Array(num)
    {
        let c2 = num%256
        let c1 = Math.floor(num/256)
        let arr = new Uint8Array(2)
        arr[0]=c1
        arr[1]=c2
        return arr
    }

    static convertUInt8ArrayToInt(array):number
    {
        if(array.length!=2)
        {
            return 0
        }
        return array[0]*256+array[1]
    }
    //从一个数组里面按照下标和长度的方式去获取另一个数组，至少返回空数组
    //包含start
    static getArrayFromArray(data,start,l?)
    {
        let len = data.length
        start = start || 0//默认最开始
        l = l || len//默认到最后
        if(start>=len)
        {
            return new Uint8Array()
        }
        let arr = new Uint8Array(l)
        for(let i = start ;i<start+l&&i<len;++i)
        {
            arr[i]=data[i]
        }
        return arr
    }

    static blobToArrayBuffer(data,callback)
    {
        let fileReader = new FileReader()
        fileReader.onload  = function(progressEvent) 
        {
            if(callback)
            {
                callback(this.result)
            }
        }
        fileReader.readAsArrayBuffer(data)
    }

    static format = function(src,formatStr)   
    {   
        if(core.isString(src))
        {
            let args = Array.prototype.slice.call(arguments, 1)
            return src.replace(/\{(\d+)\}/g, function(m, i)
            {
                return args[i]
            })
        }
        else
        {
            if(this.isNumber(src))
            {
                src = new Date(src)
            }
            let str = formatStr
            let Week = ['日','一','二','三','四','五','六']
        
            let month = src.getMonth()+1
            let year = src.getFullYear()
            let date = src.getDate()
            let hour = src.getHours()
            let min = src.getMinutes()
            let sec = src.getSeconds()
            let day = src.getDay()
            str=str.replace(/yyyy|YYYY/,year)
            str=str.replace(/yy|YY/,(year % 100)>9?(year % 100).toString():'0' + (year % 100))
        
            str=str.replace(/MM/,month>9?month.toString():'0' + month)
            str=str.replace(/M/g,month)
        
            str=str.replace(/w|W/g,Week[day])
        
            str=str.replace(/dd|DD/,date>9?date.toString():'0' + date)
            str=str.replace(/d|D/g,date)
        
            str=str.replace(/hh|HH/,hour>9?hour.toString():'0' + hour)
            str=str.replace(/h|H/g,hour)
            str=str.replace(/mm/,min>9?min.toString():'0' + min)
            str=str.replace(/m/g,min)
        
            str=str.replace(/ss|SS/,sec>9?sec.toString():'0' + sec)
            str=str.replace(/s|S/g,sec)
            return str
        }
    }
    /**
     * 字符串中间保密
     * @param str 
     */
    static fuzzy(str:string)
    {
        if(!str)
        {
            return str
        }
        if(str.length<=1)
        {
            return str
        }
        if(str.length==2)
        {
            return str[0]+"*"
        }
        let first = str[0]
        let last = str[str.length-1]
        let newStr = first
        for(let i=0;i<str.length-2;++i)
        {
            newStr+="*"
        }
        newStr+=last
        return newStr
    }
    static md5 = function (data)
    {
        let str = data
        if (!core.isString(data))
        {
            str = JSON.stringify(data)
        }
        return Md5(str)
    }

    
    static getLocalIP = function() 
    {
        let iptable={}
        let ifaces=os.networkInterfaces()
        for (let dev in ifaces) 
        {
            ifaces[dev].forEach(function(details,alias)
            {
                if ((details.family=='IPv4') && (details.internal == false)) 
                {
                    iptable['localIP'] = details.address
                }
            })
        }
        return iptable['localIP']
    }

    static getIP = async function()
    {
        return new Promise<string>((resolve,reject)=>
        {
            request('http://ip.chinaz.com/getip.aspx', function (error, response, body) {
            if (!error && response.statusCode == 200) 
                {
                    body = eval('(' + body + ')');
                    resolve(body.ip)
                }
                else
                {
                    console.error("can not get correct ip!")
                    resolve(null)
                }
            })
        })
    }
    /**
     * 判断是否是手机号
     * @param phone 手机号
     */
    static isPhoneNo(phone)
    {
        let reg = /^1[3|4|5|7|8][0-9]{9}$/ //验证规则
        let flag = reg.test(phone) //true
        return flag
    }
    /**
     * 判断是否是email
     * @param email 
     */
    static isEmail(email:string):boolean
    {
        if(!email)
        {
            return false
        }
        var regu = "^(([0-9a-zA-Z]+)|([0-9a-zA-Z]+[_.0-9a-zA-Z-]*))@([a-zA-Z0-9-]+[.])+([a-zA-Z]{2}|net|com|gov|mil|org|edu|int|name|asia)$";
        var re = new RegExp( regu )
        if( email.search( re ) == -1 )
        {
            return false
        }
        return true
    }
    /**
     * 根据概率分布获取概率分布的下标
     * @param probabilitys 概率分布列表
     * @param totalProbability 总概率
     */
    static getRandomIndex(probabilitys:Array<number>, totalProbability?:number) 
    {
        let result = 0
        let random = 0
        totalProbability=totalProbability||-1
        if(totalProbability<0)
        {
            totalProbability = eval(probabilitys.join("+"))
        }
        if(totalProbability>1)
        {
            random = _.random(totalProbability)
        }
        else
        {
            random = Math.random()
        }
        let value = 0
        for (let index = 0; index < probabilitys.length; ++index) 
        {
            value += probabilitys[index]
            if (random < value) 
            {
                result = index
                break
            }
        }

        return result
    }
    /**
     * 检查是否是闰年
     * @param year 
     */
    static checkLeap(year)
    {
        if((year % 4 == 0 && year % 100 != 0) || year % 400 == 0 )
        {
            return true
        }
        else
        {
            return false
        }
    }
    /**
     * 获取几月一共有多少天
     * @param year 
     * @param month 
     */
    static getMonthDays(year,month)
    {
        let months=[31,28,31,30,31,30,31,31,30,31,30,31]
        if(this.checkLeap(year))
        {
            months[1]=29
        }
        return months[month-1]
    }
    /**
     * 获取今日开始的时间
     */
    static getTodayStartTime()
    {
        let now = new Date()
        let time = now.getTime()
        time = time - (now.getHours()*60*60*1000+now.getMinutes()*60*1000+now.getSeconds()*1000+now.getMilliseconds())
        return time
    }
    /**
     * 获取某个时间的开始时间
     * @param time 时间戳
     * @returns 
     */
     static getStartTime(time?:number)
     {
         let now:Date = null
         if(time)
         {
             now = new Date(time)
         }
         else
         {
             now = new Date()
         }
         time = now.getTime()
         time = time - (now.getHours()*60*60*1000+now.getMinutes()*60*1000+now.getSeconds()*1000+now.getMilliseconds())
         return time
     }
    static getLastMonthStartTime()
    {
        let now = new Date()
        let time:Date = null
        if(now.getMonth()!=0)
        {
            time = new Date(now.getFullYear(),now.getMonth()-1)
        }
        else
        {
            time = new Date(now.getFullYear()-1,12)
        }
        return time.getTime()
    }
    static getCurMonthStartTime()
    {
        let now = new Date()
        let time:Date = new Date(now.getFullYear(),now.getMonth())
        return time.getTime()
    }
    static getLastWeekStartTime()
    {
        let one_day = 24*60*60*1000
        let time = this.getTodayStartTime()
        let day = new Date().getDay()
        return time-(day+7)*one_day
    }
    static getCurWeekStartTime()
    {
        let one_day = 24*60*60*1000
        let time = this.getTodayStartTime()
        let day = new Date().getDay()
        return time-day*one_day
    }
    static isSameMonth(src_time:number,target_time:number)
    {
        let src_date = new Date(src_time)
        let target_date = new Date(target_time)
        if(src_date.getFullYear()!=target_date.getFullYear())
        {
            return false
        }
        return src_date.getMonth()==target_date.getMonth()
    }
    static isSameDay(src_time:number,target_time:number)
    {
        let oneDayTime = 1000*60*60*24
        let eight_time = 1000*60*60*8
        let old_count = Math.floor((src_time+eight_time)/oneDayTime)
        let now_other = Math.floor((target_time+eight_time)/oneDayTime)  
        return old_count == now_other
    }
    /**
     * 两个日期是否是同一周
     * 思路: 因为1970年1月1 是周4   所以（天数+4）/7 取整 就是周数  如果相同就是同一周反之就不是
     * @param old 
     * @param now 
     */
    static isSameWeek(src_time:number,target_time:number)
    {
        let oneDayTime = 1000*60*60*24
        let eight_time = 1000*60*60*8
        let old_count = Math.floor((src_time+eight_time)/oneDayTime)
        let now_other = Math.floor((target_time+eight_time)/oneDayTime)
        return Math.floor((old_count+4)/7) == Math.floor((now_other+4)/7)
    }
    static sum(datas:Array<number>)
    {
        let total=0
        for(let v of datas)
        {
            total+=v
        }
        return total
    }
    /**
     * 转球为全球数字格式，三位数一个逗号
     * @param num 
     */
    static convertToGlobalStr(num:number)
    {
        if(!num)
        {
            return num+""
        }
        if(num < 1000)
        {
            return num+""
        }
        let str=""
        while(true)
        {
            let n = num%1000
            if(n>99)
            {
                str=","+n+str
            }
            else if(n>9)
            {
                str=",0"+n+str
            }
            else
            {
                str=",00"+n+str
            }
            num = Math.floor(num/1000)
            if(num<1000)
            {
                str=num+str
                break
            }
        }
        return str
    }
    static sleep(milliseconds)
    {
        return new Promise((resolve)=>
        {
            setTimeout(()=>
            {
                resolve(null)
            },milliseconds)
        })
    }
}