import { wrap, expose } from "/node_modules/comlink/dist/esm/comlink.mjs";

function expectMessage(target, payload) {
  return new Promise(resolve => {
    target.addEventListener("message", function f(ev) {
      if (payload && ev.data !== payload) {
        return;
      }
      target.removeEventListener("message", f);
      resolve(ev);
    });
  });
}

export class ESMWorker extends Worker {
  constructor(path, { type, name } = {}) {
    if (type !== "module") {
      throw Error(`ESMWorker can only be used with {type: "module"}`);
    }
    super(import.meta.url, { type: "module", name });
    this.ready = expectMessage(this, "ready");
    this.postMessage(path);
    this.exports = wrap(this);
  }
}

async function run() {
  const { data } = await expectMessage(self);
  const module = await import(data);
  postMessage("ready");
  expose(module);
}

const isWorker = !("document" in self);
if (isWorker) {
  run();
}
