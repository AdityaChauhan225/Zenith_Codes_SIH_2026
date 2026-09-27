import type {
  Coordinate,
  DownloadProgress,
  PlaceResult,
  RoadSegment,
  RoutingEdge,
  RoutingGraph,
  RoutingNode,
  SafeZone,
} from "./types";

const PHOTON_URL = "https://photon.komoot.io/api/";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type PhotonFeature = {
  id?: string | number;
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  nodes?: number[];
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export type OSMRegionData = {
  roads: RoadSegment[];
  safeZones: SafeZone[];
  routingGraph: RoutingGraph;
  bytes: number;
};

export function haversineKm(a: Coordinate, b: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateRegionBytes(radiusKm: number): number {
  const areaKm2 = Math.PI * radiusKm * radiusKm;
  // A planning estimate for the local OSM road graph and tagged safety POIs.
  // The finished region always displays the measured IndexedDB payload size.
  return Math.max(2 * 1024 * 1024, Math.round(areaKm2 * 55 * 1024));
}

export async function searchOpenStreetMap(query: string): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ q: query.trim(), limit: "8", lang: "en" });
  const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Place search is unavailable right now (HTTP ${response.status}).`);
  }

  const result = (await response.json()) as { features?: PhotonFeature[] };
  return (result.features ?? []).flatMap((feature) => {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const properties = feature.properties ?? {};
    if (typeof lat !== "number" || typeof lng !== "number") return [];

    const name =
      stringProperty(properties, "name") ??
      stringProperty(properties, "street") ??
      stringProperty(properties, "city") ??
      "Unnamed place";
    const subtitle = [
      stringProperty(properties, "district"),
      stringProperty(properties, "city"),
      stringProperty(properties, "state"),
      stringProperty(properties, "country"),
    ]
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .filter((part) => part !== name)
      .slice(0, 3)
      .join(", ");

    return [
      {
        id: `photon-${String(feature.id ?? `${lat.toFixed(5)}-${lng.toFixed(5)}`)}`,
        label: name,
        subtitle,
        center: { lat, lng },
      },
    ];
  });
}

export async function searchOpenStreetMapSafety(
  center: Coordinate,
  radiusKm: number,
): Promise<SafeZone[]> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:90];(nwr(around:${radiusMeters},${center.lat},${center.lng})[amenity~"^(shelter|hospital|clinic|police|fire_station)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[emergency~"^(shelter|assembly_point|ambulance_station)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[social_facility~"^(shelter|homeless_shelter)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[natural~"^(peak|cliff)$"];);out center tags;`;
  const { data } = await queryOverpass(query);
  return zonesFromElements(data.elements ?? [], center, radiusKm);
}

function stringProperty(
  properties: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = properties[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function queryOverpass(query: string): Promise<{ data: OverpassResponse; bytes: number }> {
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) {
        throw new Error(
          response.status === 429 || response.status === 504
            ? "The OpenStreetMap data service is busy. Try again in a few minutes."
            : `The OpenStreetMap data request failed (HTTP ${response.status}).`,
        );
      }

      const text = await response.text();
      let data: OverpassResponse;
      try {
        data = JSON.parse(text) as OverpassResponse;
      } catch {
        throw new Error("The map data service returned an unreadable response.");
      }
      return { data, bytes: new Blob([text]).size };
    } catch (error) {
      lastError = error;
      if (!navigator.onLine) break;
    }
  }

  if (!navigator.onLine) {
    throw new Error(
      "The connection dropped before this region finished downloading. Reconnect and resume the download.",
    );
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error("The OpenStreetMap data service could not be reached. Try again later.");
}

