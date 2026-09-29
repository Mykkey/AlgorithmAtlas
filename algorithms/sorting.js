function makeRecorder(values) {
  const events = [];
  return {
    events,
    record(type, indices, note) {
      events.push({ type, indices: [...indices], values: [...values], note });
    },
  };
}

function swap(values, first, second) {
  [values[first], values[second]] = [values[second], values[first]];
}

function bubbleSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);
  for (let end = values.length - 1; end > 0; end -= 1) {
    let changed = false;
    for (let index = 0; index < end; index += 1) {
      recorder.record("compare", [index, index + 1], `Compare ${values[index]} and ${values[index + 1]}.`);
      if (values[index] > values[index + 1]) {
        swap(values, index, index + 1);
        changed = true;
        recorder.record("swap", [index, index + 1], `Swap the pair so the larger value moves right.`);
      }
    }
    if (!changed) break;
  }
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

function selectionSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);
  for (let start = 0; start < values.length - 1; start += 1) {
    let smallest = start;
    for (let index = start + 1; index < values.length; index += 1) {
      recorder.record("compare", [smallest, index], `Compare the current minimum ${values[smallest]} with ${values[index]}.`);
      if (values[index] < values[smallest]) smallest = index;
    }
    if (smallest !== start) {
      swap(values, start, smallest);
      recorder.record("swap", [start, smallest], `Place the smallest remaining value at position ${start + 1}.`);
    }
  }
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

function insertionSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index];
    let cursor = index - 1;
    while (cursor >= 0) {
      recorder.record("compare", [cursor, cursor + 1], `Check whether ${values[cursor]} belongs after ${value}.`);
      if (values[cursor] <= value) break;
      values[cursor + 1] = values[cursor];
      recorder.record("write", [cursor, cursor + 1], `Shift ${values[cursor]} one place to the right.`);
      cursor -= 1;
    }
    values[cursor + 1] = value;
    recorder.record("write", [cursor + 1], `Insert ${value} into its place in the sorted portion.`);
  }
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

function mergeSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);

  function merge(start, middle, end) {
    const left = values.slice(start, middle);
    const right = values.slice(middle, end);
    let leftIndex = 0;
    let rightIndex = 0;
    let target = start;
    while (leftIndex < left.length && rightIndex < right.length) {
      recorder.record("compare", [start + leftIndex, middle + rightIndex], `Compare the front values of the two sorted halves.`);
      if (left[leftIndex] <= right[rightIndex]) {
        values[target] = left[leftIndex];
        leftIndex += 1;
      } else {
        values[target] = right[rightIndex];
        rightIndex += 1;
      }
      recorder.record("write", [target], `Write ${values[target]} into position ${target + 1}.`);
      target += 1;
    }
    while (leftIndex < left.length) {
      values[target] = left[leftIndex];
      recorder.record("write", [target], `Write ${values[target]} from the left half.`);
      leftIndex += 1;
      target += 1;
    }
    while (rightIndex < right.length) {
      values[target] = right[rightIndex];
      recorder.record("write", [target], `Write ${values[target]} from the right half.`);
      rightIndex += 1;
      target += 1;
    }
  }

  function divide(start, end) {
    if (end - start < 2) return;
    const middle = Math.floor((start + end) / 2);
    divide(start, middle);
    divide(middle, end);
    merge(start, middle, end);
  }

  divide(0, values.length);
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

function quickSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);

  function partition(low, high) {
    const pivot = values[high];
    let boundary = low;
    for (let index = low; index < high; index += 1) {
      recorder.record("compare", [index, high], `Compare ${values[index]} with pivot ${pivot}.`);
      if (values[index] <= pivot) {
        if (boundary !== index) {
          swap(values, boundary, index);
          recorder.record("swap", [boundary, index], `Move a value no larger than the pivot to the left.`);
        }
        boundary += 1;
      }
    }
    if (boundary !== high) {
      swap(values, boundary, high);
      recorder.record("swap", [boundary, high], `Put the pivot between the two partitions.`);
    }
    return boundary;
  }

  function sort(low, high) {
    if (low >= high) return;
    const pivotIndex = partition(low, high);
    sort(low, pivotIndex - 1);
    sort(pivotIndex + 1, high);
  }

  sort(0, values.length - 1);
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

function heapSort(input) {
  const values = [...input];
  const recorder = makeRecorder(values);

  function siftDown(root, limit) {
    let largest = root;
    const left = root * 2 + 1;
    const right = left + 1;
    if (left < limit) {
      recorder.record("compare", [largest, left], `Compare parent ${values[largest]} with left child ${values[left]}.`);
      if (values[left] > values[largest]) largest = left;
    }
    if (right < limit) {
      recorder.record("compare", [largest, right], `Compare the current largest value with right child ${values[right]}.`);
      if (values[right] > values[largest]) largest = right;
    }
    if (largest !== root) {
      swap(values, root, largest);
      recorder.record("swap", [root, largest], `Restore the max-heap below the root.`);
      siftDown(largest, limit);
    }
  }

  for (let root = Math.floor(values.length / 2) - 1; root >= 0; root -= 1) {
    siftDown(root, values.length);
  }
  for (let end = values.length - 1; end > 0; end -= 1) {
    swap(values, 0, end);
    recorder.record("swap", [0, end], `Move the maximum heap value into its final position.`);
    siftDown(0, end);
  }
  recorder.record("done", values.map((_, index) => index), "Every value is in ascending order.");
  return recorder.events;
}

export const sortingAlgorithms = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
  heap: heapSort,
};