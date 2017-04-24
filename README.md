#README

### 简介

> 在编程语言理论中，惰性求值（英语：Lazy Evaluation），又译为惰性计算、懒惰求值，也称为传需求调用（call-by-need），是一个计算机编程中的一个概念，它的目的是要最小化计算机要做的工作。它有两个相关而又有区别的含意，可以表示为“延迟求值”和“最小化求值”，除可以得到性能的提升外，惰性计算的最重要的好处是它可以构造一个无限的数据类型。

看到函数式语言里面的惰性求值，想自己用 JavaScript 写一个最简实现。
用了两种方法，都不到80行实现了基本的数组的惰性求值。

### 怎么实现

惰性求值每次求值的时候并不是返回数值，而是返回一个包含计算参数的求值函数，每次到了要使用值得时候，才会进行计算。

当有多个惰性操作的时候，构成一个求值函数链，每次求值的时候，每个求值函数都向上一个求值函数求值，返回一个值。最后当计算函数终止的时候，返回一个终止值。

### 具体实现

* 判断求值函数终止

每次求值函数都会返回各种数据，所以得使用一个独一无二的值来作为判断流是否完成的标志。刚好 Symbol() 可以创建一个新的 symbol ，它的值与其它任何值皆不相等。

```js
const over = Symbol();

const isOver = function (_over) {
  return _over === over;
}
```

* 生成函数 range

range 函数接受一个起始和终止参数，返回一个求值函数，运行求值函数返回一个值，终止的时候返回终止值。

```js
const range = function (from, to) {
  let i = from;
  return function () {
    if (i < to) {
      i++
      console.log('range\t', i);
      return i
    }
    return over;
  }
}
```

* 转换函数 map

接受一个流和处理函数，获取求值函数 flow 中的数据，对数据进行处理，返回一个流。

```js
const map = function (flow, transform) {
  return function () {
    const data = flow();
    console.log('map\t', data);
    return isOver(data) ? data : transform(data);
  }
}
```

* 过滤函数 filter

接受一个流，对求值函数 flow 中数据进行过滤，找到符合的数据并且返回。

```js
const filter = function (flow, condition) {
  return function () {
    while(true) {
      const data = flow();
      if (isOver(data)) {
        return data;
      }
      if(condition(data)) {
        console.log('filter\t', data);
        return data;
      }
    }
  }
}
```

* 中断函数 stop

接受一个流，当流达到某个条件时中断流，返回一个流。可以用闭包函数加上 stop 函数接着实现一个 take 函数。

```js
const stop = function (flow, condition) {
  let _stop = false;
  return function () {
    if (_stop) return over;
    const data = flow();
    if (isOver(data)) {
      return data;
    }
    _stop = condition(data);
    return data;
  }
}

const take = function(flow, num) {
  let i = 0;
  return stop(flow, (data) => {
    return ++i >= num;
  });
}
```

* 收集函数 join

因为返回的都是一个函数，最后得使用一个 join 函数来收集所有的值并且返回一个数组。

```js
const join = function (flow) {
  const array = [];
  while(true) {
    const data = flow();
    if (isOver(data)) {
      break;
    }
    array.push(data);
  }
  return array;
}
```

最后再测试一下。

```js
const nums = join(take(filter(map(range(0, 20), n => n * 10), n => n % 3 === 0), 2));
console.log(nums);

/* 输出
  range	 1
  map	 1
  range	 2
  map	 2
  range	 3
  map	 3
  filter	 30

  range	 4
  map	 4
  range	 5
  map	 5
  range	 6
  map	 6
  filter	 60

  [ 30, 60 ]
*/
```

大功告成。

### 更优雅的实现。

上面使用 函数 + 闭包 实现了惰性求值，但是还是不够优雅，绝大部分代码都放到迭代和判断流是否完成上面去了。其实 es6 中还有更好方法来实现惰性求值，就是 generator，generator 已经帮我们解决了迭代和判断流是否完成，我们就可以专注于逻辑，写出更简洁易懂结构清晰的代码。

```js

const range = function* (from, to) {
  for(let i = from; i < to; i++) {
    console.log('range\t', i);
    yield i;
  }
}

const map = function* (flow, transform) {
  for(const data of flow) {
    console.log('map\t', data);
    yield(transform(data));
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
```

对了还得加上链式调用才算是完成了。新建一个类，内部管理一个生成器就行了。每次调用返回 this。

```js
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
```

最后再测试一下

```js
const nums = lazy().range(0, 100).map(n => n * 10).filter(n => n % 3 === 0).take(2);

for(let n of nums) {
  console.log('num:\t', n, '\n');
}
/* 输出
  range	 0
  map	 0
  filter	 0
  num:	 0

  range	 1
  map	 1
  filter	 10
  range	 2
  map	 2
  filter	 20
  range	 3
  map	 3
  filter	 30
  num:	 30
*/
```

输出和预期的一样，只用了不到80行就实现了一个基本的最简单的数组惰性求值库。
