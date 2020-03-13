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

export const workerSymbol = Symbol();
export default async function importFromWorker(path, { name } = {}) {
  const worker = new Worker(import.meta.url, { type: "module", name });
  await expectMessage(worker, "waiting");
  worker.postMessage(path);
  await expectMessage(worker, "ready");
  const api = wrap(worker);
  return new Proxy(api, {
    get(target, prop) {
      if (prop === workerSymbol) {
        return worker;
      }
      return target[prop];
    }
  });
}
export { importFromWorker };

async function run() {
  postMessage("waiting");
  const { data } = await expectMessage(self);
  const module = await import(data);
  postMessage("ready");
  expose(module);
}

const isWorker = !("document" in self);
if (isWorker) {
  run();
}
