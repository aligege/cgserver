import { Point } from './Point';
//世界物体，具有坐标可移动等特性
export class Entity
{
    protected _id=-1
    public get id()
    {
        return this._id
    }
    protected _world_pos:Point=new Point()
    public get worldPos()
    {
        return this._world_pos
    }
    public set worldPos(value:Point)
    {
        this._world_pos=value
    }
    protected _cell:Point=new Point()
    public get cellPos()
    {
        return this._cell
    }
    public set cellPos(value:Point)
    {
        this._cell=value
    }
    initPos(pos:Point)
    {
        //不能直接赋值，因为是引用
        this._world_pos.x=pos.x+0.5
        this._world_pos.y=pos.y+0.5
        
        this._cell.x=pos.x
        this._cell.y=pos.y
    }
}