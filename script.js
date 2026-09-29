import { sortingAlgorithms } from "./algorithms/sorting.js";
import { findPath } from "./algorithms/pathfinding.js";
import { graphPresets, traverseGraph } from "./algorithms/graphTraversal.js";

const GRID_ROWS = 13;
const GRID_COLUMNS = 25;
const GRID_START = Math.floor(GRID_ROWS / 2) * GRID_COLUMNS + 2;
const GRID_END = Math.floor(GRID_ROWS / 2) * GRID_COLUMNS + GRID_COLUMNS - 3;
const SPEED_LEVELS = [1, 2, 4, 8, 16];
const BASE_STEP_DELAY = 160;
const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
let soundContext = null;
let decodedStepSound = null;

try {
	soundContext = AudioContextConstructor ? new AudioContextConstructor() : null;
} catch {
	soundContext = null;
}

const stepSoundBuffer = soundContext
	? fetch(new URL("./blipSelect.wav", import.meta.url))
		.then((response) => {
			if (!response.ok) throw new Error("Could not load step sound.");
			return response.arrayBuffer();
		})
		.then((data) => soundContext.decodeAudioData(data))
		.catch(() => null)
	: Promise.resolve(null);

stepSoundBuffer.then((buffer) => { decodedStepSound = buffer; });

