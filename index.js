'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var mock_api = exports.mock_api = function mock_api(return_arg) {
    var _calls = [];
    var count = -1;

    var proxy = new Proxy(function () {}, {
        apply: function apply(target, this_arg, _args) {
            // function called initially
            _calls.push({ _args: _args });
            count++;
            return make_sub_proxy(count);
        },
        get: function get(target, key) {
            // get _calls
            if (key == '_calls') return _calls;

            // await foo().bar() will resolve to return_arg
            else if (key == 'then') return function (resolve) {
                    return resolve(return_arg);
                };

                // property accessed initially
                else {
                        _calls.push(_defineProperty({}, key, {}));
                        count++;
                        return make_sub_proxy(count);
                    }
        }
    });

    var make_sub_proxy = function make_sub_proxy(count) {

        // traverse to the current position in call_list
        var temp = _calls[count];
        for (var key in temp) {
            if (key != '_args') temp = temp[key];
        }

        var sub_proxy = new Proxy(function () {}, {
            apply: function apply(target, this_arg, _args) {
                // function called
                // foo('a','b','c')
                if (!temp.hasOwnProperty('_args')) temp._args = _args;

                // foo('a','b','c')(1,2,3)
                else {
                        temp._anonymous = { _args: _args };
                        temp = temp._anonymous;
                    }
                return sub_proxy;
            },
            get: function get(target, key) {
                // get _calls
                if (key == '_calls') return _calls;

                // await foo().bar() will resolve to return_arg
                else if (key == 'then') return function (resolve) {
                        return resolve(return_arg);
                    };

                    // property accessed
                    else {
                            temp[key] = {};
                            temp = temp[key];
                            return sub_proxy;
                        }
            }
        });

        return sub_proxy;
    };

    return proxy;
};

// call_fn: api => api.foo().bar()
var mock_call = exports.mock_call = function mock_call(call_fn) {
    return call_fn(mock_api())._calls[0];
};
