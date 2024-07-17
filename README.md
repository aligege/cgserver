9.2.7
1、主要针对配置政策修改
9.2.1
1、增强提示
9.2.0
1、mysql 更换为mysql2
9.1.23
1、日志系统整理
9.1.22
1、日志系统整理
9.1.21
1、express 全局异常捕获日志
9.1.20
1、没什么就是一个日志配置功能功能
9.1.19
1、尴尬修改的是9.18的问题
9.1.18
1、普通日志默认100个文件
9.1.17
1、IServerWebSocket的重连可能的bug
9.1.16
1、websocket客户端无需强制配置服务器配置文件，debug_msg
9.1.15
1、websocket请求连接端扩展
9.1.14
1、http请求、websocker处理时间、rpc请求处理时间
9.1.13
1、请求的时间消耗提示优化
9.1.12
1、部分httpserver 请求bug修改
9.1.11
1、部分httpserver的代码整理
9.1.10
1、删除一些无用配置和代码
2、整理现有的代码，增加一些人性化的提示
9.1.9
1、周起始时间bug修正
9.1.8
1、强制mongocache访问mongo的bug修改
9.1.7
1、httptool 默认可以支持全局输出日志了
9.1.6
1、默认不适用losslessjson，会把数字变成对象
9.1.5
1、https只单独监听
9.1.3
1、几乎同意替换成losslessjson
2、express使用了raw
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