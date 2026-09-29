export const graphPresets = {
  campus: {
    name: "Campus links",
    start: "A",
    nodes: [
      { id: "A", label: "Library", x: 82, y: 174 },
      { id: "B", label: "Arts", x: 212, y: 70 },
      { id: "C", label: "Science", x: 212, y: 278 },
      { id: "D", label: "Quad", x: 354, y: 174 },
      { id: "E", label: "Studio", x: 494, y: 70 },
      { id: "F", label: "Lab", x: 494, y: 278 },
      { id: "G", label: "Hall", x: 642, y: 174 },
    ],
    edges: [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["B", "E"], ["D", "E"], ["D", "F"], ["E", "G"], ["F", "G"]],
  },
  transit: {
    name: "Transit map",
    start: "A",
    nodes: [
      { id: "A", label: "Central", x: 82, y: 174 },
      { id: "B", label: "North", x: 212, y: 70 },
      { id: "C", label: "Market", x: 212, y: 278 },
      { id: "D", label: "Museum", x: 354, y: 174 },
      { id: "E", label: "Harbor", x: 494, y: 70 },
      { id: "F", label: "Garden", x: 494, y: 278 },
      { id: "G", label: "Terminal", x: 642, y: 174 },
    ],
    edges: [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "D"], ["D", "E"], ["D", "F"], ["E", "G"], ["F", "G"]],
  },
};

export function traverseGraph(graph, algorithm, start = graph.start) {
  const adjacency = new Map(graph.nodes.map((node) => [node.id, []]));
  for (const [first, second] of graph.edges) {
    adjacency.get(first).push(second);
    adjacency.get(second).push(first);
  }

  const events = [{ type: "start", current: start, visited: [], frontier: [start], note: `Start at ${graph.nodes.find((node) => node.id === start)?.label ?? start}.` }];
  const discovered = new Set([start]);
  const visited = [];
  const open = [start];
  let queueHead = 0;

  while (algorithm === "bfs" ? queueHead < open.length : open.length > 0) {
    const current = algorithm === "bfs" ? open[queueHead++] : open.pop();
    visited.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      if (discovered.has(neighbor)) continue;
      discovered.add(neighbor);
      open.push(neighbor);
    }
    const frontier = (algorithm === "bfs" ? open.slice(queueHead) : open).filter((node) => !visited.includes(node));
    const label = graph.nodes.find((node) => node.id === current)?.label ?? current;
    events.push({
      type: "visit",
      current,
      visited: [...visited],
      frontier,
      note: `Visit ${label}. Add ${frontier.length ? `${frontier.length} connected ${frontier.length === 1 ? "node" : "nodes"}` : "no new nodes"} to the frontier.`,
    });
  }

  events.push({ type: "done", current: null, visited: [...visited], frontier: [], note: `Reached all ${visited.length} nodes in this network.` });
  return events;
}