export async function downloadOSMRegion(
  center: Coordinate,
  radiusKm: number,
  onProgress: (progress: DownloadProgress) => void,
  alreadyDownloaded: { roads?: RoadSegment[]; safeZones?: SafeZone[] } = {},
  onRoadsReady?: (roads: RoadSegment[], bytes: number) => void | Promise<void>,
  onSafeZonesReady?: (safeZones: SafeZone[], bytes: number) => void | Promise<void>,
): Promise<OSMRegionData> {
  const radiusMeters = Math.round(radiusKm * 1000);
  let roads = alreadyDownloaded.roads;
  let safeZones = alreadyDownloaded.safeZones;
  let roadsBytes = 0;
  let safeZonesBytes = 0;
  const estimatedBytes = estimateRegionBytes(radiusKm);

  if (!roads) {
    onProgress({ percent: 4, bytesDownloaded: 0, bytesTotal: estimatedBytes });
    const highwayPattern =
      "primary|secondary|tertiary|unclassified|residential|living_street|service|track|path|footway|pedestrian|cycleway|steps";
    const query = `[out:json][timeout:120];way(around:${radiusMeters},${center.lat},${center.lng})[highway~"^(${highwayPattern})$"][access!~"^(private|no)$"][foot!="no"];out body;>;out skel qt;`;
    const result = await queryOverpass(query);
    roadsBytes = result.bytes;
    roads = roadsFromElements(result.data.elements ?? [], center, radiusKm);
    if (roads.length === 0) {
      throw new Error(
        "No walkable road data was returned for this area. Try a smaller radius or a nearby center.",
      );
    }
    await onRoadsReady?.(roads, roadsBytes);
    onProgress({
      percent: 58,
      bytesDownloaded: roadsBytes,
      bytesTotal: Math.max(estimatedBytes, roadsBytes),
    });
  }

  if (!safeZones) {
    onProgress({
      percent: 62,
      bytesDownloaded: roadsBytes,
      bytesTotal: Math.max(estimatedBytes, roadsBytes),
    });
    const query = `[out:json][timeout:90];(nwr(around:${radiusMeters},${center.lat},${center.lng})[amenity~"^(shelter|hospital|clinic|police|fire_station)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[emergency~"^(shelter|assembly_point|ambulance_station)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[social_facility~"^(shelter|homeless_shelter)$"];nwr(around:${radiusMeters},${center.lat},${center.lng})[natural~"^(peak|cliff)$"];);out center tags;`;
    const result = await queryOverpass(query);
    safeZonesBytes = result.bytes;
    safeZones = zonesFromElements(result.data.elements ?? [], center, radiusKm);
    await onSafeZonesReady?.(safeZones, safeZonesBytes);
    onProgress({
      percent: 92,
      bytesDownloaded: roadsBytes + safeZonesBytes,
      bytesTotal: Math.max(estimatedBytes, roadsBytes + safeZonesBytes),
    });
  }

  const routingGraph = graphFromRoads(roads);
  const bytes = new Blob([
    JSON.stringify({ roads, safeZones, routingGraph }),
  ]).size;
  onProgress({ percent: 98, bytesDownloaded: bytes, bytesTotal: Math.max(estimatedBytes, bytes) });
  return { roads, safeZones, routingGraph, bytes };
}

function roadsFromElements(
  elements: OverpassElement[],
  center: Coordinate,
  radiusKm: number,
): RoadSegment[] {
  const nodeCoordinates = new Map<number, Coordinate>();
  for (const element of elements) {
    if (element.type === "node" && typeof element.lat === "number" && typeof element.lon === "number") {
      nodeCoordinates.set(element.id, { lat: element.lat, lng: element.lon });
    }
  }

  return elements.flatMap((element) => {
    if (element.type !== "way" || !element.tags?.highway || !element.nodes) return [];

    const fragments: Array<{ nodeIds: string[]; coordinates: Coordinate[] }> = [];
    let currentNodeIds: string[] = [];
    let currentCoordinates: Coordinate[] = [];
    const finishFragment = () => {
      if (currentCoordinates.length >= 2) {
        fragments.push({ nodeIds: currentNodeIds, coordinates: currentCoordinates });
      }
      currentNodeIds = [];
      currentCoordinates = [];
    };

    for (const nodeId of element.nodes) {
      const position = nodeCoordinates.get(nodeId);
      if (!position || haversineKm(center, position) > radiusKm) {
        finishFragment();
        continue;
      }
      currentNodeIds.push(String(nodeId));
      currentCoordinates.push(position);
    }
    finishFragment();
    if (fragments.length === 0) return [];

    const floodRisk =
      element.tags.flood_prone === "yes" ||
      element.tags.flooded === "yes" ||
      element.tags.ford === "yes" ||
      element.tags.tunnel === "yes" ||
      element.tags.covered === "yes" ||
      element.tags.layer?.startsWith("-") === true;

    return fragments.map(({ nodeIds, coordinates }, index) => ({
      id: `osm-way-${element.id}-${index}`,
      name: element.tags!.name,
      highway: element.tags!.highway!,
      coordinates,
      nodeIds,
      floodRisk,
    }));
  });
}

