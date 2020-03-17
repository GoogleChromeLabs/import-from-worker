/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Comlink from "comlink";
export { Comlink };

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

// I, Surma, take no responsibility. This is Jason’s invention.
// It’s disgusting, uses RegExps and solves the problem at hand,
// which is fairly on-brand.
function getBase() {
  let relativeTo = location.href;
  try {
    relativeTo = Error()
      .stack.split("\n")[3]
      .match(/ \((.+):[^:]+:[^:]+\)$/)[1];
  } catch (e) {}
  return relativeTo;
}

export const workerSymbol = Symbol();
export default async function importFromWorker(
  path,
  { name, base = getBase() } = {}
) {
  // Module workers can technically import cross-origin scripts,
  // but due to a bug in Chrome, they currently can’t.
  // https://html.spec.whatwg.org/multipage/workers.html#module-worker-example
  //
  // H/T @jaffathecake
  const blob = await fetch(import.meta.url).then(r => r.blob());
  const blobURL = URL.createObjectURL(blob);
  const worker = new Worker(blobURL, { type: "module", name });
  await expectMessage(worker, "waiting");
  worker.postMessage(new URL(path, base).toString());
  await expectMessage(worker, "ready");
  const api = Comlink.wrap(worker);
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
  Comlink.expose(module);
}

const isWorker = !("document" in self);
if (isWorker) {
  run();
}
