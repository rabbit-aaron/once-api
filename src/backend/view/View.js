export default class View {
    constructor(req, res, next){
        this.res = res;
        this.req = req;
        this.next = next;
    }
}