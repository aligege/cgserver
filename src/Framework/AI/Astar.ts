import { Point } from './Point';
export interface IAStarMap
{
    width():number
    height():number
    canPass(point:Point):boolean
    canPass(x:number,y:number):boolean
    extraWeight(point:Point):number
}
export class Rect
{
    x=0
    y=0
    width=0
    height=0
}
class AStarNode
{
    ParentNode: AStarNode=null
    CurTilePos: Point=null
    G: number=0
    H: number=0
    constructor(node:AStarNode, tilePos)
    {
        this.ParentNode = node;
        this.CurTilePos = tilePos;
        if (this.ParentNode)
        {
            this.G = this.ParentNode.G + 10;
        }
        else
        {
            this.G = 0;
        }
    }
    F()
    {
        return this.G + this.H;
    }
}

export class AStar
{
    protected _markList: Array<AStarNode>=null
    protected _markedList: Array<AStarNode>=null
    protected _routes: Array<Point>=null
    protected _maxTileWidth: number=0
    protected _maxTileHeight: number=0
    /**
     * 先y在x，p(x:1,y:2),data[2][1]
     */
    protected _mapData:IAStarMap=null
    getRoutes(srcTilePos:Point, tarTilePos:Point, mapData:IAStarMap)
    {
        if(srcTilePos.equals(tarTilePos))
        {
            return []
        }
        this._markList = []
        this._markedList = []
        this._routes = []
        this._mapData = mapData
        this._maxTileWidth = this._mapData.width()
        this._maxTileHeight = this._mapData.height()
        let tp = srcTilePos.sub(tarTilePos)
        let node = new AStarNode(null, srcTilePos)
        node.H = (Math.abs(tp.x) + Math.abs(tp.y)) * 10+mapData.extraWeight(tarTilePos)
        this._markList.push(node)

        node = this._routing(srcTilePos, tarTilePos)
        while (node)
        {
            this._routes.push(node.CurTilePos)
            node = node.ParentNode
        }
        this._routes.reverse()
        this._routes.shift()
        return this._routes
    }
    protected _routing(srcTilePos:Point, tarTilePos:Point)
    {
        if (this._markList.length <= 0)//已经没有节点，是死路根本无法到达
        {
            return null
        }

        let node = this._markList[0]
        let curIndex = 0
        for (let i = 0; i < this._markList.length; ++i)
        {
            if (node.F() > this._markList[i].F())
            {
                node = this._markList[i];
                curIndex = i;
            }
            if (this._markList[i].CurTilePos.equals(tarTilePos))//到达终点
            {
                return this._markList[i];
            }
        }
        this._markList.splice(curIndex,1)
        this._markedList.push(node);

        let tp = new Point(0, 0);
        //上
        tp.x = node.CurTilePos.x; tp.y = node.CurTilePos.y + 1;
        this._addToMark(tp, tarTilePos, node);
        //下
        tp = new Point(0, 0);
        tp.x = node.CurTilePos.x; tp.y = node.CurTilePos.y - 1;
        this._addToMark(tp, tarTilePos, node);
        //左
        tp = new Point(0, 0);
        tp.x = node.CurTilePos.x - 1; tp.y = node.CurTilePos.y;
        this._addToMark(tp, tarTilePos, node);
        //右
        tp = new Point(0, 0);
        tp.x = node.CurTilePos.x + 1; tp.y = node.CurTilePos.y;
        this._addToMark(tp, tarTilePos, node);

        return this._routing(srcTilePos, tarTilePos);
    }
    protected _isInMark(tilePos)
    {
        for (let i = 0; i < this._markList.length; ++i)
        {
            if (this._markList[i].CurTilePos.equals(tilePos))
            {
                return true;
            }
        }
        for (let i = 0; i < this._markedList.length; ++i)
        {
            if (this._markedList[i].CurTilePos.equals(tilePos))
            {
                return true;
            }
        }
        return false;
    }
    protected _addToMark(curTilePos:Point, tarTilePos:Point, parentAStarNode:AStarNode)
    {
        //无地图数据
        if (curTilePos.x < 0 || curTilePos.y < 0
            || !this._mapData.canPass(curTilePos))
        {
            return
        }
        if (!this._isInMark(curTilePos))//未曾添加
        {
            let newNode = new AStarNode(parentAStarNode, curTilePos)
            let temp_tp = parentAStarNode.CurTilePos.sub(tarTilePos)
            newNode.H = (Math.abs(temp_tp.x) + Math.abs(temp_tp.y)) * 10
            this._markList.push(newNode)
        }
    }
}