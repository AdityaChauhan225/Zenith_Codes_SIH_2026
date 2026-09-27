import { haversineKm } from "./osm";
import type {
  Coordinate,
  DownloadedRegion,
  RoutingEdge,
  RoutingNode,
  SafeZone,
  SafetyRoute,
} from "./types";

type QueueItem = { id: string; distance: number };

class MinHeap {
  private values: QueueItem[] = [];

  get size(): number {
    return this.values.length;
  }

  push(item: QueueItem): void {
    this.values.push(item);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.values[parent]!.distance <= item.distance) break;
      this.values[index] = this.values[parent]!;
      index = parent;
    }
    this.values[index] = item;
  }

  pop(): QueueItem | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (!first || !last || this.values.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (
        left < this.values.length &&
        this.values[left]!.distance < (smallest === index ? last.distance : this.values[smallest]!.distance)
      ) {
        smallest = left;
      }
      if (
        right < this.values.length &&
        this.values[right]!.distance <
          (smallest === index ? last.distance : this.values[smallest]!.distance)
      ) {
        smallest = right;
      }
      if (smallest === index) break;
      this.values[index] = this.values[smallest]!;
      index = smallest;
    }
    this.values[index] = last;
    return first;
  }
}

type RouteCandidate = {
  route: SafetyRoute;
  graphCostKm: number;
};

export function routeToNearestSafeZone(
  origin: Coordinate,
  regions: DownloadedRegion[],
): SafetyRoute | null {
  const candidates = regions
    .filter((region) => haversineKm(origin, region.center) <= region.radiusKm)
    .flatMap((region) =>
      region.safeZones.map((zone) => routeToSafeZoneInRegion(origin, zone, region)),
    )
    .filter((candidate): candidate is RouteCandidate => candidate !== null)
    .sort((a, b) => a.graphCostKm - b.graphCostKm);
  return candidates[0]?.route ?? null;
}

export function routeToSafeZone(
  origin: Coordinate,
  zone: SafeZone,
  regions: DownloadedRegion[],
): SafetyRoute | null {
  const region = regions.find(
    (item) =>
      item.safeZones.some((candidate) => candidate.id === zone.id) &&
      haversineKm(origin, item.center) <= item.radiusKm,
  );
  if (!region) return null;
  return routeToSafeZoneInRegion(origin, zone, region)?.route ?? null;
}

function routeToSafeZoneInRegion(
  origin: Coordinate,
  zone: SafeZone,
  region: DownloadedRegion,
): RouteCandidate | null {
  const graph = region.routingGraph;
  if (graph.nodes.length === 0 || graph.edges.length === 0) return null;

  const nodes = new Map<string, RoutingNode>(graph.nodes.map((node) => [node.id, node]));
  const originNode = nearestNode(origin, graph.nodes, 0.8);
  const destinationNode = nearestNode(zone.position, graph.nodes, 1.5);
  if (!originNode || !destinationNode) return null;

  const adjacency = new Map<string, Array<{ edge: RoutingEdge; other: string }>>();
  for (const edge of graph.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) continue;
    const fromEdges = adjacency.get(edge.from) ?? [];
    const toEdges = adjacency.get(edge.to) ?? [];
    fromEdges.push({ edge, other: edge.to });
    toEdges.push({ edge, other: edge.from });
    adjacency.set(edge.from, fromEdges);
    adjacency.set(edge.to, toEdges);
  }

  const bestScore = new Map<string, number>([[originNode.id, 0]]);
  const actualDistance = new Map<string, number>([[originNode.id, 0]]);
  const previous = new Map<string, { nodeId: string; edge: RoutingEdge }>();
  const queue = new MinHeap();
  queue.push({ id: originNode.id, distance: 0 });

  while (queue.size > 0) {
    const current = queue.pop();
    if (!current || current.distance !== bestScore.get(current.id)) continue;
    if (current.id === destinationNode.id) break;

    for (const candidate of adjacency.get(current.id) ?? []) {
      const edgeCost = candidate.edge.distanceKm * (candidate.edge.floodRisk ? 12 : 1);
      const score = current.distance + edgeCost;
      if (score >= (bestScore.get(candidate.other) ?? Infinity)) continue;
      bestScore.set(candidate.other, score);
      actualDistance.set(
        candidate.other,
        (actualDistance.get(current.id) ?? 0) + candidate.edge.distanceKm,
      );
      previous.set(candidate.other, { nodeId: current.id, edge: candidate.edge });
      queue.push({ id: candidate.other, distance: score });
    }
  }

  const graphCostKm = bestScore.get(destinationNode.id);
  if (graphCostKm === undefined) return null;

  const pathNodeIds: string[] = [destinationNode.id];
  const pathEdges: RoutingEdge[] = [];
  let cursor = destinationNode.id;
  while (cursor !== originNode.id) {
    const step = previous.get(cursor);
    if (!step) return null;
    pathEdges.unshift(step.edge);
    pathNodeIds.unshift(step.nodeId);
    cursor = step.nodeId;
  }

  const snappedOrigin = originNode.position;
  const snappedDestination = destinationNode.position;
  const distanceKm =
    haversineKm(origin, snappedOrigin) +
    (actualDistance.get(destinationNode.id) ?? 0) +
    haversineKm(snappedDestination, zone.position);
  const coordinates = compactCoordinates([
    origin,
    ...pathNodeIds.flatMap((id) => {
      const position = nodes.get(id)?.position;
      return position ? [position] : [];
    }),
    zone.position,
  ]);
  const usesFlaggedRoad = pathEdges.some((edge) => edge.floodRisk);
  const warning = usesFlaggedRoad
    ? [
        "The available mapped route includes a road tagged as flood-prone, a ford, tunnel, or covered segment. Check conditions before moving.",
      ]
    : [];

  return {
    graphCostKm,
    route: {
      coordinates,
      distanceKm,
      durationMinutes: Math.max(1, Math.round((distanceKm / 4.2) * 60)),
      warning,
      destinationName: zone.name,
      steps: makeInstructions(origin, pathNodeIds, pathEdges, nodes, zone),
    },
  };
}

