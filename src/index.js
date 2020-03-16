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

import { withPolyfill } from "consts:";

import { wrap, expose } from "comlink";

import $import from "./import-polyfill.js";

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
const httpUrlRegexp = /([a-z]+:\/\/[^\/]+\/[^:]+)/;
function getBase() {
  let relativeTo = location.href;
  try {
    relativeTo = Error()
      .stack.split("\n")[3]
      .match(httpUrlRegexp)[1];
  } catch (e) {}
  return relativeTo;
}

function getCurrentFile() {
  let relativeTo = location.href;
  try {
    relativeTo = Error()
      .stack.split("\n")[1]
      .match(httpUrlRegexp)[1];
  } catch (e) {}
  return relativeTo;
}

export const workerSymbol = Symbol();
export async function importFromWorker(path, { name, base = getBase() } = {}) {
  const type = withPolyfill ? "" : "module";
  const workerFile = getCurrentFile();
  console.log("Booting worker", { type, workerFile });
  const worker = new Worker(workerFile, { type, name });
  await expectMessage(worker, "waiting");
  worker.postMessage(new URL(path, base).toString());
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

async function initWorker() {
  if (withPolyfill) {
    self.import = $import;
  }
  postMessage("waiting");
  const { data } = await expectMessage(self);
  console.log("loading", { data });
  const module = await import(data);
  postMessage("ready");
  expose(module);
}

importFromWorker.workerSymbol = workerSymbol;
self.importFromWorker = importFromWorker;

const isWorker = !("document" in self);
if (isWorker) {
  console.log("initing worker!");
  initWorker();
}
