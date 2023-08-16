export let EErrorCode:FrameworkErrorCode =null
/**
 * 1-100
 */
export class FrameworkErrorCode
{
    Wrong_Params= { id: 1, des: "参数错误" }
    Verify_failed= { id: 2, des: "验证失败" }
    Account_Create_Failed = {id:3,des:"账号创建失败"}
    User_Create_Failed = {id:4,des:"角色创建失败"}
    Server_Error = {id:5,des:"服务器内部错误"}
    No_Account = {id:6,des:"账户不存在"}
    Mysql_Error = {id:7,des:"数据库异常"}
    No_Mysql = {id:8,des:"未开通Mysql数据库"}
    No_Mssql = {id:8,des:"未开通Mssql数据库"}
    No_User = {id:9,des:"用户不存在"}
    Account_Phone_Exist = {id:10,des:"电话已存在"}
    Account_Email_Exist = {id:11,des:"邮箱已存在"}
    Account_Name_Exist = {id:12,des:"账户名已存在"}
    Account_Type_Error = {id:13,des:"账户类型错误"}
    Email_Send_Failed = {id:14,des:"邮件发送失败"}
    Login_Failed = {id:15,des:"登陆验证失败"}
    Password_Too_Short = {id:16,des:"密码太短"}
    Wrong_Phone = {id:17,des:"电话号码不正确"}
    PhoneCode_Too_Quick = {id:18,des:"验证码获取过快，请稍后再试"}
    PhoneCode_GetFailed = {id:19,des:"验证码获取失败"}
    Wrong_Phone_Code = {id:20,des:"验证码不正确"}
    No_Mongo = {id:21,des:"未开通Mongo数据库"}
    Mongo_Error = {id:22,des:"Mongo数据库异常"}
    constructor(){}
}
EErrorCode=new FrameworkErrorCode()