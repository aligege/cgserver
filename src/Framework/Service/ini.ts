export enum ERoleGroup
{
    Creator=1,//创始人
    Admin,//管理员
    Proxy,//代理
    Common//普通成员
}
export enum EUserState
{
    Ban=-1,
    Waitting=0,
    Normarl=1
}
export enum EAccountState
{
    Delete=-2,
    Ban=-1,
    Waitting=0,
    Normarl=1
}
export enum EAccountFrom
{
    Guest=0,
    _OpenSocial,//去掉不要了
    WeChat,
    QQ,
    Phone,
    Email,
    Name,
    QuickPhone,
    Apple,
    Google
}