const algorithms = {
	bubble: {
		view: "sorting", name: "Bubble sort", time: "O(n<sup>2</sup>)", space: "O(1)", stable: "Yes",
		description: "Walks through neighboring values and swaps any pair that is out of order. Each pass moves one more large value into its final position.",
		intro: "Compare neighboring values. A swap lets the larger one drift toward the end.",
		pseudocode: ["repeat for each unsorted position", "compare adjacent values", "swap if left is greater", "largest value settles at the end"],
		lineMap: { compare: 1, swap: 2, done: 3 },
		footer: "Stable: equal values keep their original relative order.",
	},
	selection: {
		view: "sorting", name: "Selection sort", time: "O(n<sup>2</sup>)", space: "O(1)", stable: "No",
		description: "Scans the unsorted region to find its smallest value, then places that value at the next open position on the left.",
		intro: "Search the unsorted region for its smallest value.",
		pseudocode: ["start at the first unsorted position", "scan the remaining values", "remember the smallest value", "swap it into the open position"],
		lineMap: { compare: 1, swap: 3, done: 3 },
		footer: "It makes at most one swap per pass, but always scans the remaining values.",
	},
	insertion: {
		view: "sorting", name: "Insertion sort", time: "O(n<sup>2</sup>)", space: "O(1)", stable: "Yes",
		description: "Grows a sorted region from left to right. Each new value is inserted into that region by shifting larger values one position over.",
		intro: "The first value is a sorted region of one. Insert the next value into it.",
		pseudocode: ["take the next value", "compare with the sorted region", "shift larger values right", "insert into the open position"],
		lineMap: { compare: 1, write: 2, done: 3 },
		footer: "Stable: equal values keep their original relative order.",
	},
	merge: {
		view: "sorting", name: "Merge sort", time: "O(n log n)", space: "O(n)", stable: "Yes",
		description: "Splits the array into smaller halves, sorts each half, then merges those ordered halves back together.",
		intro: "Divide the array until each piece contains one value, then merge in order.",
		pseudocode: ["divide the range into halves", "sort each half recursively", "compare the front of each half", "write the smaller value"],
		lineMap: { compare: 2, write: 3, done: 3 },
		footer: "The merge step does linear work at each level of the recursion.",
	},
	quick: {
		view: "sorting", name: "Quick sort", time: "O(n log n)", space: "O(log n)", stable: "No",
		description: "Chooses a pivot, partitions values around it, then repeats the same process on each side. This version uses the final value as its pivot.",
		intro: "The final value is the pivot. Compare each value against it.",
		pseudocode: ["choose the final value as pivot", "compare each value to pivot", "partition smaller values to the left", "repeat on each partition"],
		lineMap: { compare: 1, swap: 2, done: 3 },
		footer: "Average time is O(n log n); a consistently poor pivot can make it O(n²).",
	},
	heap: {
		view: "sorting", name: "Heap sort", time: "O(n log n)", space: "O(1)", stable: "No",
		description: "Builds a max-heap so the largest value is at the root, then repeatedly moves that value to the end and repairs the heap.",
		intro: "Build a max-heap: every parent is at least as large as its children.",
		pseudocode: ["build a max-heap", "compare parent with its children", "swap to restore the heap", "move the root to the sorted end"],
		lineMap: { compare: 1, swap: 2, done: 3 },
		footer: "Heap sort uses constant extra space and has O(n log n) worst-case time.",
	},
	bfs: {
		view: "pathfinding", name: "Breadth-first search", time: "O(V + E)", space: "O(V)", stable: "N/A",
		description: "Explores the grid in expanding layers using a queue. With equal-cost moves, the first route found is a shortest route.",
		intro: "Start at the green cell and expand outward one layer at a time.",
		pseudocode: ["add the start to the queue", "remove the oldest frontier cell", "add each unvisited neighbor", "stop when the finish is reached"],
		lineMap: { start: 0, visit: 1, path: 3, unreachable: 3 },
		footer: "On this unweighted grid, breadth-first search guarantees a shortest path.",
	},
	dfs: {
		view: "pathfinding", name: "Depth-first search", time: "O(V + E)", space: "O(V)", stable: "N/A",
		description: "Follows one branch as far as possible using a stack, then backtracks. It can find a route, but not necessarily the shortest one.",
		intro: "Follow a branch deeply before returning to explore another one.",
		pseudocode: ["add the start to the stack", "remove the newest frontier cell", "add each unvisited neighbor", "backtrack when a branch ends"],
		lineMap: { start: 0, visit: 1, path: 3, unreachable: 3 },
		footer: "Depth-first search does not guarantee the shortest path.",
	},
	dijkstra: {
		view: "pathfinding", name: "Dijkstra's algorithm", time: "O(V²)", space: "O(V)", stable: "N/A",
		description: "Repeatedly visits the cell with the smallest known distance from the start. Every grid move has equal cost here, so the route is shortest.",
		intro: "Among the frontier cells, visit the one with the lowest known distance.",
		pseudocode: ["set the start distance to zero", "choose the lowest-distance frontier", "relax each neighboring distance", "stop when the finish is settled"],
		lineMap: { start: 0, visit: 1, path: 3, unreachable: 3 },
		footer: "This implementation scans the open set, giving O(V²) time on a grid.",
	},
	astar: {
		view: "pathfinding", name: "A* search", time: "O(V²)", space: "O(V)", stable: "N/A",
		description: "Chooses the frontier cell with the lowest distance-so-far plus Manhattan distance to the finish. That estimate guides the search toward the goal.",
		intro: "Balance distance already traveled with an estimate of distance remaining.",
		pseudocode: ["set the start score to zero", "choose the lowest g + heuristic score", "update improved neighbor scores", "reconstruct the route at the finish"],
		lineMap: { start: 0, visit: 1, path: 3, unreachable: 3 },
		footer: "Manhattan distance is admissible here, so A* finds a shortest route.",
	},
	"graph-bfs": {
		view: "graph", name: "Graph BFS", time: "O(V + E)", space: "O(V)", stable: "N/A",
		description: "Visits all immediate neighbors before moving farther away. A queue preserves the order in which nodes were discovered.",
		intro: "Start at a node and visit its neighbors before moving to the next layer.",
		pseudocode: ["add the start node to a queue", "remove the oldest node", "enqueue unseen neighbors", "repeat until the queue is empty"],
		lineMap: { start: 0, visit: 1, done: 3 },
		footer: "Breadth-first traversal visits nodes in order of distance from the start.",
	},
	"graph-dfs": {
		view: "graph", name: "Graph DFS", time: "O(V + E)", space: "O(V)", stable: "N/A",
		description: "Follows one branch as deeply as possible before backtracking. A stack remembers the nodes waiting to be explored.",
		intro: "Follow a connection deeply, then backtrack to the next branch.",
		pseudocode: ["add the start node to a stack", "remove the newest node", "push unseen neighbors", "repeat until the stack is empty"],
		lineMap: { start: 0, visit: 1, done: 3 },
		footer: "Neighbor order affects the exact traversal sequence.",
	},
};

