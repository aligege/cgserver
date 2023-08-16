import { SyncCall, core } from "../Framework"

class Test{
    @SyncCall
    public test() {
        console.log("test")
    }
}
let test = new Test()
test.test()
let str = core.format(Date.now(),"yyyy-MM-dd hh:mm:ss")
console.log(str)