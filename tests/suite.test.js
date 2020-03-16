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

let importFromWorker;

describe("importFromWorker", function() {
  before(async function() {
    let hasModulesInWorkerSupport = false;
    const opts = {
      get type() {
        hasModulesInWorkerSupport = true;
      }
    };
    const emptyBlob = URL.createObjectURL(
      new Blob([""], { type: "text/javascript" })
    );
    new Worker(emptyBlob, opts).terminate();
    if (hasModulesInWorkerSupport) {
      importFromWorker = await import("/base/dist/import-from-worker.js").then(
        m => self.importFromWorker
      );
    } else {
      importFromWorker = await import(
        "/base/dist/import-from-worker.shimmed.js"
      ).then(m => self.importFromWorker);
    }
  });

  beforeEach(function() {});

  it("gives you access to the module’s exports", async function() {
    const { add } = await importFromWorker(
      "/base/tests/fixtures/arithmetic.js"
    );
    expect(await add(40, 2)).to.equal(42);
  });

  it("works with relative paths", async function() {
    const { add } = await importFromWorker("./fixtures/arithmetic.js");
    expect(await add(40, 2)).to.equal(42);
  });
});
