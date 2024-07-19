export class ByteTool {
    //构建一个视图，把字节数组写到缓存中，索引从0开始
    getView(bytes: Uint8Array) {
        var view = new DataView(new ArrayBuffer(bytes.length));
        for (var i = 0; i < bytes.length; i++) {
            view.setUint8(i, bytes[i])
        }
        return view
    }
    //将字节数组转成有符号的8位整型
    toInt8(bytes: Uint8Array, offset = 0) {
        return this.getView(bytes).getInt8(offset)
    }
    //将字节数组转成无符号的8位整型
    toUint8(bytes: Uint8Array, offset = 0) {
        return this.getView(bytes).getUint8(offset)
    }
    //将字节数组转成有符号的16位整型
    toInt16(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getInt16(offset, littleEndian)
    }
    //将字节数组转成无符号的16位整型
    toUint16(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getUint16(offset, littleEndian)
    }
    //将字节数组转成有符号的32位整型
    toInt32(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getInt32(offset, littleEndian)
    }
    //将字节数组转成无符号的32位整型
    toUint32(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getUint32(offset, littleEndian)
    }
    //将字节数组转成32位浮点型
    toFloat32(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getFloat32(offset, littleEndian)
    }
    //将字节数组转成64位浮点型
    toFloat64(bytes: Uint8Array, offset = 0, littleEndian = false) {
        return this.getView(bytes).getFloat64(offset, littleEndian)
    }

    //将数值写入到视图中，获得其字节数组
    getUint8Array(len: number, setNum: (view: DataView) => void) {
        var buffer = new ArrayBuffer(len)  //指定字节长度
        setNum(new DataView(buffer))  //根据不同的类型调用不同的函数来写入数值
        return new Uint8Array(buffer) //创建一个字节数组，从缓存中拿取数据
    }
    //得到一个8位有符号整型的字节数组
    getInt8Bytes(num: number) {
        return this.getUint8Array(1, (view) => { view.setInt8(0, num) })
    }
    //得到一个8位无符号整型的字节数组
    getUint8Bytes(num: number) {
        return this.getUint8Array(1, (view) => { view.setUint8(0, num) })
    }
    //得到一个16位有符号整型的字节数组
    getInt16Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(2, (view) => { view.setInt16(0, num, littleEndian) })
    }
    //得到一个16位无符号整型的字节数组
    getUint16Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(2, (view) => { view.setUint16(0, num, littleEndian) })
    }
    //得到一个32位有符号整型的字节数组
    getInt32Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(4, (view) => { view.setInt32(0, num, littleEndian) })
    }
    //得到一个32位无符号整型的字节数组
    getUint32Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(4, (view) => { view.setUint32(0, num, littleEndian) })
    }
    //得到一个32位浮点型的字节数组
    getFloat32Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(4, (view) => { view.setFloat32(0, num, littleEndian) })
    }
    //得到一个64位浮点型的字节数组
    getFloat64Bytes(num: number, littleEndian = false) {
        return this.getUint8Array(8, (view) => { view.setFloat64(0, num, littleEndian) })
    }
}