const elements = {
	algorithm: document.querySelector("#algorithm-select"),
	tabs: [...document.querySelectorAll(".view-tab")],
	workspace: document.querySelector("#workspace"),
	sortingOptions: document.querySelector("#sorting-options"),
	pathOptions: document.querySelector("#path-options"),
	graphOptions: document.querySelector("#graph-options"),
	sortStage: document.querySelector("#sort-stage"),
	gridStage: document.querySelector("#grid-stage"),
	graphStage: document.querySelector("#graph-stage"),
	sortLegend: document.querySelector("#sort-legend"),
	pathLegend: document.querySelector("#path-legend"),
	graphLegend: document.querySelector("#graph-legend"),
	arraySize: document.querySelector("#array-size"),
	arraySizeValue: document.querySelector("#array-size-value"),
	randomizeArray: document.querySelector("#randomize-array"),
	clearWalls: document.querySelector("#clear-walls"),
	randomizeWalls: document.querySelector("#randomize-walls"),
	graphPreset: document.querySelector("#graph-preset"),
	speedDown: document.querySelector("#speed-down"),
	speedUp: document.querySelector("#speed-up"),
	speedValue: document.querySelector("#speed-value"),
	soundToggle: document.querySelector("#sound-toggle"),
	soundToggleLabel: document.querySelector("#sound-toggle-label"),
	reset: document.querySelector("#reset-button"),
	step: document.querySelector("#step-button"),
	play: document.querySelector("#play-button"),
	playLabel: document.querySelector("#play-label"),
	progressBar: document.querySelector("#progress-bar"),
	stepCount: document.querySelector("#step-count"),
	operationCount: document.querySelector("#operation-count"),
	runStatus: document.querySelector("#run-status"),
	runStatusText: document.querySelector("#run-status-text"),
	visualKicker: document.querySelector("#visual-kicker"),
	visualTitle: document.querySelector("#visual-title"),
	guideIndex: document.querySelector("#guide-index"),
	algorithmTitle: document.querySelector("#algorithm-title"),
	algorithmDescription: document.querySelector("#algorithm-description"),
	time: document.querySelector("#time-complexity"),
	space: document.querySelector("#space-complexity"),
	stability: document.querySelector("#stability"),
	complexityBadge: document.querySelector("#complexity-badge"),
	stepNote: document.querySelector("#step-note"),
	guideStep: document.querySelector("#guide-step"),
	pseudocode: document.querySelector("#pseudocode"),
	guideFooter: document.querySelector("#guide-footer"),
	announcer: document.querySelector("#announcer"),
};

const state = {
	view: "sorting",
	algorithm: "bubble",
	values: [],
	rows: GRID_ROWS,
	columns: GRID_COLUMNS,
	start: GRID_START,
	end: GRID_END,
	walls: new Set(),
	graphPreset: "campus",
	graphStart: "A",
	events: [],
	cursor: -1,
	timer: null,
	dragMode: null,
	lastDraggedCell: null,
	speedIndex: 0,
	soundEnabled: true,
};

const viewDefaults = { sorting: "bubble", pathfinding: "bfs", graph: "graph-bfs" };
const viewLabels = { sorting: ["SORT / ARRAY", "A field of values", "sort"], pathfinding: ["SEARCH / GRID", "The route takes shape", "path"], graph: ["TRAVERSAL / NETWORK", "Connections, one at a time", "graph"] };
const sortingOrder = ["bubble", "selection", "insertion", "merge", "quick", "heap"];
const pathfindingOrder = ["bfs", "dfs", "dijkstra", "astar"];
const graphOrder = ["graph-bfs", "graph-dfs"];

