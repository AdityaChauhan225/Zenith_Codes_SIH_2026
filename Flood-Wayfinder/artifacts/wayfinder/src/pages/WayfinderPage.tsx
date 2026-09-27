import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, CircleHelp, Compass,
  Download, LocateFixed, MapPinned, Menu, Navigation, Phone,
  Route as RouteIcon, Search, Shield, Siren, Trash2, Wifi, WifiOff, X,
} from 'lucide-react';
import type {
  Coordinate, DownloadedRegion, PlaceResult, SafeZone, SavedLocation, SafetyRoute, StorageStatus,
} from '@/services/wayfinder';
import {
  deleteDownloadedRegion, deleteSavedLocation, downloadRegion, estimateRegionBytes, getCurrentPosition,
  getDownloadedRegions, getSavedLocations, getStorageStatus, loadNearbySafetyData,
  routeToNearestSafeZone, routeToSafeZone, saveLocation, searchPlaces, shareLocationBySms,
  isPositionCoveredByDownloadedRegion, stopWatchingPosition, watchCurrentPosition,
} from '@/services/wayfinder';
import { MapCanvas } from '@/components/wayfinder/MapCanvas';

type View = 'map' | 'explore' | 'downloads' | 'saved' | 'sos';
type DownloadState = 'idle' | 'running' | 'paused' | 'complete' | 'error';

const navItems: { id: View; label: string; icon: typeof Compass }[] = [
  { id: 'map', label: 'Map', icon: MapPinned },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function zoneLabel(type: SafeZone['type']) {
  return type === 'high ground' ? 'High ground' : type.replace(/\b\w/g, (char) => char.toUpperCase());
}

function PanelHeader({ eyebrow, title, onBack }: { eyebrow?: string; title: string; onBack?: () => void }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {onBack && <button type="button" onClick={onBack} data-testid="button-panel-back" className="mt-1 rounded-full p-2 text-[#536154] hover:bg-[#edf0e7]"><ArrowLeft size={17} /></button>}
      <div>
        {eyebrow && <p className="mono mb-1 text-[10px] font-medium uppercase tracking-[.18em] text-[#a46638]">{eyebrow}</p>}
        <h2 className="text-[25px] font-extrabold tracking-[-.04em] text-[#202b27]">{title}</h2>
      </div>
    </div>
  );
}

