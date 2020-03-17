# importFromWorker()

It’s like `import()`, but runs the module in a worker.

This library is a love-child of [@_developit] and [@dassurma].

**Requires [modules in workers], which are currently only implemented in Chrome!**

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

const { add, multiply } = await importFromWorker("./service.js");
console.log(await add(40, 2));
// ...
```

You can also use `importFromWorker()` from a CORS-enabled CDN like [JSDelivr] or [unpkg]:

```js
import importFromWorker from "https://cdn.jsdelivr.net/npm/import-from-worker@latest/dist/import-from-worker.js";
```

You can [remix this glitch](glitch), if you like.

## Q&A

### How does it work?

The library injects itself as the worker file and then uses dynamic `import()` to load the module. The resulting module is then exposed to the worker’s parent using [Comlink]. All guidance about callbacks and transferables from Comlink applies to this library as well. For adjustments, the library re-exports Comlink:

```js
import importFromWorker, { Comlink } from "import-from-worker";
```

### Can I get a handle to the underlying worker?

Why yes you can! The module exports a `workerSymbol` that can be used thusly:

```js
import importFromWorker, { workerSymbol } from "import-from-worker";

const module = await importFromWorker("./service.js");
const worker = module[workerSymbol];
// You could also use destructuring:
// const {[workerSymbol]: worker, add, subtract} = await importFromWorker("./service.js");

// Use the worker instance directly
worker.terminate();
```

### What about browsers without module support in workers?

I tried to make the library work in those environments. It’s possible, but it gets messy. I welcome PRs (and preferably a preceding issue to discuss the design) on this problem!

### How do I feature-detect module support in workers?

The snippet that’s [somewhat endorsed by the WHATWG][esm worker detection] is the following:

```js
let supportsModuleWorker = false;
const workerURL = URL.createObjectURL(new Blob([""]));
const options = {
  get type() {
    supportsModuleWorker = true;
  }
};
new Worker(workerURL, options).terminate();
URL.revokeObjectURL(workerURL);
```

---

License Apache-2.0

[comlink]: https://github.com/GoogleChromeLabs/comlink
[@_developit]: https://twitter.com/_developit
[@dassurma]: https://twitter.com/dassurma
[modules in workers]: https://wpt.fyi/results/workers/modules/dedicated-worker-import.any.html?label=master&product=chrome%5Bstable%5D&product=firefox%5Bstable%5D&product=safari%5Bstable%5D&product=chrome%5Bexperimental%5D&product=firefox%5Bexperimental%5D&product=safari%5Bexperimental%5D&aligned
[esm worker detection]: https://github.com/whatwg/html/issues/5325
[jsdelivr]: https://www.jsdelivr.com/
[unpkg]: https://unpkg.com/
[glitch]: https://glitch.com/edit/#!/import-from-worker-example
