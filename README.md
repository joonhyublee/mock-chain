# mock-chain
Easily mock and test chained api calls, powered by Proxy

Testing chained api calls within a function can be difficult. Also, mocking an external api you don't own can be tedious and brittle. Use `mock-chain` to easily observe and compare arbitrary, chained api calls in your tests!

## Installation
Using [npm](https://www.npmjs.com/):
```
$ npm install --save-dev mock-chain
```
Then in your test file:
```js
import { mock_api, mock_call } from 'mock-chain';

const api = mock_api();
api.foo(1, 2, 3).bar.baz('a', 'b', 'c');
// create a mock api and make a chained call on it

console.log(api._calls.length);
// only one chained call has been made on the api
// 1

console.log(api._calls[0]);
// JSON object of the first chained call on the api
// {"foo":{"_args":[1,2,3],"bar":{"baz":{"_args":["a","b","c"]}}}}

const chained_call = mock_call(api => api.foo().bar('woof!').baz);
// make a JSON object of an ad-hoc chained call later to be used in test

console.log(chained_call);
// {"foo":{"_args":[],"bar":{"_args":["woof!"],"baz":{}}}}
```

## Usage
Usage with [jest](https://facebook.github.io/jest/) (but should work with other testing frameworks too)

`make_user_a_sandwich.js`:
```js
export default function make_user_a_sandwich (username) {
  // make a fucking sandwich
  const sandwich = 'a delicious sandwich';
  
  // a mongodb example
  // write to database so that the user has the newly made sandwich
  const users = this.db.collection('users');
  users.updateOne({ username }, { $set: { food: sandwich } });
  
  // a socket.io example
  // notify everyone in 'subway' room in 'friends' namespace that a new sandwich was served to user
  this.io
    .of('/friends')
    .in('subway')
    .emit('food was served', {
      username,
      food: sandwich
    });
    
  // notify everyone in 'subway' room in 'not_friends' namespace that a new sandwich was served,
  // but don't notify to whom it was served
  this.io
    .of('/not_friends')
    .in('subway')
    .emit('food was served', {
      food: sandwich
    });
}
```
`make_user_a_sandwich.test.js`:
```js
import { mock_api, mock_call } from 'mock-chain';
import make_user_a_sandwich from './make_user_a_sandwich';

it('makes user a sandwich and writes to database', () => {
  const db = mock_api(); // create a mock mongodb api
  const io = mock_api(); // create a mock socket.io api
  
  // pass mock api's to the function in whatever way that makes sense for your case
  const make_user_a_sandwich_bound = make_user_a_sandwich.bind({ db, io });
  make_user_a_sandwich_bound('joon');
  
  // chained function call on db should have been made only once
  expect(db._calls.length).toEqual(1);
  
  // a chained call on db should have been made with the following correct arguments
  expect(db._calls[0]).toEqual(
    // mock_call will output a JSON that simulates a one-off chained call
    mock_call(db => db
      .collection('users')
      .updateOne({ username: 'joon' }, { $set: { food: 'a delicious sandwich' } })
    )
  );
  
  // this test will *fail*, since a yellow banana isn't a delecions sandwich
  expect(db._calls[0]).toEqual(
    mock_call(db => db
      .collection('users')
      .updateOne({ username: 'joon' }, { $set: { food: 'a yellow banana' } })
    )
  );
  
  // chained function call on io should have been made twice
  expect(io._calls.length).toEqual(2);
  
  // this should be the correct first chained call on io
  expect(io._calls[0]).toEqual(
    mock_call(io => io
      .of('/friends')
      .in('subway')
      .emit('food was served', { username: 'joon', food: 'a delicious sandwich'})
    )
  );
  
  // this test will *fail*, since second chained call on io shouldn't contain username
  expect(io._calls[1]).toEqual(
    mock_call(io => io
      .of('/not_friends')
      .in('subway')
      .emit('food was served', { username: 'joon', food: 'a delicious sandwich'})
    )
  );
});
```
## API
- `mock_api()`: make a mock api proxy
- `mock_api().foo(..).bar.baz(..)(..).qux`: make chained function calls on the mock api proxy
- `mock_api()._calls`: get the list of JSON of the chained calls
- `mock_call(fn)`: get JSON of a single ad-hoc chained call, where `fn` is `api => api.foo(..).bar.baz(..)(..).qux`
