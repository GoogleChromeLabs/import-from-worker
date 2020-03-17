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

import importFromWorker, { Comlink } from "/base/dist/import-from-worker.js";

describe("importFromWorker", function() {
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

  it("works with Comlink functions", function(done) {
    importFromWorker("./fixtures/callback.js").then(({ callWith42 }) => {
      callWith42(
        Comlink.proxy(v => {
          expect(v).to.equal(42);
          done();
        })
      );
    });
  });
});
