export let EErrorCode:FrameworkErrorCode =null
export class Errcode
{
    id:number
    des:string
    constructor(id:number,des:string)
    {
        this.id=id
        this.des=des
    }
}
/**
 * 1-100
 */
export class FrameworkErrorCode
{
    Verify_failed= new Errcode(2, "验证失败")
    Account_Create_Failed = new Errcode(3, "账号创建失败")
    User_Create_Failed = new Errcode(4, "角色创建失败")
    Server_Error = new Errcode(5, "服务器内部错误")
    No_Account = new Errcode(6, "账户不存在")
    Mysql_Error = new Errcode(7, "数据库异常")
    No_Mysql = new Errcode(8, "未开通Mysql数据库")
    No_Mssql = new Errcode(8, "未开通Mssql数据库")
    No_User = new Errcode(9, "用户不存在")
    Account_Phone_Exist = new Errcode(10, "电话已存在")
    Account_Email_Exist = new Errcode(11, "邮箱已存在")
    Account_Name_Exist = new Errcode(12, "账户名已存在")
    Account_Type_Error = new Errcode(13, "账户类型错误")
    Email_Send_Failed = new Errcode(14, "邮件发送失败")
    Login_Failed = new Errcode(15, "登陆验证失败")
    Password_Too_Short = new Errcode(16, "密码太短")
    Wrong_Phone = new Errcode(17, "电话号码不正确")
    PhoneCode_Too_Quick = new Errcode(18, "验证码获取过快，请稍后再试")
    PhoneCode_GetFailed = new Errcode(19, "验证码获取失败")
    Wrong_Phone_Code = new Errcode(20, "验证码不正确")
    No_Mongo = new Errcode(21, "未开通Mongo数据库")
    Mongo_Error = new Errcode(22, "Mongo数据库异常")
    Wrong_Params= new Errcode(23, "参数错误")
    constructor(){}
}
EErrorCode=new FrameworkErrorCode()