# 版本更新日志
## v13.3.1
- 解决潜在的内存泄漏
## v13.2.11
- 增加统一日志模块，支持级别（debug/info/warn/error）、控制台与文件输出
- 支持按日期或大小滚动日志与可配置的保留策略
- 优化异步写入，降低高并发场景下日志丢失风险
- 增加默认日志配置示例与环境变量支持
- 修复部分模块未初始化日志实例的问题
- 文档补充：如何开启和调整日志等级与存储位置
- 可以dump内存信息
## v13.2.10
- Refactor auto-increment ID logic for MongoDB
## v13.2.3
- Improve MongoDB connection validation and error handling
## v13.2.2
- Fix MongoDB connection initialization logic
## v13.2.1
- Fix MongoManager to use correct connection for stats
## v13.2.0
- Refactor MongoDB service to support multiple databases
## v13+
- 主要是mongo更换为mongoose，老项目不要升级

## v12.3.6
- cache的过期时间修改
## v12.3.5
- 取消所有默认创建的index
## v12.3.4
- cache的过期时间修改
## v12.3.3
- redis 相关语法提示问题
- 支付宝接口增强
## v12.3.2
- get 请求的参数修正

## v12.3.1
- bugfix
- serverwebsocket支持wss

## v12.3.0
- 中型版本更新
- webserver websocketserver socketserver均取消默认数据库初始化，打算还是剥离
- websocketserver支持更强大的ssl配置

## v12.2.7
- redis 轻微更新，无实际影响

## v12.2.6
- mongo 新增 findOneAndUpdate 接口到处

## v12.2.5
- Core 统一hash接口

## v12.2.4
- mongo 添加了mongo的执行日志

## v12.2.3
- mongo 添加了await，不太重要这个更新

## v12.2.0
- mongo 添加了重连功能
## v12.1.0
- alisms 阿里云短信整理
- alipay 支付宝支付整理

## v12.0.9
- mongo库弃用的一个接口添加上了

## v12.0.7
- 修复IServerSocket

### v12.0.6
- 修复IRpcClientWebSocket初始化bug

### v12.0.0
- 增加socketserver

## v11.x

### v11.2.5
- Engine 增加app接口

### v11.2.2
- 日志默认log

### v11.2.1
- 日志新配置
- 新rpc

## v10.x

### v10.2.1
- cgrank支持密码

### v10.2.0
- 修复redis
- 增加对cgrank的支持

### v10.0.25
- Config 支持原始数据

### v10.0.23
- 日志默认log_file
- 添加minimist解析参数

### v10.0.20
- 增加bulkwrite接口

### v10.0.9
- 修复mongoservicemanager的接口bug

### v10.0.8
- 精简mongoservicemanager的接口

### v10.0.7
- 细微修改mongoservicemanager

### v10.0.1-10.0.7
- 一些列优化和bug修正

### v10.0.0
> **警告**：
> - 老项目切忌不要轻易升级
> - 老项目切忌不要轻易升级
> - 老项目切忌不要轻易升级

- 修改引入方式
- 修改mongo的where和property顺序

## v9.x

### v9.2.7
- 主要针对配置政策修改

### v9.2.1
- 增强提示

### v9.2.0
- mysql 更换为mysql2

### v9.1.23
- 日志系统整理

### v9.1.22
- 日志系统整理

### v9.1.21
- express 全局异常捕获日志

### v9.1.20
- 没什么就是一个日志配置功能功能

### v9.1.19
- 尴尬修改的是9.18的问题

### v9.1.18
- 普通日志默认100个文件

### v9.1.17
- IServerWebSocket的重连可能的bug

### v9.1.16
- websocket客户端无需强制配置服务器配置文件，debug_msg

### v9.1.15
- websocket请求连接端扩展

### v9.1.14
- http请求、websocker处理时间、rpc请求处理时间

### v9.1.13
- 请求的时间消耗提示优化

### v9.1.12
- 部分httpserver 请求bug修改

### v9.1.11
- 部分httpserver的代码整理

### v9.1.10
- 删除一些无用配置和代码
- 整理现有的代码，增加一些人性化的提示

### v9.1.9
- 周起始时间bug修正

### v9.1.8
- 强制mongocache访问mongo的bug修改

### v9.1.7
- httptool 默认可以支持全局输出日志了

### v9.1.6
- 默认不适用losslessjson，会把数字变成对象

### v9.1.5
- https只单独监听

### v9.1.3
- 几乎同意替换成losslessjson
- express使用了raw

### v9.1.2
- losslessjson

### v9.1.1
- 扩展mongomgr的一个接口addMongo，removeMongo方便自由增减
- 清除部分无用代码
- mongoext的mongoclient未被初始化修正

### v9.1.0
- 支持多mongo示例
- 支持多service实例

> 注：新的service必须是无参数得constructor

### v9.0.7 (重要修复)
- 修复createFilter的bug

### v9.0.6 (修复bug)
- IRpcClientWebSocket toRetMsg的bug修正

### v9.0.5 (不重要)
- 添加一个rpc提示

### v9.0.4
- rpc回复指定发送的消息的位置不正确的bug

### v9.0.3
- request添加rawBody接口，方便获取原始body字符串
- v4替换uuidv4(官方弃用，现有接口不影响)
- 增强rpc的提示

### v9.0.2
- 修复uuid问题

### v9.0.0
- 升级了新的rpc，支持分组和具体
- rpc至少请使用2.0.0版本

## v8.x

### v8.9.18
- 支持自定义进程id

### v8.9.17
- 支持websocketserver 暂停和恢复
- 支持webserver 暂停和恢复

### v8.9.16
- ws暴露当时请求的req

### v8.9.15
- 暴露mongo的objectid

### v8.9.14
- 字节操作能力

### v8.9.13
- protofilter 可扩展

### v8.9.6
- webview的view可配置

### v8.9.4
- 扩展签名和验签功能

### v8.6.9
- update all packages
- remove webpack about packages
- remove file request，instead，use express static config

### v8.6.7
- getAutoIds bug修改

### v8.6.6
- SyncCall2 this丢失的bug修正

### v8.6.2
- C# post url-encoded data support

### v8.6.1
- quickTrasaction support options