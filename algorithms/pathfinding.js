function reconstructPath(parents, start, goal) {
  const path = [goal];
  let current = goal;
  while (current !== start) {
    current = parents.get(current);
    if (current === undefined) return [];
    path.push(current);
  }
  return path.reverse();
}

export function findPath({ rows, columns, walls, start, end, algorithm }) {
  const events = [];
  const open = [start];
  const queued = new Set([start]);
  const closed = new Set();
  const parents = new Map();
  const distances = new Map([[start, 0]]);
  const visitOrder = [];
  let queueHead = 0;
  const isWeighted = algorithm === "dijkstra" || algorithm === "astar";

  function neighborsOf(cell) {
    const row = Math.floor(cell / columns);
    const column = cell % columns;
    const neighbors = [];
    if (row > 0) neighbors.push(cell - columns);
    if (column < columns - 1) neighbors.push(cell + 1);
    if (row < rows - 1) neighbors.push(cell + columns);
    if (column > 0) neighbors.push(cell - 1);
    return neighbors.filter((neighbor) => !walls.has(neighbor));
  }

  function heuristic(cell) {
    const rowDistance = Math.abs(Math.floor(cell / columns) - Math.floor(end / columns));
    const columnDistance = Math.abs((cell % columns) - (end % columns));
    return rowDistance + columnDistance;
  }

  function frontierSnapshot() {
    return (algorithm === "bfs" ? open.slice(queueHead) : open).filter((cell) => !closed.has(cell));
  }

  events.push({
    type: "start",
    current: start,
    visited: [],
    frontier: [start],
    path: [],
    note: "Begin at the start cell and inspect its neighbors.",
  });

  while (algorithm === "bfs" ? queueHead < open.length : open.length > 0) {
    let current;
    if (algorithm === "bfs") {
      current = open[queueHead];
      queueHead += 1;
    } else if (algorithm === "dfs") {
      current = open.pop();
    } else {
      let bestPosition = 0;
      for (let position = 1; position < open.length; position += 1) {
        const candidate = open[position];
        const best = open[bestPosition];
        const candidateScore = distances.get(candidate) + (algorithm === "astar" ? heuristic(candidate) : 0);
        const bestScore = distances.get(best) + (algorithm === "astar" ? heuristic(best) : 0);
        if (candidateScore < bestScore) bestPosition = position;
      }
      [current] = open.splice(bestPosition, 1);
    }
    queued.delete(current);
    if (closed.has(current)) continue;
    closed.add(current);
    visitOrder.push(current);
    events.push({
      type: "visit",
      current,
      visited: [...visitOrder],
      frontier: frontierSnapshot(),
      path: [],
      note: `Visit cell ${Math.floor(current / columns) + 1}, ${current % columns + 1}.`,
    });

    if (current === end) {
      const path = reconstructPath(parents, start, end);
      events.push({
        type: "path",
        current,
        visited: [...visitOrder],
        frontier: frontierSnapshot(),
        path,
        note: `Found a route containing ${Math.max(0, path.length - 1)} moves.`,
      });
      return events;
    }

    for (const neighbor of neighborsOf(current)) {
      if (closed.has(neighbor)) continue;
      const candidateDistance = distances.get(current) + 1;
      if (!isWeighted) {
        if (neighbor === start || parents.has(neighbor)) continue;
        parents.set(neighbor, current);
        distances.set(neighbor, candidateDistance);
        open.push(neighbor);
        queued.add(neighbor);
        continue;
      }

      if (candidateDistance < (distances.get(neighbor) ?? Infinity)) {
        distances.set(neighbor, candidateDistance);
        parents.set(neighbor, current);
        if (!queued.has(neighbor)) {
          open.push(neighbor);
          queued.add(neighbor);
        }
      }
    }
  }

  events.push({
    type: "unreachable",
    current: null,
    visited: [...visitOrder],
    frontier: [],
    path: [],
    note: "No route connects the start and finish cells.",
  });
  return events;
}