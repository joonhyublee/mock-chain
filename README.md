# mock-chain
Easily mock and test chained api calls, powered by Proxy

Testing chained api calls within a function can be difficult. Also, mocking an external api you don't own can be tedious and brittle. Use `mock-check` to easily observe and compare arbitrary, chained api calls in your tests!

## Installation
Using [npm](https://www.npmjs.com/):
```
$ npm install --save-dev mock-chain
```
Then in your test file:
```js
import { mock_api } from 'mock-chain';

const api = mock_api();
api.foo(1, 2, 3).bar.qux('a', 'b', 'c');

console.log(api._calls.length);
// only one chained call has been made to the api
// 1

console.log(api._calls[0]);
// JSON object of the first chained call
// {"foo":{"_args":[1,2,3],"bar":{"qux":{"_args":["a","b","c"]}}}}
```

## Usage
Usage with [jest](https://facebook.github.io/jest/) (but should work with other testing frameworks too)

make_user_a_sandwich.js:
```js
export default function make_user_a_sandwich (username) {
  // make a fucking sandwich
  const sandwich = 'a delicious sandwich';
  
  // a mongodb example
  // write to database so that the food inventory of user contains the newly made sandwich
  const users = this.db.collection('users');
  users.updateOne({ username }, { $set: { food: sandwich } });
  
  // a socket.io example
  // notify everyone in subway room in friends namespace that a new sandwich was served to user
  this.io
    .of('/friends')
    .in('subway')
    .emit('food was served', {
      username,
      food: sandwich
    });
    
  // notify everyone in subway room in not_friends namespace that a new sandwich was served,
  // but don't notify to whom it was served
  this.io
    .of('/not_friends')
    .in('subway')
    .emit('food was served', {
      food: sandwich
    });
}
```
make_user_a_sandwich.test.js:
```js
import { mock_api, mock_call } from 'mock-chain';
import make_user_a_sandwich from './make_user_a_sandwich';

it('makes user a sandwich and writes to database', () => {
  const db = mock_api(); // create a mock mongodb api
  const io = mock_api(); // create a mock socket.io api
  
  // pass mock apis to the function in whatever way that makes sense for your case
  const make_user_a_sandwich = make_user_a_sandwich.bind({ db, io });
  
  make_user_a_sandwich('joon');
  
  // chained function call to db should have been made only once
  expect(db._calls.length).toEqual(1);
  
  // db call should been made with correct arguments
  // a mock_call will produce a JSON that simulates a one-off chained call
  expect(db._calls[0]).toEqual(
    mock_call(db => db
      .collection('users')
      .updateOne({ username: 'joon' }, { $set: { food: 'a delicious sandwich' } })
    )
  );
  
  // this test will *fail*, a yellow banana != a delecions sandwich
  expect(db._calls[0]).toEqual(
    mock_call(db => db
      .collection('users')
      .updateOne({ username: 'joon' }, { $set: { food: 'a yellow banana' } })
    )
  );
  
  // chained function call to io should have been made twice
  expect(io._calls.length).toEqual(2);
  
  // this should have been the first chained call to io
  expect(io._calls[0].toEqual(
    mock_call(io => io
      .of('/friends')
      .in('subway')
      .emit('food was served', { username: 'joon', food: 'a delicious sandwich'})
    )
  );
  
  // this test will *fail*, second call to io shouldn't contain username
  expect(io._calls[1].toEqual(
    mock_call(io => io
      .of('/not_friends')
      .in('subway')
      .emit('food was served', { username: 'joon', food: 'a delicious sandwich'})
    )
  );
});
```
