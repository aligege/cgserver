9.1.2
1、losslessjson
9.1.1
1、扩展mongomgr的一个接口addMongo，removeMongo方便自由增减
2、清除部分无用代码
3、mongoext的mongoclient未被初始化修正
9.1.0
1、支持多mongo示例
2、支持多service实例
ps:新的service必须是无参数得constructor
9.0.7(重要修复)
1、修复createFilter的bug
9.0.6(修复bug)
1、IRpcClientWebSocket toRetMsg的bug修正
9.0.5(不重要)
1、添加一个rpc提示
9.0.4
1、rpc回复指定发送的消息的位置不正确的bug
9.0.3
1、request添加rawBody接口，方便获取原始body字符串
2、v4替换uuidv4(官方弃用，现有接口不影响)
3、增强rpc的提示
9.0.2
1、修复uuid问题
9.0.0
1、升级了新的rpc，支持分组和具体
2、rpc至少请使用2.0.0版本
8.9.18
1、支持自定义进程id
8.9.17
1、支持websocketserver 暂停和恢复
2、支持webserver 暂停和恢复
8.9.16
1、ws暴露当时请求的req
8.9.15
1、暴露mongo的objectid
8.9.14
1、字节操作能力
8.9.13
1、protofilter 可扩展
8.9.6
1、webview的view可配置
8.9.4
1、扩展签名和验签功能
8.6.9
1、update all packages
2、remove webpack about packages
3、remove file request，instead，use express static config
8.6.7
1、getAutoIds bug修改
8.6.6
1、SyncCall2 this丢失的bug修正
8.6.2
1、C# post url-encoded data support
8.6.1
1、quickTrasaction support options