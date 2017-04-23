
const range = function* (from, to) {
  for(let i = from; i < to; i++) {
    console.log('range\t', i);
    yield i;
  }
}

const map = function* (flow, solve) {
  for(const data of flow) {
    console.log('map\t', data);
    yield(solve(data));
  }
}

const filter = function* (flow, condition) {
  for(const data of flow) {
    console.log('filter\t', data);
    if (condition(data)) {
      yield data;
    }
  }
}

const stop = function*(flow, condition) {
  for(const data of flow) {
    yield data;
    if (condition(data)) {
      break;
    }
  }
}

const take = function (flow, number) {
  let count = 0;
  const _filter = function (data) {
    count ++
    return count >= number;
  }
  return stop(flow, _filter);
}

// for(const n of take(filter(map(range(0, 10000), n => n * 10), n => n % 3 === 0), 2)) {
//   console.log('num:\t', n, '\n');
// }

class _Lazy{
  constructor() {
    this.iterator = null;
  }

  range(...args) {
    this.iterator = range(...args);
    return this;
  }

  map(...args) {
    this.iterator = map(this.iterator, ...args);
    return this;
  }

  filter(...args) {
    this.iterator = filter(this.iterator, ...args);
    return this;
  }

  take(...args) {
    this.iterator = take(this.iterator, ...args);
    return this;
  }

  [Symbol.iterator]() {
    return this.iterator;
  }

}

function lazy () {
  return new _Lazy();
}

const nums = lazy().range(0, 100).map(n => n * 10).filter(n => n % 3 === 0).take(2);

for(let n of nums) {
  console.log('num:\t', n, '\n');
}