function randomArray(size) {
	return Array.from({ length: size }, () => Math.floor(Math.random() * 88) + 10);
}

function currentGraph() {
	return graphPresets[state.graphPreset];
}

function createTimeline() {
	if (state.view === "sorting") return sortingAlgorithms[state.algorithm](state.values);
	if (state.view === "pathfinding") {
		return findPath({ rows: state.rows, columns: state.columns, walls: state.walls, start: state.start, end: state.end, algorithm: state.algorithm });
	}
	return traverseGraph(currentGraph(), state.algorithm.replace("graph-", ""), state.graphStart);
}

function stopPlayback(status = "READY") {
	if (state.timer !== null) window.clearTimeout(state.timer);
	state.timer = null;
	elements.playLabel.textContent = "Run";
	elements.play.querySelector(".play-icon").innerHTML = "&#9654;";
	setRunStatus(status, status === "COMPLETE" ? "complete" : "idle");
}

function setRunStatus(label, tone = "idle") {
	elements.runStatusText.textContent = label;
	elements.runStatus.dataset.tone = tone;
}

function resetTimeline() {
	const focusedCell = elements.gridStage.contains(document.activeElement) ? document.activeElement.dataset.cell : null;
	stopPlayback("READY");
	state.events = createTimeline();
	state.cursor = -1;
	render();
	if (focusedCell !== null) elements.gridStage.querySelector(`[data-cell="${focusedCell}"]`)?.focus();
}

function operationCount() {
	return state.events.slice(0, state.cursor + 1).filter((event) => ["compare", "swap", "write", "visit"].includes(event.type)).length;
}

function currentEvent() {
	return state.cursor >= 0 ? state.events[state.cursor] : null;
}

function playbackDelay() {
	return BASE_STEP_DELAY / SPEED_LEVELS[state.speedIndex];
}

function updateSpeedControl() {
	elements.speedValue.textContent = `${SPEED_LEVELS[state.speedIndex]}x`;
	elements.speedDown.disabled = state.speedIndex === 0;
	elements.speedUp.disabled = state.speedIndex === SPEED_LEVELS.length - 1;
	document.documentElement.style.setProperty("--bar-duration", `${playbackDelay()}ms`);
}

function changeSpeed(direction) {
	state.speedIndex = Math.max(0, Math.min(SPEED_LEVELS.length - 1, state.speedIndex + direction));
	updateSpeedControl();
}

function updateSoundControl() {
	const action = state.soundEnabled ? "Mute step sounds" : "Enable step sounds";
	elements.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
	elements.soundToggle.setAttribute("aria-label", action);
	elements.soundToggle.title = action;
	elements.soundToggleLabel.textContent = state.soundEnabled ? "Sound on" : "Sound off";
}

function toggleSound() {
	state.soundEnabled = !state.soundEnabled;
	if (state.soundEnabled) unlockStepAudio();
	updateSoundControl();
}

function unlockStepAudio() {
	if (state.soundEnabled && soundContext?.state === "suspended") soundContext.resume().catch(() => {});
}

function playStepSound(stepIndex) {
	if (!state.soundEnabled || !soundContext) return;
	unlockStepAudio();
	if (!decodedStepSound) {
		stepSoundBuffer.then((buffer) => {
			if (buffer && state.cursor === stepIndex) playStepSoundAtPitch(buffer, stepIndex);
		});
		return;
	}
	playStepSoundAtPitch(decodedStepSound, stepIndex);
}

function playStepSoundAtPitch(buffer, stepIndex) {
	const progress = state.events.length > 1 ? stepIndex / (state.events.length - 1) : 0;
	const source = soundContext.createBufferSource();
	const gain = soundContext.createGain();
	const now = soundContext.currentTime;
	const rate = 0.8 + Math.sqrt(Math.min(1, progress)) * 2.4;
	source.buffer = buffer;
	source.playbackRate.setValueAtTime(rate, now);
	gain.gain.setValueAtTime(0.14, now);
	gain.gain.exponentialRampToValueAtTime(0.001, now + buffer.duration / rate);
	source.connect(gain);
	gain.connect(soundContext.destination);
	source.start(now);
}

