function* gen() {
    for (var a of ["b", "c", "d"])
        yield* a
}
var a = gen();
console.log(a.next());
console.log(a.next());
console.log(a.next());
if (a.next().done)
    a = gen();
console.log(a.next());
console.log(a.next());