function nearestNode(
  position: Coordinate,
  nodes: RoutingNode[],
  maximumDistanceKm: number,
): RoutingNode | undefined {
  let closest: RoutingNode | undefined;
  let closestDistance = maximumDistanceKm;
  for (const node of nodes) {
    const distance = haversineKm(position, node.position);
    if (distance < closestDistance) {
      closest = node;
      closestDistance = distance;
    }
  }
  return closest;
}

function compactCoordinates(coordinates: Coordinate[]): Coordinate[] {
  return coordinates.filter((position, index) => {
    if (index === 0) return true;
    const previous = coordinates[index - 1];
    return previous !== undefined && haversineKm(previous, position) > 0.002;
  });
}

function makeInstructions(
  origin: Coordinate,
  pathNodeIds: string[],
  pathEdges: RoutingEdge[],
  nodes: Map<string, RoutingNode>,
  destination: SafeZone,
): SafetyRoute["steps"] {
  if (pathNodeIds.length < 2) {
    return [
      {
        instruction: `Continue to ${destination.name}`,
        distanceKm: haversineKm(origin, destination.position),
        coordinate: destination.position,
      },
    ];
  }

  const firstRoad = pathEdges[0]?.roadName;
  const firstPosition = nodes.get(pathNodeIds[0]!)?.position;
  const nextPosition = nodes.get(pathNodeIds[1]!)?.position;
  const steps: SafetyRoute["steps"] = [
    {
      instruction: `Head ${compassDirection(firstPosition && nextPosition ? bearing(firstPosition, nextPosition) : 0)}${firstRoad ? ` on ${firstRoad}` : ""}`,
      distanceKm: 0,
      coordinate: origin,
    },
  ];

  let distanceSinceInstruction = 0;
  for (let index = 1; index < pathEdges.length; index += 1) {
    const previousNode = nodes.get(pathNodeIds[index - 1]!);
    const currentNode = nodes.get(pathNodeIds[index]!);
    const nextNode = nodes.get(pathNodeIds[index + 1]!);
    const edge = pathEdges[index];
    if (!previousNode || !currentNode || !nextNode || !edge) continue;
    distanceSinceInstruction += pathEdges[index - 1]?.distanceKm ?? 0;

    const turn = turnInstruction(
      bearing(previousNode.position, currentNode.position),
      bearing(currentNode.position, nextNode.position),
    );
    if (turn && distanceSinceInstruction >= 0.12) {
      steps[steps.length - 1]!.distanceKm += distanceSinceInstruction;
      steps.push({
        instruction: `${turn}${edge.roadName ? ` onto ${edge.roadName}` : ""}`,
        distanceKm: 0,
        coordinate: currentNode.position,
      });
      distanceSinceInstruction = 0;
    }
  }

  const finalEdge = pathEdges[pathEdges.length - 1];
  distanceSinceInstruction += finalEdge?.distanceKm ?? 0;
  steps[steps.length - 1]!.distanceKm += distanceSinceInstruction;
  steps.push({
    instruction: `Arrive at ${destination.name}`,
    distanceKm: haversineKm(nodes.get(pathNodeIds[pathNodeIds.length - 1]!)?.position ?? destination.position, destination.position),
    coordinate: destination.position,
  });
  return steps;
}

function bearing(from: Coordinate, to: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const degrees = (value: number) => (value * 180) / Math.PI;
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);
  const deltaLng = radians(to.lng - from.lng);
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
}

function compassDirection(degrees: number): string {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return directions[Math.round(degrees / 45) % directions.length] ?? "north";
}

function turnInstruction(from: number, to: number): string | undefined {
  const signed = ((to - from + 540) % 360) - 180;
  const magnitude = Math.abs(signed);
  if (magnitude < 38) return undefined;
  if (magnitude > 145) return signed > 0 ? "Make a sharp right" : "Make a sharp left";
  return signed > 0 ? "Turn right" : "Turn left";
}