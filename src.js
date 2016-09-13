export const mock_api = return_arg => {
    const _calls = [];

    const proxy = new Proxy(function () {}, {
        apply(target, this_arg, _args) {
            // function called initially
            const call = { _args }
            _calls.push(call);
            return make_sub_proxy(call);
        },

        get(target, key) {
            // get _calls
            if (key == '_calls') return _calls;

            // await foo().bar() will resolve to return_arg
            else if (key == 'then') return resolve => resolve(return_arg);

            // property accessed initially
            else {
                const call = { [key]: {} };
                _calls.push(call);
                return make_sub_proxy(call);
            }
        }
    });

    const make_sub_proxy = call => {

        // traverse to the current position in call_list
        let temp = call;
        for (let key in temp) {
            if (key != '_args') temp = temp[key];
        }

        const sub_proxy = new Proxy(function () {}, {
            apply(target, this_arg, _args) {
                // function called
                // foo('a','b','c')
                if (!temp.hasOwnProperty('_args')) temp._args = _args;

                // function called without explicit name
                // foo('a','b','c')(1,2,3)
                else {
                    temp._anonymous = { _args };
                    temp = temp._anonymous;
                }
                return sub_proxy;
            },

            get(target, key) {
                // get _calls
                if (key == '_calls') return _calls;

                // await foo().bar() will resolve to return_arg
                else if (key == 'then') return resolve => resolve(return_arg);

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
export const mock_call = call_fn => call_fn(mock_api())._calls[0];
