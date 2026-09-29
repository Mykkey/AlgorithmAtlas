import { sortingAlgorithms } from "../algorithms/sorting.js";
import { findPath } from "../algorithms/pathfinding.js";
import { graphPresets, traverseGraph } from "../algorithms/graphTraversal.js";

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function check(name, run) {
  try {
    run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, message: error.message });
  }
}

function lastEvent(events, type) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].type === type) return events[index];
  }
  return null;
}

function pathIsValid(path, start, end, walls, columns) {
  if (path.length === 0 || path[0] !== start || path[path.length - 1] !== end) return false;
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const distance = Math.abs(Math.floor(previous / columns) - Math.floor(current / columns)) + Math.abs((previous % columns) - (current % columns));
    if (distance !== 1 || walls.has(current)) return false;
  }
  return true;
}

for (const [name, sort] of Object.entries(sortingAlgorithms)) {
  check(`${name} sort orders duplicates and reverse input`, () => {
    const input = [9, 3, 3, 0, 11, 5, 1, 8];
    const result = lastEvent(sort(input), "done");
    assert(result, "missing completion event");
    assert(JSON.stringify(result.values) === JSON.stringify([0, 1, 3, 3, 5, 8, 9, 11]), `unexpected output: ${result.values}`);
    assert(JSON.stringify(input) === JSON.stringify([9, 3, 3, 0, 11, 5, 1, 8]), "input array was mutated");
  });
  check(`${name} sort handles an empty array`, () => {
    const result = lastEvent(sort([]), "done");
    assert(result?.values.length === 0, "empty input did not remain empty");
  });
}

const grid = { rows: 5, columns: 7, start: 15, end: 19, walls: new Set() };
for (const algorithm of ["bfs", "dfs", "dijkstra", "astar"]) {
  check(`${algorithm} finds a valid route`, () => {
    const events = findPath({ ...grid, algorithm });
    const result = lastEvent(events, "path");
    assert(result && pathIsValid(result.path, grid.start, grid.end, grid.walls, grid.columns), "route is missing or invalid");
  });
}
for (const algorithm of ["bfs", "dijkstra", "astar"]) {
  check(`${algorithm} finds the shortest clear-grid route`, () => {
    const result = lastEvent(findPath({ ...grid, algorithm }), "path");
    assert(result?.path.length === 5, `expected 4 moves, received ${result?.path.length - 1}`);
  });
}
for (const algorithm of ["bfs", "dfs", "dijkstra", "astar"]) {
  check(`${algorithm} reports a blocked finish`, () => {
    const walls = new Set([12, 18, 20, 26]);
    const result = lastEvent(findPath({ ...grid, walls, algorithm }), "unreachable");
    assert(result, "expected an unreachable result");
  });
}

for (const algorithm of ["bfs", "dfs"]) {
  check(`graph ${algorithm} visits each campus node once`, () => {
    const events = traverseGraph(graphPresets.campus, algorithm, "A");
    const result = lastEvent(events, "done");
    assert(result?.visited.length === graphPresets.campus.nodes.length, "not every node was reached");
    assert(new Set(result.visited).size === result.visited.length, "a node was visited more than once");
    assert(result.visited[0] === "A", "traversal did not begin at the chosen start");
  });
}

const list = document.querySelector("#checks");
for (const result of results) {
  const item = document.createElement("li");
  item.textContent = `${result.passed ? "PASS" : "FAIL"} ${result.name}${result.message ? `: ${result.message}` : ""}`;
  list.append(item);
}

const failures = results.filter((result) => !result.passed);
const summary = document.querySelector("#result");
summary.dataset.result = failures.length ? "fail" : "pass";
summary.textContent = `${results.length - failures.length}/${results.length} checks passed`;