function stepForward() {
	if (state.cursor >= state.events.length - 1) return false;
	state.cursor += 1;
	playStepSound(state.cursor);
	render();
	return true;
}

function advance() {
	if (!stepForward()) {
		stopPlayback("COMPLETE");
		return false;
	}
	if (state.cursor === state.events.length - 1) {
		stopPlayback("COMPLETE");
		render();
	} else if (state.timer === null) {
		setRunStatus("PAUSED", "active");
	}
	return true;
}

function play() {
	if (state.timer !== null) {
		stopPlayback("PAUSED");
		return;
	}
	unlockStepAudio();
	if (state.cursor >= state.events.length - 1) {
		state.cursor = -1;
		render();
	}
	elements.playLabel.textContent = "Pause";
	elements.play.querySelector(".play-icon").innerHTML = "&#10074;&#10074;";
	setRunStatus("RUNNING", "active");

	const tick = () => {
		if (!stepForward() || state.cursor >= state.events.length - 1) {
			stopPlayback("COMPLETE");
			render();
			return;
		}
		state.timer = window.setTimeout(tick, playbackDelay());
	};
	state.timer = window.setTimeout(tick, 0);
}

function renderSort(frame) {
	const values = frame?.values ?? state.values;
	const maximum = Math.max(1, ...values);
	const active = new Set(frame?.indices ?? []);
	const complete = frame?.type === "done";
	elements.sortStage.classList.toggle("is-dense", values.length > 80);
	elements.sortStage.innerHTML = values.map((value, index) => {
		const classes = ["bar"];
		if (complete) classes.push("is-sorted");
		else if (active.has(index) && frame?.type === "compare") classes.push("is-comparing");
		else if (active.has(index) && ["swap", "write"].includes(frame?.type)) classes.push("is-writing");
		return `<div class="bar ${classes.slice(1).join(" ")}" style="--bar-height:${Math.max(6, (value / maximum) * 100)}%" title="Value ${value}" aria-label="Value ${value}"><span class="bar-value">${value}</span><span class="bar-fill"></span></div>`;
	}).join("");
	elements.sortStage.setAttribute("aria-label", `Array with ${values.length} values${complete ? ", sorted" : ""}`);
}

function renderGrid(frame) {
	const visited = new Set(frame?.visited ?? []);
	const frontier = new Set(frame?.frontier ?? []);
	const path = new Set(frame?.path ?? []);
	const current = frame?.current;
	const cells = [];
	for (let index = 0; index < state.rows * state.columns; index += 1) {
		const row = Math.floor(index / state.columns) + 1;
		const column = (index % state.columns) + 1;
		const isStart = index === state.start;
		const isEnd = index === state.end;
		const classes = ["grid-cell"];
		if (state.walls.has(index)) classes.push("is-wall");
		if (visited.has(index)) classes.push("is-visited");
		if (frontier.has(index)) classes.push("is-frontier");
		if (path.has(index)) classes.push("is-path");
		if (index === current) classes.push("is-current");
		if (isStart) classes.push("is-start");
		if (isEnd) classes.push("is-end");
		const label = isStart ? "Start" : isEnd ? "Finish" : state.walls.has(index) ? "Wall" : `Row ${row}, column ${column}`;
		cells.push(`<button type="button" class="${classes.join(" ")}" role="gridcell" data-cell="${index}" tabindex="${isStart ? 0 : -1}" aria-label="${label}" aria-selected="${isStart || isEnd}"></button>`);
	}
	elements.gridStage.style.setProperty("--grid-columns", state.columns);
	elements.gridStage.innerHTML = cells.join("");
}

