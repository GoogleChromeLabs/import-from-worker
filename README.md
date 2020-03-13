# import-from-worker

It’s like `import()`, but runs the module in a worker.

This library is a love-child of [@_developit] and [@dassurma].

## Usage

```js
// service.js
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}
```

```js
// main.js
import importFromWorker from "import-from-worker";

// Absolute paths create the least headaches
const { add, multiply } = await importFromWorker("/service.js");
console.log(await add(40, 2));
// ...
```

## Q&A

### How does it work?

This library is really just a small layer on top of [Comlink] and Workers with ES modules (i.e. `new Worker(file, {type: "module"})`).

_More to come in this section._

### Can I get a handle to the underlying worker?

Why yes you can! The module exports a `workerSymbol` that can be used thusly:

```js
import importFromWorker, { workerSymbol } from "import-from-worker";

const module = await importFromWorker("/service.js");
const worker = module[workerSymbol];
// You could also use destructuring:
// const {[workerSymbol]: worker, add, subtract} = await importFromWorker("./service.js");

// Use the worker instance directly
worker.terminate();
```

### How do I make relative paths work?

Relative paths are relative to wherever the `import-from-worker` module is. The easiest way around this problem is to use absolute paths. If relative paths are required, they can be used by manually resolving them using `URL`:

```js
const module = await importFromWorker(new URL("./service.js", import.meta.url));
```

---

License Apache-2.0

[comlink]: https://github.com/GoogleChromeLabs/comlink
[@_developit]: https://twitter.com/_developit
[@dassurma]: https://twitter.com/dassurma
