import { dbDelete, dbGet, dbGetAll, dbPut } from "./offlineDb";
import {
  downloadOSMRegion,
  estimateRegionBytes,
  haversineKm,
  searchOpenStreetMap,
  searchOpenStreetMapSafety,
} from "./osm";
import { routeToNearestSafeZone, routeToSafeZone } from "./routing";
import type {
  Coordinate,
  DownloadProgress,
  DownloadedRegion,
  PlaceResult,
  RoadSegment,
  SafeZone,
  SavedLocation,
  SafetyRoute,
} from "./types";

type DownloadDraft = {
  id: string;
  roads?: RoadSegment[];
  safeZones?: SafeZone[];
};

export type StorageStatus = {
  usageBytes: number;
  quotaBytes: number;
  availableBytes: number;
};

export type {
  Coordinate,
  DownloadProgress,
  DownloadedRegion,
  PlaceResult,
  RoadSegment,
  SafeZone,
  SavedLocation,
  SafetyRoute,
  ZoneType,
} from "./types";

export { estimateRegionBytes };
export { routeToNearestSafeZone, routeToSafeZone };
export { haversineKm };

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  const [regions, saved] = await Promise.all([
    getDownloadedRegions(),
    getSavedLocations(),
  ]);
  const localResults: PlaceResult[] = [
    ...regions
      .filter((region) =>
        `${region.label} ${region.subtitle}`.toLocaleLowerCase().includes(normalized),
      )
      .map((region) => ({
        id: region.id,
        label: region.label,
        subtitle: `${region.subtitle} · offline map available`,
        center: region.center,
      })),
    ...saved
      .filter((location) => location.name.toLocaleLowerCase().includes(normalized))
      .map((location) => ({
        id: `saved-${location.id}`,
        label: location.name,
        subtitle: "Saved on this device",
        center: location.position,
      })),
  ];

  if (!navigator.onLine) return uniquePlaces(localResults);

  try {
    const onlineResults = await searchOpenStreetMap(query);
    return uniquePlaces([...localResults, ...onlineResults]);
  } catch (error) {
    if (localResults.length > 0) return uniquePlaces(localResults);
    throw error;
  }
}

export async function getDownloadedRegions(): Promise<DownloadedRegion[]> {
  const regions = await dbGetAll<DownloadedRegion>("regions");
  return regions.sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
  );
}

export async function downloadRegion(
  place: PlaceResult,
  radiusKm: number,
  onProgress: (progress: DownloadProgress) => void,
): Promise<DownloadedRegion> {
  if (!navigator.onLine) {
    throw new Error("Connect to the internet before downloading a new area.");
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 5 || radiusKm > 90) {
    throw new Error("Choose a coverage radius between 5 and 90 kilometres.");
  }

  const id = regionId(place, radiusKm);
  const storage = await getStorageStatus();
  const estimate = estimateRegionBytes(radiusKm);
  if (storage && storage.availableBytes < estimate * 0.75) {
    throw new Error(
      `This area may need about ${formatBytes(estimate)}, but this browser has only ${formatBytes(storage.availableBytes)} available. Choose a smaller radius or clear space first.`,
    );
  }

  const draft = await dbGet<DownloadDraft>("downloadDrafts", id);
  let staged: DownloadDraft = { id, ...draft };
  const data = await downloadOSMRegion(
    place.center,
    radiusKm,
    onProgress,
    { roads: staged.roads, safeZones: staged.safeZones },
    async (roads) => {
      staged = { ...staged, roads };
      await dbPut("downloadDrafts", staged);
    },
    async (safeZones) => {
      staged = { ...staged, safeZones };
      await dbPut("downloadDrafts", staged);
    },
  );

  const region: DownloadedRegion = {
    id,
    label: place.label,
    subtitle: place.subtitle,
    center: place.center,
    radiusKm,
    areaKm2: Math.PI * radiusKm * radiusKm,
    storageBytes: data.bytes,
    downloadedAt: new Date().toISOString(),
    roads: data.roads,
    safeZones: data.safeZones,
    routingGraph: data.routingGraph,
  };
  region.storageBytes = new Blob([JSON.stringify(region)]).size;
  await dbPut("regions", region);
  await dbDelete("downloadDrafts", id);
  onProgress({
    percent: 100,
    bytesDownloaded: region.storageBytes,
    bytesTotal: Math.max(estimate, region.storageBytes),
  });
  return region;
}

export async function deleteDownloadedRegion(id: string): Promise<void> {
  await Promise.all([
    dbDelete("regions", id),
    dbDelete("downloadDrafts", id),
  ]);
}

