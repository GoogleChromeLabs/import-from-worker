/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

const cache = {};
const exports = {};

function resolve(from, to) {
  to = to.replace(/^(\.\.\/|\.\/)/, from.replace(/[^/]+$/g, "") + "$1");
  while (to !== (to = to.replace(/[^/]+\/\.\.\//g, "")));
  return to.replace(/\.\//g, "");
}

export default function $import(id, relativeTo) {
  let seededExports;
  let resolvedId = id;
  if (relativeTo) id = resolve(relativeTo, id);

  return (
    cache[id] ||
    (cache[id] = fetch(id).then(res => {
      resolvedId = res.url;
      if (resolvedId !== id) {
        if (cache[resolvedId] != null) {
          return cache[resolvedId];
        }
        cache[resolvedId] = cache[id];
      }
      if (!res.ok) throw code;
      const module = { exports: {} };
      seededExports =
        exports[resolvedId] || (exports[resolvedId] = module.exports);
      const localImport = id => $import(id, resolvedId);
      const imports = [];
      return res
        .text()
        .then($import.transform || String)
        .then(code => {
          code = esmToCjs(code, imports);
          return Promise.all(
            imports.map(id => {
              const res = resolve(resolvedId, id);
              return res in exports ? exports[res] : $import(res);
            })
          ).then(function(imported) {
            const require = id => imported[imports.indexOf(id)];
            const ret = new Function(
              "$import",
              "require",
              "module",
              "exports",
              code
            )(localImport, require, module, module.exports);
            if (ret != null) module.exports = ret;
            // Object.assign(seededExports, module.exports);
            // eslint-disable-next-line guard-for-in
            for (let i in module.exports) seededExports[i] = module.exports[i];
            return module.exports;
          });
        });
    }))
  );
}

function esmToCjs(code, imports) {
  imports = imports || [];
  const exports = [];
  let counter = 0;
  function parseMapping(mapping, map) {
    let reg = /(?:^|,)\s*([\w$]+)(?:\s+as\s+([\w$]+))?\s*/g;
    let token;
    const out = [];
    while ((token = reg.exec(mapping))) {
      if (map) {
        exports.push(`${token[2] || token[1]}:${token[1]}`);
      } else {
        out.push(`${token[2] || token[1]}=${localName}.${token[1]}`);
      }
    }
    return out;
  }
  let localName;
  code = code
    .replace(
      /(^\s*|[;}\s\n]\s*)import\s*(?:(?:([\w$]+)(?:\s*\,\s*\{([^}]+)\})?|\{([^}]*)\})\s*from)?\s*(['"])(.+?)\5/g,
      function(s, b, def, map, map2, q, name) {
        imports.push(name);
        localName = "$im$" + ++counter;
        b += `var ${localName}=require(${q}${name}${q})`;
        if (def)
          b += `;var ${def} = 'default' in ${localName} ? ${localName}.default : ${localName}`;
        if ((map = map || map2)) {
          b += ";var " + parseMapping(map, false);
        }
        return b;
      }
    )
    .replace(
      /((?:^|[;}\s\n])\s*)export\s*(?:\s+(default)\s+|((?:async\s+)?function\s*\*?|const\s|let\s|var\s)\s*([a-zA-Z0-9$_]+))/g,
      function(s, b, def, prefix, name) {
        if (def) {
          const localName = "$im$" + ++counter;
          exports.push("default:" + localName);
          return `${b}const ${localName}=`;
        }
        exports.push(name + ":" + name);
        return b + prefix + " " + name;
      }
    )
    .replace(/((?:^|[;}\s\n])\s*)export\s*\{([^}]+)\}\s*;?/g, function(
      x,
      s,
      i
    ) {
      parseMapping(i, true);
      return s;
    })
    .replace(
      /((?:^|[^a-zA-Z0-9$_@`'".])\s*)(import\s*\([\s\S]+?\))/g,
      "$1$$$2"
    );
  return code + "\nmodule.exports={" + exports.join(",") + "}";
}
