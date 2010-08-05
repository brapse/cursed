var sys = require('sys');


// Printing ###########################

var printing = true;
var async    = false;

var u = exports;

u.p = function (msg) {
    if(!printing) { return }
    if(async) {
        sys.puts(msg);
    } else {
        console.log(msg);
    }
}

u.pp = function (obj) {
    u.p(sys.inspect(obj));
}

u.identity = function () {
    u.p('identity callback');
    u.pp(arguments);
}