export async function getSavedLocations(): Promise<SavedLocation[]> {
  const locations = await dbGetAll<SavedLocation>("savedLocations");
  return locations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveLocation(
  name: string,
  position: Coordinate,
): Promise<SavedLocation> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Add a name before saving this place.");
  if (!isCoordinate(position)) throw new Error("This location has invalid coordinates.");

  const location: SavedLocation = {
    id: createId(),
    name: trimmedName.slice(0, 80),
    position,
    createdAt: new Date().toISOString(),
  };
  await dbPut("savedLocations", location);
  return location;
}

export async function deleteSavedLocation(id: string): Promise<void> {
  await dbDelete("savedLocations", id);
}

export function getCurrentPosition(): Promise<Coordinate> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This device does not provide GPS location in the browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (error) => reject(locationError(error)),
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 15_000 },
    );
  });
}

export function watchCurrentPosition(
  onPosition: (position: Coordinate) => void,
  onError?: (error: Error) => void,
): number {
  if (!navigator.geolocation) {
    throw new Error("This device does not provide GPS location in the browser.");
  }
  return navigator.geolocation.watchPosition(
    ({ coords }) => onPosition({ lat: coords.latitude, lng: coords.longitude }),
    (error) => onError?.(locationError(error)),
    { enableHighAccuracy: false, maximumAge: 20_000, timeout: 30_000 },
  );
}

export function stopWatchingPosition(watchId: number): void {
  if (navigator.geolocation) navigator.geolocation.clearWatch(watchId);
}

export async function loadNearbySafetyData(
  center: Coordinate,
  radiusKm: number,
): Promise<SafeZone[]> {
  const regions = await getDownloadedRegions();
  const cachedZones = zonesWithinRadius(
    regions
      .filter((region) => haversineKm(center, region.center) <= region.radiusKm)
      .flatMap((region) => region.safeZones),
    center,
    radiusKm,
  );
  if (!navigator.onLine) return cachedZones;

  try {
    return (await searchOpenStreetMapSafety(center, radiusKm))
      .map((zone) => withDistance(zone, center))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } catch (error) {
    if (cachedZones.length > 0) return cachedZones;
    throw error;
  }
}

export async function getStorageStatus(): Promise<StorageStatus | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  const usageBytes = estimate.usage ?? 0;
  const quotaBytes = estimate.quota ?? 0;
  return {
    usageBytes,
    quotaBytes,
    availableBytes: Math.max(0, quotaBytes - usageBytes),
  };
}

export function isPositionCoveredByDownloadedRegion(
  position: Coordinate,
  regions: DownloadedRegion[],
): boolean {
  return regions.some(
    (region) => haversineKm(position, region.center) <= region.radiusKm,
  );
}

export function shareLocationBySms(position: Coordinate, contact: string): void {
  const phone = contact.trim();
  if (!phone) throw new Error("Add an emergency contact before opening SMS.");
  if (!isCoordinate(position)) throw new Error("A valid location is needed to prepare this message.");

  const mapLink = `https://www.openstreetmap.org/?mlat=${position.lat.toFixed(6)}&mlon=${position.lng.toFixed(6)}#map=16/${position.lat.toFixed(6)}/${position.lng.toFixed(6)}`;
  const message = `I may need help. My last shared location is ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}. Map: ${mapLink}`;
  const separator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(message)}`;
}

function regionId(place: PlaceResult, radiusKm: number): string {
  return `osm-${place.id.replace(/[^a-zA-Z0-9_-]/g, "-")}-r${Math.round(radiusKm)}`;
}

function uniquePlaces(places: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.center.lat.toFixed(5)}:${place.center.lng.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function zonesWithinRadius(
  zones: SafeZone[],
  center: Coordinate,
  radiusKm: number,
): SafeZone[] {
  const byId = new Map<string, SafeZone>();
  for (const zone of zones) {
    const distanceKm = haversineKm(center, zone.position);
    if (distanceKm > radiusKm) continue;
    byId.set(zone.id, {
      ...zone,
      distanceKm,
      etaMinutes: Math.max(1, Math.round((distanceKm / 4.5) * 60)),
    });
  }
  return [...byId.values()].sort(
    (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  );
}

function withDistance(zone: SafeZone, center: Coordinate): SafeZone {
  const distanceKm = haversineKm(center, zone.position);
  return {
    ...zone,
    distanceKm,
    etaMinutes: Math.max(1, Math.round((distanceKm / 4.5) * 60)),
  };
}

function isCoordinate(value: Coordinate): boolean {
  return (
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
  );
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `saved-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function locationError(error: GeolocationPositionError): Error {
  if (error.code === error.PERMISSION_DENIED) {
    return new Error("Location permission is off. Allow location in your browser settings when you are ready.");
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return new Error("GPS could not find a position right now. Move to a clearer view of the sky and try again.");
  }
  if (error.code === error.TIMEOUT) {
    return new Error("GPS took too long to respond. Try again when your device has a clearer signal.");
  }
  return new Error("Your device could not provide a location.");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}