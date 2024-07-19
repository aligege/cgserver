import { cg } from "../Framework"

class Test{
    @cg.SyncCall2(0)
    public test(str) {
        console.log(str+":test")
    }
}
let test = new Test()
test.test("111")
let str = cg.core.format(Date.now(),"yyyy-MM-dd hh:mm:ss")
console.log(str)