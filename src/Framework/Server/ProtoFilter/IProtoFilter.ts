export enum EProtoType
{
    Json=1,
    GoogleProtoBuffer=2,
    Custom=3
}
export interface IProtoFilter
{
    init(path?:string):boolean
    encode(data,...params)
    decode(data,...params)
}