import { pins } from '../pinsData';

// Calculate distance between two points
export const distance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// STRICT GRAPH BUILDER
// This ignores distance. It ONLY connects pins listed in your 'neighbors' array.
export const buildGraph = () => {
  const graph = {};

  // 1. Initialize all nodes
  pins.forEach(pin => {
    graph[pin.id] = [];
  });

  // 2. Create connections based strictly on the 'neighbors' array
  pins.forEach(pin => {
    if (pin.neighbors) {
      pin.neighbors.forEach(neighborId => {
        // Find the neighbor pin by ID (handles number vs string mismatch)
        const neighborPin = pins.find(p => p.id == neighborId);

        if (neighborPin) {
          const dist = distance(pin, neighborPin);
          
          // Add connection FROM pin TO neighbor
          graph[pin.id].push({ id: neighborPin.id, distance: dist });
          
          // AUTOMATICALLY add connection FROM neighbor TO pin (Bi-directional)
          // This prevents broken paths if you forgot to add the reverse ID in pinsData
          const alreadyConnected = graph[neighborPin.id].some(n => n.id == pin.id);
          if (!alreadyConnected) {
            graph[neighborPin.id].push({ id: pin.id, distance: dist });
          }
        }
      });
    }
  });

  return graph;
};

// A* pathfinding algorithm
export const aStarPathfinding = (startId, endId) => {
  try {
    const graph = buildGraph();
    const allNodes = pins;
    const start = allNodes.find(p => p.id === startId);
    const end = allNodes.find(p => p.id === endId);
    
    if (!start || !end) {
      console.log('Start or end pin not found');
      return [];
    }

    // Check if start and end are the same
    if (startId === endId) {
      return [start];
    }

    const openSet = [{ id: startId, f: 0, g: 0, h: distance(start, end), parent: null }];
    const closedSet = new Set();
    const cameFrom = {};
    const maxIterations = 1000; // Prevent infinite loops
    let iterations = 0;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // Sort and get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.id === endId) {
        // Reconstruct path - include ALL nodes (including invisible waypoints) for proper path visualization
        const path = [];
        let node = endId;
        while (node !== null && node !== undefined) {
          const nodeData = allNodes.find(p => p.id === node);
          if (nodeData) {
            // Include ALL nodes in the path (including invisible waypoints)
            path.unshift(nodeData);
          }
          node = cameFrom[node];
          // Safety check to prevent infinite loop
          if (path.length > allNodes.length) {
            console.log('Path reconstruction error: path too long');
            return [];
          }
        }
        return path;
      }

      closedSet.add(current.id);
      const neighbors = graph[current.id] || [];

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.id)) continue;

        const neighborNode = allNodes.find(p => p.id === neighbor.id);
        if (!neighborNode) continue;

        const g = current.g + neighbor.distance;
        const h = distance(neighborNode, end);
        const f = g + h;

        const existingNodeIndex = openSet.findIndex(n => n.id === neighbor.id);
        if (existingNodeIndex === -1) {
          openSet.push({ id: neighbor.id, f, g, h, parent: current.id });
          cameFrom[neighbor.id] = current.id;
        } else if (g < openSet[existingNodeIndex].g) {
          openSet[existingNodeIndex].g = g;
          openSet[existingNodeIndex].f = f;
          openSet[existingNodeIndex].parent = current.id;
          cameFrom[neighbor.id] = current.id;
        }
      }
    }

    if (iterations >= maxIterations) {
      console.log('Pathfinding reached max iterations');
    }
    
    return []; // No path found
  } catch (error) {
    console.error('Pathfinding error:', error);
    return [];
  }
};