function renderGraph(frame) {
	const graph = currentGraph();
	const visited = new Set(frame?.visited ?? []);
	const frontier = new Set(frame?.frontier ?? []);
	const current = frame?.current;
	const compact = window.matchMedia("(max-width: 580px)").matches;
	const viewBox = compact ? "0 0 424 470" : "0 0 720 350";
	const mobilePositions = { A: [212, 55], B: [92, 143], C: [332, 143], D: [212, 231], E: [92, 319], F: [332, 319], G: [212, 407] };
	const nodeById = new Map(graph.nodes.map((node) => {
		const [x, y] = compact ? mobilePositions[node.id] : [node.x, node.y];
		return [node.id, { ...node, x, y }];
	}));
	const edges = graph.edges.map(([first, second]) => {
		const from = nodeById.get(first);
		const to = nodeById.get(second);
		const active = (visited.has(first) && frontier.has(second)) || (visited.has(second) && frontier.has(first));
		return `<line class="graph-edge ${active ? "is-active" : ""}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
	}).join("");
	const nodes = [...nodeById.values()].map((node) => {
		const classes = ["graph-node"];
		if (visited.has(node.id)) classes.push("is-visited");
		if (frontier.has(node.id)) classes.push("is-frontier");
		if (node.id === current) classes.push("is-current");
		if (node.id === state.graphStart) classes.push("is-start");
		return `<g class="${classes.join(" ")}" data-node="${node.id}" role="button" tabindex="0" aria-label="Start traversal at ${node.label}" transform="translate(${node.x} ${node.y})"><circle r="25"></circle><text class="node-letter" y="5">${node.id}</text><text class="node-label" y="47">${node.label}</text></g>`;
	}).join("");
	elements.graphStage.innerHTML = `<svg class="graph-svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${graph.name}"><g aria-hidden="true">${edges}</g>${nodes}</svg>`;
}

function renderGuide(frame) {
	const info = algorithms[state.algorithm];
	const lineIndex = frame ? info.lineMap[frame.type] : null;
	elements.algorithmTitle.textContent = info.name;
	elements.algorithmDescription.textContent = info.description;
	elements.time.innerHTML = info.time;
	elements.space.innerHTML = info.space;
	elements.stability.textContent = info.stable;
	elements.complexityBadge.innerHTML = info.time;
	elements.stepNote.textContent = frame?.note ?? info.intro;
	elements.guideStep.textContent = String(Math.max(1, (lineIndex ?? 0) + 1)).padStart(2, "0");
	elements.pseudocode.innerHTML = info.pseudocode.map((line, index) => `<li class="${index === lineIndex ? "is-active" : ""}"><span class="code-index">${String(index + 1).padStart(2, "0")}</span><code>${line}</code></li>`).join("");
	elements.guideFooter.querySelector("span:last-child").textContent = info.footer;
	const family = info.view === "sorting" ? sortingOrder : info.view === "pathfinding" ? pathfindingOrder : graphOrder;
	elements.guideIndex.textContent = `/ ${String(family.indexOf(state.algorithm) + 1).padStart(2, "0")}`;
}

function render() {
	const frame = currentEvent();
	if (state.view === "sorting") renderSort(frame);
	if (state.view === "pathfinding") renderGrid(frame);
	if (state.view === "graph") renderGraph(frame);
	renderGuide(frame);
	const completedSteps = state.cursor + 1;
	const progress = state.events.length ? (completedSteps / state.events.length) * 100 : 0;
	elements.progressBar.style.width = `${progress}%`;
	elements.stepCount.textContent = `${completedSteps} / ${state.events.length} steps`;
	const count = operationCount();
	elements.operationCount.textContent = `${count} ${count === 1 ? "operation" : "operations"}`;
	if (frame?.type === "path") elements.announcer.textContent = "A path to the finish was found.";
	else if (frame?.type === "unreachable") elements.announcer.textContent = "No path to the finish was found.";
	else if (frame?.type === "done") elements.announcer.textContent = "Sorting complete.";
}

function setView(view, algorithm = viewDefaults[view]) {
	if (state.view !== view || state.algorithm !== algorithm) stopPlayback("READY");
	state.view = view;
	state.algorithm = algorithm;
	elements.algorithm.value = algorithm;
	elements.workspace.setAttribute("aria-labelledby", `tab-${view}`);
	for (const tab of elements.tabs) {
		const selected = tab.dataset.view === view;
		tab.classList.toggle("is-active", selected);
		tab.setAttribute("aria-selected", String(selected));
		tab.tabIndex = selected ? 0 : -1;
	}

	const isSorting = view === "sorting";
	const isPathfinding = view === "pathfinding";
	elements.sortingOptions.hidden = !isSorting;
	elements.pathOptions.hidden = !isPathfinding;
	elements.graphOptions.hidden = view !== "graph";
	elements.sortStage.hidden = !isSorting;
	elements.gridStage.hidden = !isPathfinding;
	elements.graphStage.hidden = view !== "graph";
	elements.sortLegend.hidden = !isSorting;
	elements.pathLegend.hidden = !isPathfinding;
	elements.graphLegend.hidden = view !== "graph";

	const [kicker, title] = viewLabels[view];
	elements.visualKicker.textContent = kicker;
	elements.visualTitle.textContent = title;
	resetTimeline();
}

function handleTabKeydown(event) {
	const offsets = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity };
	if (!Object.hasOwn(offsets, event.key)) return;
	event.preventDefault();
	const currentIndex = elements.tabs.indexOf(event.currentTarget);
	const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? elements.tabs.length - 1 : (currentIndex + offsets[event.key] + elements.tabs.length) % elements.tabs.length;
	const target = elements.tabs[targetIndex];
	target.focus();
	setView(target.dataset.view);
}

function setAlgorithm(algorithm) {
	const view = algorithms[algorithm].view;
	setView(view, algorithm);
}

function regenerateArray() {
	const size = Number(elements.arraySize.value);
	elements.arraySizeValue.value = String(size);
	elements.arraySizeValue.textContent = String(size);
	state.values = randomArray(size);
	resetTimeline();
}

function resetGrid() {
	state.start = GRID_START;
	state.end = GRID_END;
	state.walls.clear();
	resetTimeline();
}

function scatterWalls() {
	state.walls.clear();
	for (let index = 0; index < state.rows * state.columns; index += 1) {
		if (index !== state.start && index !== state.end && Math.random() < 0.2) state.walls.add(index);
	}
	resetTimeline();
}

function moveEndpoint(which, index) {
	const other = which === "start" ? "end" : "start";
	if (state[which] === index) return;
	if (state[other] === index) state[other] = state[which];
	state[which] = index;
	state.walls.delete(index);
	resetTimeline();
}

function toggleWall(index) {
	if (index === state.start || index === state.end) return;
	if (state.walls.has(index)) state.walls.delete(index);
	else state.walls.add(index);
	resetTimeline();
}

function handleGridPointerDown(event) {
	if (event.button !== 0) return;
	const cell = event.target.closest("[data-cell]");
	if (!cell) return;
	const index = Number(cell.dataset.cell);
	if (event.isTrusted) elements.gridStage.setPointerCapture?.(event.pointerId);
	state.lastDraggedCell = null;
	if (index === state.start || index === state.end) {
		state.dragMode = index === state.start ? "start" : "end";
	} else {
		state.dragMode = state.walls.has(index) ? "wall-remove" : "wall-add";
	}
	event.preventDefault();
	applyGridDrag(index);
}

function applyGridDrag(index) {
	if (state.lastDraggedCell === index) return;
	state.lastDraggedCell = index;
	if (state.dragMode === "start" || state.dragMode === "end") {
		moveEndpoint(state.dragMode, index);
		return;
	}
	if (index === state.start || index === state.end) return;
	const shouldBeWall = state.dragMode === "wall-add";
	if (state.walls.has(index) === shouldBeWall) return;
	if (shouldBeWall) state.walls.add(index);
	else state.walls.delete(index);
	resetTimeline();
}

function handleGridPointerMove(event) {
	if (!state.dragMode) return;
	const hovered = document.elementFromPoint(event.clientX, event.clientY);
	const cell = hovered?.closest("[data-cell]");
	if (!cell || !state.dragMode) return;
	applyGridDrag(Number(cell.dataset.cell));
}

function handleGridClick(event) {
	if (event.detail !== 0) return;
	const cell = event.target.closest("[data-cell]");
	if (!cell) return;
	toggleWall(Number(cell.dataset.cell));
}

function handleGridKeydown(event) {
	const cell = event.target.closest("[data-cell]");
	if (!cell) return;
	const index = Number(cell.dataset.cell);
	const offsets = { ArrowUp: -state.columns, ArrowDown: state.columns, ArrowLeft: -1, ArrowRight: 1 };
	if (Object.hasOwn(offsets, event.key)) {
		event.preventDefault();
		const next = index + offsets[event.key];
		if (next >= 0 && next < state.rows * state.columns && !(event.key === "ArrowLeft" && index % state.columns === 0) && !(event.key === "ArrowRight" && index % state.columns === state.columns - 1)) {
			elements.gridStage.querySelector(`[data-cell="${next}"]`)?.focus();
		}
	}
}

function chooseGraphStart(event) {
	const node = event.target.closest("[data-node]");
	if (!node) return;
	state.graphStart = node.dataset.node;
	resetTimeline();
}

function handleGraphKeydown(event) {
	if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-node]")) {
		event.preventDefault();
		state.graphStart = event.target.dataset.node;
		resetTimeline();
	}
}

elements.tabs.forEach((tab) => {
	tab.addEventListener("click", () => setView(tab.dataset.view));
	tab.addEventListener("keydown", handleTabKeydown);
});
elements.algorithm.addEventListener("change", () => setAlgorithm(elements.algorithm.value));
elements.arraySize.addEventListener("input", regenerateArray);
elements.randomizeArray.addEventListener("click", regenerateArray);
elements.reset.addEventListener("click", () => {
	if (state.view === "pathfinding") resetGrid();
	else resetTimeline();
});
elements.step.addEventListener("click", () => {
	if (state.timer !== null) stopPlayback("PAUSED");
	advance();
});
elements.play.addEventListener("click", play);
elements.clearWalls.addEventListener("click", () => {
	state.walls.clear();
	resetTimeline();
});
elements.randomizeWalls.addEventListener("click", scatterWalls);
elements.graphPreset.addEventListener("change", () => {
	state.graphPreset = elements.graphPreset.value;
	state.graphStart = currentGraph().start;
	resetTimeline();
});
elements.speedDown.addEventListener("click", () => changeSpeed(-1));
elements.speedUp.addEventListener("click", () => changeSpeed(1));
elements.soundToggle.addEventListener("click", toggleSound);
elements.gridStage.addEventListener("pointerdown", handleGridPointerDown);
elements.gridStage.addEventListener("pointermove", handleGridPointerMove);
elements.gridStage.addEventListener("pointerup", () => { state.dragMode = null; state.lastDraggedCell = null; });
elements.gridStage.addEventListener("pointercancel", () => { state.dragMode = null; state.lastDraggedCell = null; });
elements.gridStage.addEventListener("click", handleGridClick);
elements.gridStage.addEventListener("keydown", handleGridKeydown);
elements.graphStage.addEventListener("click", chooseGraphStart);
elements.graphStage.addEventListener("keydown", handleGraphKeydown);
window.addEventListener("resize", () => {
	if (state.view === "graph") renderGraph(currentEvent());
});

state.values = randomArray(Number(elements.arraySize.value));
state.events = createTimeline();
updateSpeedControl();
updateSoundControl();
for (const tab of elements.tabs) tab.tabIndex = tab.dataset.view === "sorting" ? 0 : -1;
render();
