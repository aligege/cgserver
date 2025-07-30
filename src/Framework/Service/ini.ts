export enum EUserState
{
    Delete=-2,
    Ban=-1,
    Waitting=0,
    Normal=1
}
export enum EAccountState
{
    Delete=-2,
    Ban=-1,
    Waitting=0,
    Normal=1
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