function Notice({ tone, children, onDismiss }: { tone: 'warning' | 'error' | 'info'; children: ReactNode; onDismiss?: () => void }) {
  return (
    <div className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-[#e5b8b0] bg-[#fff0ed] text-[#8d3428]' : tone === 'warning' ? 'border-[#efd18c] bg-[#fff6d9] text-[#785b10]' : 'border-[#c5d9d1] bg-[#edf7f3] text-[#245e50]'}`}>
      {tone === 'error' ? <AlertTriangle size={17} className="mt-0.5 shrink-0" /> : tone === 'warning' ? <WifiOff size={17} className="mt-0.5 shrink-0" /> : <Check size={17} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      {onDismiss && <button type="button" onClick={onDismiss} data-testid="button-dismiss-notice" className="shrink-0 opacity-70 hover:opacity-100"><X size={15} /></button>}
    </div>
  );
}

function LoadingLines() {
  return <div className="space-y-3" data-testid="status-loading"><div className="h-16 animate-pulse rounded-2xl bg-[#edf0e7]" /><div className="h-16 animate-pulse rounded-2xl bg-[#edf0e7]" /></div>;
}

function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#cbd6ca] bg-[#f5f6ef] px-5 py-9 text-center" data-testid="state-empty">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dceae1] text-[#166b58]"><MapPinned size={20} /></div>
      <h3 className="font-bold text-[#29362f]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[260px] text-xs leading-relaxed text-[#6d796e]">{copy}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function WayfinderPage() {
  const [view, setView] = useState<View>('map');
  const [regions, setRegions] = useState<DownloadedRegion[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Coordinate | null>(null);
  const [nearbyZones, setNearbyZones] = useState<SafeZone[]>([]);
  const [route, setRoute] = useState<SafetyRoute | null>(null);
  const [routeStep, setRouteStep] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [radius, setRadius] = useState(15);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadBytes, setDownloadBytes] = useState({ downloaded: 0, total: 0 });
  const [downloadError, setDownloadError] = useState('');
  const [locatePrompt, setLocatePrompt] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [saveName, setSaveName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [contact, setContact] = useState(() => {
    try {
      return localStorage.getItem('wayfinder-emergency-contact') ?? '';
    } catch {
      return '';
    }
  });
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const downloadToken = useRef(0);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setStatusMessage('Connection restored. Downloading can resume when you are ready.');
    };
    const goOffline = () => {
      setOnline(false);
      setDownloadState((state) => state === 'running' ? 'paused' : state);
      setStatusMessage('You are offline. Existing downloaded map data remains available.');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const refreshStoredData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [storedRegions, storedSaved] = await Promise.all([getDownloadedRegions(), getSavedLocations()]);
      setRegions(storedRegions);
      setSavedLocations(storedSaved);
      if (storedRegions[0]) setCenter((current) => current ?? storedRegions[0].center);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Stored map data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshStoredData(); }, [refreshStoredData]);

  const refreshStorageStatus = useCallback(async () => {
    try {
      setStorageStatus(await getStorageStatus());
    } catch {
      setStorageStatus(null);
    }
  }, []);

  useEffect(() => { void refreshStorageStatus(); }, [refreshStorageStatus]);

  useEffect(() => {
    try {
      if (contact.trim()) localStorage.setItem('wayfinder-emergency-contact', contact.trim());
      else localStorage.removeItem('wayfinder-emergency-contact');
    } catch {
      // Keeping the contact on-device is best-effort if browser storage is blocked.
    }
  }, [contact]);

  useEffect(() => {
    if (!selectedPlace || !online) {
      if (!selectedPlace) setNearbyZones([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadNearbySafetyData(selectedPlace.center, radius).then((zones) => {
        if (!cancelled) setNearbyZones(zones);
      }).catch(() => {
        if (!cancelled) setNearbyZones([]);
      });
    }, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [online, radius, selectedPlace]);

  useEffect(() => {
    if (!currentPosition) return;
    let cancelled = false;
    void loadNearbySafetyData(currentPosition, 25).then((zones) => {
      if (!cancelled) setNearbyZones(zones);
    }).catch(() => {
      if (!cancelled) {
        const localZones = regions
          .filter((region) => isPositionCoveredByDownloadedRegion(currentPosition, [region]))
          .flatMap((region) => region.safeZones);
        setNearbyZones(localZones);
      }
    });
    return () => { cancelled = true; };
  }, [currentPosition, online, regions]);

  useEffect(() => {
    if (!route) return;
    let watchId: number;
    try {
      watchId = watchCurrentPosition(setCurrentPosition, (error) => {
        setStatusMessage(`GPS update paused: ${error.message} Your last position and route remain visible.`);
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'GPS updates are unavailable.');
      return;
    }
    return () => stopWatchingPosition(watchId);
  }, [route]);

  useEffect(() => {
    if (!voiceGuidance || !route || !('speechSynthesis' in window)) return;
    const step = route.steps[routeStep];
    if (!step) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(step.instruction));
    return () => window.speechSynthesis.cancel();
  }, [route, routeStep, voiceGuidance]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const results = await searchPlaces(query.trim());
      setSearchResults(results);
      if (!online && results.length === 0) {
        setSearchError('No offline map is available for that area. Connect to search and download it first.');
      }
      setView('explore');
      setPanelOpen(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search is unavailable right now.');
    } finally {
      setSearching(false);
    }
  };

  const choosePlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setCenter(place.center);
    setView('downloads');
    setPanelOpen(true);
    setDownloadState('idle');
    setDownloadPercent(0);
    setDownloadError('');
  };

  const beginDownload = async () => {
    if (!selectedPlace || !online || downloadState === 'running') return;
    setDownloadError('');
    setDownloadState('running');
    const token = ++downloadToken.current;
    try {
      const region = await downloadRegion(selectedPlace, radius, (progress) => {
        if (token !== downloadToken.current) return;
        setDownloadPercent(progress.percent);
        setDownloadBytes({ downloaded: progress.bytesDownloaded, total: progress.bytesTotal });
        if (!navigator.onLine) setDownloadState('paused');
      });
      if (!navigator.onLine || token !== downloadToken.current) {
        setDownloadState('paused');
        setDownloadError('The connection dropped before this region finished. Nothing was marked complete.');
        return;
      }
      setDownloadState('complete');
      setRegions((previous) => [...previous.filter((item) => item.id !== region.id), region]);
      setNearbyZones(region.safeZones);
      setStatusMessage(`${region.label} is ready for offline use.`);
      void refreshStorageStatus();
    } catch (error) {
      if (token !== downloadToken.current) return;
      setDownloadState(navigator.onLine ? 'error' : 'paused');
      setDownloadError(error instanceof Error ? error.message : 'Download stopped before completion. Please try again.');
    }
  };

  const removeRegion = async (region: DownloadedRegion) => {
    if (!window.confirm(`Delete the offline map for ${region.label}?`)) return;
    try {
      await deleteDownloadedRegion(region.id);
      setRegions((previous) => previous.filter((item) => item.id !== region.id));
      setStatusMessage(`${region.label} removed from this device.`);
      void refreshStorageStatus();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not delete this region.');
    }
  };

  const openRegion = (region: DownloadedRegion) => {
    setCenter(region.center);
    setNearbyZones(region.safeZones);
    setSelectedPlace({ id: region.id, label: region.label, subtitle: region.subtitle, center: region.center });
    setView('map');
    setPanelOpen(false);
  };

  const requestLocation = async () => {
    setLocating(true);
    setLocationError('');
    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);
      setCenter(position);
      setLocatePrompt(false);
      setStatusMessage('Your position is shown on the map. It is only used on this device.');
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Location permission was not granted.');
    } finally {
      setLocating(false);
    }
  };

  const startRoute = () => {
    if (!currentPosition) {
      setLocatePrompt(true);
      return;
    }
    const nextRoute = routeToNearestSafeZone(currentPosition, regions);
    if (!nextRoute) {
      setStatusMessage('No downloaded route to a mapped safe zone is available yet.');
      setView('downloads');
      setPanelOpen(true);
      return;
    }
    setRoute(nextRoute);
    setRouteStep(0);
    setView('map');
    setPanelOpen(true);
  };

  const startZoneRoute = (zone: SafeZone) => {
    if (!currentPosition) {
      setLocatePrompt(true);
      return;
    }
    const nextRoute = routeToSafeZone(currentPosition, zone, regions);
    if (!nextRoute) {
      setStatusMessage('No downloaded walking route reaches this mapped place from your current position.');
      return;
    }
    setRoute(nextRoute);
    setRouteStep(0);
    setView('map');
    setPanelOpen(true);
  };

  const saveCurrent = async () => {
    if (!center || !saveName.trim()) return;
    setSaveError('');
    try {
      const saved = await saveLocation(saveName.trim(), center);
      setSavedLocations((previous) => [saved, ...previous]);
      setSaveName('');
      setStatusMessage(`${saved.name} saved on this device.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this place.');
    }
  };

  const removeSaved = async (saved: SavedLocation) => {
    try {
      await deleteSavedLocation(saved.id);
      setSavedLocations((previous) => previous.filter((item) => item.id !== saved.id));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not remove this place.');
    }
  };

  const estimatedStorageBytes = estimateRegionBytes(radius);
  const estimatedStorage = Math.max(1, Math.round(estimatedStorageBytes / 1024 / 1024));
  const lowStorage = Boolean(storageStatus && storageStatus.availableBytes < estimatedStorageBytes);
  const totalSafeZones = useMemo(() => regions.reduce((count, region) => count + region.safeZones.length, 0), [regions]);
  const visibleZones = useMemo(() => {
    const zones = nearbyZones.length ? nearbyZones : regions.flatMap((region) => region.safeZones);
    return Array.from(new Map(zones.map((zone) => [zone.id, zone])).values())
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, 5);
  }, [nearbyZones, regions]);
  const storedBytes = useMemo(() => regions.reduce((total, region) => total + region.storageBytes, 0), [regions]);
  const isRouteView = Boolean(route && view === 'map');

  return (
    <main className="wayfinder-app min-h-[100dvh] overflow-hidden bg-[#f4f2eb] text-[#202b27]">
      <header className="wayfinder-topbar">
        <div className="flex items-center gap-3">
          <div className="brand-mark"><Navigation size={18} strokeWidth={2.5} /></div>
          <div><p className="brand-name">wayfinder</p><p className="brand-tag">find firmer ground</p></div>
        </div>
        <div className={`connection-pill ${online ? 'is-online' : 'is-offline'}`} data-testid="status-connection">
          {online ? <Wifi size={14} /> : <WifiOff size={14} />} {online ? 'Online' : 'Offline'}
        </div>
        <button type="button" onClick={() => { setView('sos'); setPanelOpen(true); }} data-testid="button-open-sos" className="sos-top-button"><Siren size={16} /> SOS</button>
      </header>

      <section className="wayfinder-workspace">
        <div className="map-stage">
          <MapCanvas center={center} currentPosition={currentPosition} regions={regions} nearbyZones={nearbyZones} route={route} coverageRadiusKm={view === 'downloads' && selectedPlace ? radius : undefined} />
          <form onSubmit={handleSearch} className="map-search">
            <Search size={18} className="shrink-0 text-[#758178]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-place" placeholder="Search a town, city, or landmark" aria-label="Search a town, city, or landmark" />
            {query && <button type="button" onClick={() => { setQuery(''); setSearchResults([]); }} data-testid="button-clear-search" className="text-[#879187]"><X size={16} /></button>}
            <button type="submit" disabled={searching} data-testid="button-search-place" className="search-submit">{searching ? '...' : 'Search'}</button>
          </form>
          <div className="map-controls">
            <button type="button" onClick={() => setLocatePrompt(true)} data-testid="button-locate-me" title="Show my location"><LocateFixed size={18} /></button>
            <button type="button" onClick={() => setStatusMessage('Zoom with the map controls. Dashed roads are marked flood-risk roads from downloaded data.')} data-testid="button-map-help" title="Map help"><CircleHelp size={18} /></button>
          </div>
          {route && (
            <div className="route-map-chip" data-testid="status-route-active"><RouteIcon size={16} /><span>Safety route active</span><button type="button" onClick={() => setRoute(null)} data-testid="button-clear-route"><X size={14} /></button></div>
          )}
        </div>

        <aside className={`wayfinder-panel ${panelOpen ? 'panel-open' : ''}`}>
          <button type="button" className="panel-handle" onClick={() => setPanelOpen(false)} data-testid="button-close-panel"><ChevronDown size={20} /></button>
          {statusMessage && <div className="panel-status" data-testid="status-message"><Check size={14} /> {statusMessage}<button type="button" onClick={() => setStatusMessage('')} data-testid="button-dismiss-status"><X size={13} /></button></div>}
          {loadError && <Notice tone="error" onDismiss={() => setLoadError('')}>{loadError}</Notice>}
          {locationError && <Notice tone="error" onDismiss={() => setLocationError('')}>{locationError}</Notice>}
          {searchError && <Notice tone="error" onDismiss={() => setSearchError('')}>{searchError}</Notice>}
          {view === 'map' && !isRouteView && (
            <div className="fade-up">
              <PanelHeader eyebrow="Right now" title="A calmer way forward" />
              <div className="hero-card">
                <div className="hero-card-glow" />
                <div className="relative"><p className="mono text-[10px] uppercase tracking-[.18em] text-[#b9d5c9]">Your map, even without signal</p><h1 className="mt-2 max-w-[270px] text-[24px] font-extrabold leading-[1.08] tracking-[-.04em] text-[#fffaf0]">Know where to go when the water rises.</h1><p className="mt-3 max-w-[290px] text-xs leading-relaxed text-[#c4d7cc]">Download an area before you need it. Wayfinder uses roads and safe zones from OpenStreetMap data and keeps them on this device.</p></div>
                <button type="button" onClick={() => setView('explore')} data-testid="button-explore-start" className="hero-card-action">Explore an area <ArrowRight size={16} /></button>
              </div>
              <div className="quick-actions">
                <button type="button" onClick={() => setLocatePrompt(true)} data-testid="button-find-location"><span className="quick-icon green"><LocateFixed size={17} /></span><span><b>Find my position</b><small>Ask for GPS when you’re ready</small></span></button>
                <button type="button" onClick={startRoute} data-testid="button-start-safety-route"><span className="quick-icon yellow"><RouteIcon size={17} /></span><span><b>Find safe ground</b><small>{regions.length ? `${totalSafeZones} mapped safe zones` : 'Needs downloaded map data'}</small></span></button>
              </div>
              <section className="mt-5" aria-labelledby="nearby-zones-title">
                <div className="section-divider"><span id="nearby-zones-title">Mapped safety places</span><b>{nearbyZones.length || totalSafeZones}</b></div>
                {visibleZones.length === 0 ? (
                  <p className="map-note"><Shield size={16} /><span>No mapped safety places are available here yet. Open a downloaded area or search while connected.</span></p>
                ) : (
                  <div className="space-y-2">
                    {visibleZones.map((zone) => (
                      <div key={zone.id} className="stored-card" data-testid={`card-nearby-zone-${zone.id}`}>
                        <span className="place-pin"><MapPinned size={16} /></span>
                        <span className="min-w-0 flex-1"><b className="block truncate">{zone.name}</b><small>{zoneLabel(zone.type)}{zone.distanceKm !== undefined ? ` · ${zone.distanceKm.toFixed(1)} km · about ${zone.etaMinutes ?? '—'} min walking` : ''}</small></span>
                        <button type="button" onClick={() => startZoneRoute(zone)} data-testid={`button-navigate-zone-${zone.id}`} className="quiet-button px-3 py-2">Route</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-[#6d796e]">Places come from community-mapped OpenStreetMap records. They are not an official shelter registry, and opening hours or flood conditions may have changed.</p>
              </section>
              <div className="map-note"><Shield size={16} /><p><strong>Safety first.</strong> A mapped route is not a promise that conditions are safe. Check the water, listen locally, and use your judgement.</p></div>
            </div>
          )}

          {isRouteView && route && (
            <div className="fade-up">
              <PanelHeader eyebrow="Navigation mode" title="To the nearest mapped safe zone" onBack={() => setRoute(null)} />
              <div className="route-summary">
                <div><p className="mono route-kicker">based on downloaded OSM data</p><strong>{route.distanceKm.toFixed(1)} km</strong><span>distance</span></div>
                <div><strong>{route.durationMinutes}</strong><span>min walking estimate</span></div>
              </div>
              <Notice tone="warning">Flood conditions change quickly. Follow this route only as a reference, and confirm every crossing in the real world.</Notice>
              {route.warning.map((warning, index) => <div key={`${warning}-${index}`} className="route-warning" data-testid={`text-route-warning-${index}`}><AlertTriangle size={15} /> {warning}</div>)}
              <div className="route-next">
                <span className="step-index">{routeStep + 1}</span>
                <div><p className="mono text-[10px] uppercase tracking-[.16em] text-[#a46638]">Next instruction · {routeStep + 1} of {route.steps.length}</p><strong>{route.steps[routeStep]?.instruction ?? `Continue to ${route.destinationName}`}</strong><small>{(route.steps[routeStep]?.distanceKm ?? 0).toFixed(1)} km · {route.steps[routeStep]?.coordinate.lat.toFixed(5)}, {route.steps[routeStep]?.coordinate.lng.toFixed(5)}</small></div>
              </div>
              <button type="button" onClick={() => setRouteStep((step) => Math.min(step + 1, Math.max(route.steps.length - 1, 0)))} disabled={routeStep >= route.steps.length - 1} data-testid="button-next-route-step" className="primary-button w-full">{routeStep >= route.steps.length - 1 ? 'At final mapped point' : 'Next step'} <ArrowRight size={16} /></button>
              <button type="button" aria-pressed={voiceGuidance} disabled={!('speechSynthesis' in window)} onClick={() => setVoiceGuidance((enabled) => !enabled)} data-testid="button-toggle-voice-guidance" className="quiet-button mt-2 w-full">{voiceGuidance ? 'Turn off voice guidance' : 'Turn on voice guidance'}</button>
              <button type="button" onClick={() => setRoute(null)} data-testid="button-end-route" className="quiet-button mt-2 w-full">End navigation</button>
            </div>
          )}

          {view === 'explore' && (
            <div className="fade-up">
              <PanelHeader eyebrow="Explore" title="Start with a place" onBack={() => setView('map')} />
              {!online && <Notice tone="warning">Search needs a connection. Your downloaded places remain available in Downloads.</Notice>}
              {searching && <LoadingLines />}
              {!searching && !searchResults.length && <EmptyState title={online ? 'Search for somewhere you know' : 'No offline map found'} copy={online ? 'Find a town, neighborhood, or landmark to see its coverage options. Search results come from the map service.' : 'No offline map is available for that area. Connect to search and download it first.'} />}
              {!searching && searchResults.length > 0 && <div className="space-y-3">{searchResults.map((place) => <button type="button" key={place.id} onClick={() => choosePlace(place)} data-testid={`card-place-${place.id}`} className="place-result"><span className="place-pin"><MapPinned size={17} /></span><span><b>{place.label}</b><small>{place.subtitle}</small></span><ArrowRight size={16} /></button>)}</div>}
              <button type="button" onClick={() => setView('downloads')} data-testid="button-view-downloads" className="quiet-button mt-5 w-full"><Download size={16} /> View downloaded areas</button>
            </div>
          )}

          {view === 'downloads' && (
            <div className="fade-up">
              <PanelHeader eyebrow="Offline maps" title="Downloads" onBack={() => setView('map')} />
              {selectedPlace ? (
                <>
                  <div className="selected-place"><span className="place-pin"><MapPinned size={17} /></span><div><p className="mono text-[10px] uppercase tracking-[.15em] text-[#a46638]">New coverage</p><strong>{selectedPlace.label}</strong><small>{selectedPlace.subtitle}</small></div><button type="button" onClick={() => setSelectedPlace(null)} data-testid="button-clear-selected-place"><X size={16} /></button></div>
                  <div className="download-settings">
                    <div className="flex items-end justify-between"><div><p className="label-caps">Coverage radius</p><strong className="text-2xl tracking-[-.04em]">{radius}<span className="ml-1 text-sm font-semibold text-[#78847b]">km</span></strong></div><span className="mono text-xs text-[#78847b]">5 — 90 km</span></div>
                    <input type="range" min="5" max="90" value={radius} onChange={(event) => setRadius(Number(event.target.value))} data-testid="input-download-radius" className="coverage-slider" />
                    <div className="coverage-estimates"><div><span>Area</span><b>{(Math.PI * radius * radius).toFixed(0)} km²</b></div><div><span>Est. storage</span><b>~{estimatedStorage} MB</b></div><div><span>Safe zones</span><b>{nearbyZones.length}</b></div></div>
                  </div>
                  {lowStorage && <Notice tone="warning">This area may use more storage than your browser currently has available. Choose a smaller radius or clear device space before downloading.</Notice>}
                  {downloadError && <Notice tone="error" onDismiss={() => setDownloadError('')}>{downloadError}</Notice>}
                  {!online && <Notice tone="warning">You’re offline. Downloads pause safely and will not be marked complete. Reconnect to resume.</Notice>}
                  <div className="download-progress">
                    {downloadState === 'running' || downloadState === 'paused' ? <><div className="flex items-center justify-between"><span className="label-caps">{downloadState === 'paused' ? 'Paused safely' : 'Preparing offline map'}</span><b className="mono text-xs">{downloadPercent}%</b></div><div className="progress-track"><div style={{ width: `${downloadPercent}%` }} /></div><p>{formatBytes(downloadBytes.downloaded)} of {formatBytes(downloadBytes.total)} · {downloadState === 'paused' ? 'Partial data is kept locally; this area is not ready until the download finishes.' : 'Keep this tab open while it downloads.'}</p></> : downloadState === 'complete' ? <div className="download-complete"><Check size={18} /><span><b>Ready offline</b><small>{nearbyZones.length} mapped safety places · road routing data stored locally</small></span></div> : <button type="button" onClick={beginDownload} disabled={!online || lowStorage} data-testid="button-download-region" className="primary-button w-full"><Download size={17} /> Download this area</button>}
                    {downloadState === 'paused' && <button type="button" onClick={beginDownload} disabled={!online} data-testid="button-resume-download" className="primary-button mt-3 w-full"><Download size={17} /> Resume download</button>}
                    {downloadState === 'error' && <button type="button" onClick={beginDownload} disabled={!online} data-testid="button-retry-download" className="primary-button w-full"><Download size={17} /> Try download again</button>}
                  </div>
                </>
              ) : <div className="mb-6"><button type="button" onClick={() => setView('explore')} data-testid="button-find-area" className="primary-button w-full"><Search size={17} /> Find an area to download</button></div>}
              <div className="section-divider"><span>On this device</span><b>{regions.length} {regions.length === 1 ? 'area' : 'areas'}</b></div>
              {regions.length > 0 && <p className="mb-3 text-xs text-[#6d796e]" data-testid="text-storage-used">About {formatBytes(storedBytes)} stored locally{storageStatus?.quotaBytes ? ` · browser space ${formatBytes(storageStatus.usageBytes)} of ${formatBytes(storageStatus.quotaBytes)}` : ''}</p>}
              {loading ? <LoadingLines /> : regions.length === 0 ? <EmptyState title="No offline areas yet" copy="Download an area while you have a connection. It will include available road geometry, a local walking graph, and mapped safety places." /> : <div className="space-y-3">{regions.map((region) => <div key={region.id} className="stored-card" data-testid={`card-region-${region.id}`}><button type="button" onClick={() => openRegion(region)} data-testid={`button-open-region-${region.id}`} className="stored-card-main"><span className="place-pin"><Download size={16} /></span><span><b>{region.label}</b><small>{region.subtitle} · {region.radiusKm} km · {formatBytes(region.storageBytes)}</small><small>{region.safeZones.length} mapped safety places · Downloaded {formatDate(region.downloadedAt)}</small></span><ArrowRight size={16} /></button><button type="button" onClick={() => void removeRegion(region)} data-testid={`button-delete-region-${region.id}`} className="icon-danger" title={`Delete ${region.label}`}><Trash2 size={15} /></button></div>)}</div>}
            </div>
          )}

          {view === 'saved' && (
            <div className="fade-up">
              <PanelHeader eyebrow="Your places" title="Saved" onBack={() => setView('map')} />
              {saveError && <Notice tone="error" onDismiss={() => setSaveError('')}>{saveError}</Notice>}
              <div className="save-box"><p className="label-caps">Save the current map center</p><div className="save-input-row"><input value={saveName} onChange={(event) => setSaveName(event.target.value)} data-testid="input-save-name" placeholder="e.g. Home, auntie’s shop" /><button type="button" onClick={() => void saveCurrent()} disabled={!center || !saveName.trim()} data-testid="button-save-location"><Bookmark size={17} /></button></div><small>Saved places stay on this device. Move the map or use your position first.</small></div>
              {loading ? <LoadingLines /> : savedLocations.length === 0 ? <EmptyState title="Nothing saved yet" copy="Save a familiar place so it is one tap away when you need it." /> : <div className="space-y-3">{savedLocations.map((saved) => <div key={saved.id} className="stored-card" data-testid={`card-saved-${saved.id}`}><button type="button" onClick={() => { setCenter(saved.position); setView('map'); setPanelOpen(false); }} data-testid={`button-open-saved-${saved.id}`} className="stored-card-main"><span className="place-pin"><Bookmark size={16} /></span><span><b>{saved.name}</b><small>{saved.position.lat.toFixed(4)}, {saved.position.lng.toFixed(4)}</small></span><ArrowRight size={16} /></button><button type="button" onClick={() => void removeSaved(saved)} data-testid={`button-delete-saved-${saved.id}`} className="icon-danger" title={`Delete ${saved.name}`}><Trash2 size={15} /></button></div>)}</div>}
            </div>
          )}

          {view === 'sos' && (
            <div className="fade-up sos-panel">
              <PanelHeader eyebrow="Emergency" title="SOS" onBack={() => setView('map')} />
              <div className="sos-callout"><Siren size={21} /><div><strong>Share your location by text</strong><p>This opens your phone’s native SMS composer. Wayfinder does not send messages in the background.</p></div></div>
              {!currentPosition && <Notice tone="warning">Allow location first so your message can include where you are. Your position is only requested after you tap the button.</Notice>}
              <label className="field-label" htmlFor="emergency-contact">Emergency contact</label>
              <input id="emergency-contact" value={contact} onChange={(event) => setContact(event.target.value)} data-testid="input-emergency-contact" className="full-input" placeholder="Phone number or contact name" />
              <p className="field-help">Use a number your phone can open in its SMS composer.</p>
              {sosSent ? <div className="sos-sent" data-testid="status-sos-sent"><Check size={20} /><div><b>SMS composer opened</b><small>Confirm the message and send it from your phone.</small></div></div> : <button type="button" onClick={() => { if (!currentPosition) setLocatePrompt(true); else setSosConfirm(true); }} disabled={!contact.trim()} data-testid="button-send-sos" className="sos-action"><Phone size={18} /> Share location by SMS</button>}
              <p className="sos-footnote"><Shield size={14} /> If you are in immediate danger, contact local emergency services as well.</p>
            </div>
          )}
          <nav className="panel-nav" aria-label="Wayfinder sections">{navItems.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => { setView(id); setPanelOpen(true); }} data-testid={`nav-${id}`} className={view === id ? 'is-active' : ''}><Icon size={17} /><span>{label}</span>{id === 'downloads' && regions.length > 0 && <em>{regions.length}</em>}</button>)}<button type="button" onClick={() => { setView('sos'); setPanelOpen(true); }} data-testid="nav-sos" className={`nav-sos ${view === 'sos' ? 'is-active' : ''}`}><Siren size={17} /><span>SOS</span></button></nav>
        </aside>
      </section>

      <button type="button" className="mobile-panel-toggle" onClick={() => setPanelOpen((open) => !open)} data-testid="button-toggle-panel"><Menu size={18} /> {panelOpen ? 'Hide panel' : 'Open Wayfinder'}</button>

      {locatePrompt && <div className="dialog-backdrop"><div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="location-title"><button type="button" onClick={() => setLocatePrompt(false)} data-testid="button-close-location-dialog" className="dialog-close"><X size={18} /></button><div className="dialog-symbol"><LocateFixed size={22} /></div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#a46638]">Before we locate you</p><h2 id="location-title">Use your current position?</h2><p>Wayfinder needs your device location to show where you are, start a route, or include your position in an SOS message. We only ask after you choose to continue.</p><div className="dialog-actions"><button type="button" onClick={() => setLocatePrompt(false)} data-testid="button-cancel-location" className="quiet-button">Not now</button><button type="button" onClick={() => void requestLocation()} disabled={locating} data-testid="button-confirm-location" className="primary-button">{locating ? 'Locating…' : 'Use my location'}</button></div></div></div>}
      {sosConfirm && <div className="dialog-backdrop"><div className="dialog-card sos-dialog" role="dialog" aria-modal="true" aria-labelledby="sos-title"><button type="button" onClick={() => setSosConfirm(false)} data-testid="button-close-sos-dialog" className="dialog-close"><X size={18} /></button><div className="dialog-symbol danger"><Siren size={22} /></div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#b6432f]">Confirm SOS message</p><h2 id="sos-title">Open your SMS composer?</h2><p>Your phone will open a new text to <strong>{contact}</strong> with your current coordinates. Check conditions around you before moving.</p><div className="dialog-actions"><button type="button" onClick={() => setSosConfirm(false)} data-testid="button-cancel-sos" className="quiet-button">Cancel</button><button type="button" onClick={() => { if (currentPosition) shareLocationBySms(currentPosition, contact.trim()); setSosConfirm(false); setSosSent(true); }} data-testid="button-confirm-sos" className="sos-action">Open SMS composer</button></div></div></div>}
    </main>
  );
}

export default WayfinderPage;