function zonesFromElements(
  elements: OverpassElement[],
  center: Coordinate,
  radiusKm: number,
): SafeZone[] {
  const byId = new Map<string, SafeZone>();

  for (const element of elements) {
    const tags = element.tags ?? {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const position = { lat, lng };
    if (haversineKm(center, position) > radiusKm) continue;

    const type = zoneTypeForTags(tags);
    if (!type) continue;
    const name = tags.name ?? tags["name:en"] ?? defaultZoneName(type, tags);
    const id = `osm-${element.type}-${element.id}`;
    byId.set(id, {
      id,
      name,
      type,
      position,
      tags: { ...tags },
      distanceKm: haversineKm(center, position),
      etaMinutes: Math.max(1, Math.round((haversineKm(center, position) / 4.5) * 60)),
    });
  }

  return [...byId.values()].sort(
    (left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity),
  );
}

function zoneTypeForTags(tags: Record<string, string>): SafeZone["type"] | undefined {
  if (
    tags.amenity === "shelter" ||
    tags.emergency === "shelter" ||
    tags.social_facility === "shelter" ||
    tags.social_facility === "homeless_shelter"
  ) {
    return "shelter";
  }
  if (tags.emergency === "assembly_point" || tags.emergency === "ambulance_station") {
    return "relief camp";
  }
  if (
    tags.amenity === "hospital" ||
    tags.amenity === "clinic" ||
    tags.healthcare === "hospital"
  ) {
    return "hospital";
  }
  if (tags.amenity === "police") return "police station";
  if (
    (tags.natural === "peak" || tags.natural === "cliff") &&
    (tags.ele !== undefined || tags.natural === "peak")
  ) {
    return "high ground";
  }
  return undefined;
}

function defaultZoneName(type: SafeZone["type"], tags: Record<string, string>): string {
  const detail = tags.operator ?? tags["healthcare:speciality"];
  return detail ? `${detail} ${type}` : type.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function graphFromRoads(roads: RoadSegment[]): RoutingGraph {
  const nodes = new Map<string, RoutingNode>();
  const edges: RoutingEdge[] = [];
  const edgeIds = new Set<string>();

  for (const road of roads) {
    for (let index = 0; index < road.nodeIds.length; index += 1) {
      const id = road.nodeIds[index];
      const position = road.coordinates[index];
      if (id && position) nodes.set(id, { id, position });
    }

    for (let index = 1; index < road.nodeIds.length; index += 1) {
      const from = road.nodeIds[index - 1];
      const to = road.nodeIds[index];
      const a = road.coordinates[index - 1];
      const b = road.coordinates[index];
      if (!from || !to || !a || !b || from === to) continue;
      const edgeKey = from < to ? `${from}:${to}` : `${to}:${from}`;
      if (edgeIds.has(edgeKey)) continue;
      edgeIds.add(edgeKey);
      edges.push({
        from,
        to,
        distanceKm: haversineKm(a, b),
        floodRisk: road.floodRisk,
        roadName: road.name,
      });
    }
  }

  return { nodes: [...nodes.values()], edges };
}