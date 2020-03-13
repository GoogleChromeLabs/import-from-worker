export function log() {
  console.log("document" in this ? "window" : "worker");
}

export function add(a, b) {
  return a + b;
}
