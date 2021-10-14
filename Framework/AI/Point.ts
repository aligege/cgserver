export class Point
{
    x=0
    y=0
    constructor(x:number=0,y:number=0)
    {
        this.x=x
        this.y=y
    }
    sub(pt:Point)
    {
        return new Point(this.x-pt.x,this.y-pt.y)
    }
    subSelf(pt:Point)
    {
        this.x-=pt.x
        this.y-=pt.y
    }
    add(pt:Point)
    {
        return new Point(this.x+pt.x,this.y+pt.y)
    }
    addSelf(pt:Point)
    {
        this.x+=pt.x
        this.y+=pt.y
    }
    equals(pt:Point)
    {
        return this.x==pt.x&&this.y==pt.y
    }
    fuzzyEqual(pt:Point,w:number)
    {
        let dtx=Math.abs(this.x-pt.x)
        if(dtx>=w)
        {
            return false
        }
        let dty=Math.abs(this.y-pt.y)
        if(dty>=w)
        {
            return false
        }
        return true
    }
    length()
    {
        return Math.sqrt(this.x*this.x+this.y*this.y)
    }
    mul(n:number)
    {
        return new Point(this.x*n,this.y*n)
    }
    mulSelf(n:number)
    {
        this.x*=n
        this.y*=n
    }
    toI()
    {
        return new Point(Math.floor(this.x),Math.floor(this.y))
    }
    normalize()
    {
        
        let len = this.length()
        if(len==0)
        {
            return new Point()
        }
        return new Point(this.x/len,this.y/len)
    }
    normalizeSelf()
    {
        
        let len = this.length()
        if(len==0)
        {
            return
        }
        this.x/=len
        this.y/=len
    }
}