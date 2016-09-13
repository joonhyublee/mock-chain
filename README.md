# mock-chain
Easily mock and test chained api calls, powered by Proxy

Testing correctly chained api calls with correct arguments inside of a function can be difficult. Also, mocking an external api you don't own can be tedious and brittle. Use `mock-check` to record and compare chained api calls & property access in your tests!

## Installation
Using [npm](https://www.npmjs.com/):
```
$ npm install --save-dev mock-chain
```
Then in your test file:
```js
import { mock_api } from 'mock-chain';

// mongodb example
const db = mock_api();

// make chained function calls to the api
db.collection('users').updateOne({ username: joon }, { $set: { food: 'sandwich' }});

console.log(db._calls.length); // count the number of calls made to the db mock
// 1

console.log(db._calls[0]); // the chained call is stored as a JSON object in _calls[0]
// { collection: {
//     _args: ["users"],
//     updateOne: {
//       _args: [{ username: "joon" }, { $set: { food: "sandwich" } }]
//     }
//   }
// }
```

## Usage
