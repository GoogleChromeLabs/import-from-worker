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
