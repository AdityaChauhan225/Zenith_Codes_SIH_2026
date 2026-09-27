export type Coordinate = {
  lat: number;
  lng: number;
};

export type PlaceResult = {
  id: string;
  label: string;
  subtitle: string;
  center: Coordinate;
};

export type ZoneType =
  | "shelter"
  | "relief camp"
  | "hospital"
  | "police station"
  | "high ground";

export type SafeZone = {
  id: string;
  name: string;
  type: ZoneType;
  position: Coordinate;
  tags?: Record<string, string>;
  distanceKm?: number;
  etaMinutes?: number;
};

export type RoadSegment = {
  id: string;
  name?: string;
  highway: string;
  coordinates: Coordinate[];
  nodeIds: string[];
  floodRisk: boolean;
};

export type RoutingNode = {
  id: string;
  position: Coordinate;
};

export type RoutingEdge = {
  from: string;
  to: string;
  distanceKm: number;
  floodRisk: boolean;
  roadName?: string;
};

export type RoutingGraph = {
  nodes: RoutingNode[];
  edges: RoutingEdge[];
};

export type DownloadedRegion = {
  id: string;
  label: string;
  subtitle: string;
  center: Coordinate;
  radiusKm: number;
  areaKm2: number;
  storageBytes: number;
  downloadedAt: string;
  safeZones: SafeZone[];
  roads: RoadSegment[];
  routingGraph: RoutingGraph;
};

export type SavedLocation = {
  id: string;
  name: string;
  position: Coordinate;
  createdAt: string;
};

export type SafetyRoute = {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMinutes: number;
  warning: string[];
  destinationName: string;
  steps: Array<{
    instruction: string;
    distanceKm: number;
    coordinate: Coordinate;
  }>;
};

export type DownloadProgress = {
  percent: number;
  bytesDownloaded: number;
  bytesTotal: number;
};