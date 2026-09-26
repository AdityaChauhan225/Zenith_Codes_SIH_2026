"""
Physical Hydrology & Geomorphology Flash-Flood Dataset Generator for Hilly Regions in India.

This module simulates realistic, physically-grounded hydrological events across
Indian mountainous zones (e.g., Uttarakhand, Himachal Pradesh, Western Ghats, Nilgiris).
It models:
  - SCS Curve Number (SCS-CN) runoff physics across land cover types and Antecedent Moisture Conditions (AMC I/II/III).
  - Monsoon burst and cloudburst intensity distributions.
  - Topographic wetness, steep slope kinematics, and riparian drainage proximity.
  - Historical incident density based on landslide/debris flow inventories.
  - Strict timestamp generation across 2021-2024 monsoon seasons for leak-free time splits.
"""

import os
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def scs_curve_number_runoff(rainfall_24h_mm: np.ndarray,
                            land_cover: np.ndarray,
                            amc: np.ndarray) -> np.ndarray:
    """
    Computes direct hydrological runoff Q (mm) using the SCS Curve Number method:
      Q = (P - Ia)^2 / (P - Ia + S)   for P > Ia, else 0
    where Ia = 0.2 * S (initial abstraction), S = (25400 / CN) - 254.
    Curve Numbers are adjusted for Antecedent Moisture Condition (AMC I, II, III).
    """
    # Baseline CN (AMC II - Normal) for Indian hill terrain
    base_cn_map = {
        'forest': 60.0,       # High canopy interception, deep leaf litter
        'agriculture': 76.0,  # Terraced slopes, crop cover
        'barren': 86.0,       # Rocky scree, sparse alpine scrub, low infiltration
        'urban': 93.0         # Built-up, concrete roads, town settlements
    }

    n_samples = len(land_cover)
    runoff = np.zeros(n_samples)

    for i in range(n_samples):
        cn_ii = base_cn_map.get(land_cover[i], 75.0)
        condition = amc[i]

        # AMC adjustments
        if condition == 'dry':  # AMC I
            cn = cn_ii / (2.281 - 0.01281 * cn_ii)
        elif condition == 'wet':  # AMC III
            cn = cn_ii / (0.427 + 0.00573 * cn_ii)
        else:  # AMC II
            cn = cn_ii

        cn = np.clip(cn, 30.0, 98.0)
        s_mm = (25400.0 / cn) - 254.0
        ia_mm = 0.2 * s_mm  # standard initial abstraction

        p = rainfall_24h_mm[i]
        if p > ia_mm:
            q = ((p - ia_mm) ** 2) / (p - ia_mm + s_mm)
        else:
            q = 0.0
        runoff[i] = q

    return runoff

def generate_synthetic_data(n_samples: int = 6000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a physically-plausible flash flood dataset for Indian mountain catchments.
    """
    rng = np.random.RandomState(random_state)

    # 1. Temporal index: Consecutive monsoon seasons (June 15 - Sept 30) for 2021-2024
    # Train period: 2021-2023, Test period: 2024
    years = [2021, 2022, 2023, 2024]
    year_samples = [int(n_samples * 0.25), int(n_samples * 0.25), int(n_samples * 0.25), n_samples - 3 * int(n_samples * 0.25)]

    timestamps = []
    for y_idx, year in enumerate(years):
        start_date = datetime(year, 6, 15)
        end_date = datetime(year, 9, 30)
        delta_days = (end_date - start_date).days
        count = year_samples[y_idx]

        for _ in range(count):
            day_offset = rng.randint(0, delta_days)
            hour = rng.randint(0, 24)
            minute = rng.choice([0, 15, 30, 45])
            ts = start_date + timedelta(days=day_offset, hours=hour, minutes=int(minute))
            timestamps.append(ts)

    timestamps = sorted(timestamps)

    # 2. Land Cover Class distribution
    # Western Himalayas / Western Ghats distribution: Forest (45%), Agriculture (25%), Barren (18%), Urban (12%)
    land_cover_classes = ['forest', 'agriculture', 'barren', 'urban']
    land_cover = rng.choice(land_cover_classes, size=n_samples, p=[0.45, 0.25, 0.18, 0.12])

    # 3. Antecedent Moisture Condition (AMC)
    # Dry (30%), Normal (45%), Wet (25%)
    amc_classes = ['dry', 'normal', 'wet']
    amc = rng.choice(amc_classes, size=n_samples, p=[0.30, 0.45, 0.25])

    # 4. Geomorphological features
    # Slope: 5 to 60 degrees (gamma distribution skewed to steep terrain)
    slope_degrees = np.clip(rng.gamma(shape=5.0, scale=5.0, size=n_samples) + 8.0, 5.0, 65.0)

    # Elevation: 300m (valleys) to 3600m (high ridges)
    elevation_m = np.clip(rng.normal(loc=1600.0, scale=600.0, size=n_samples), 300.0, 3600.0)

    # Aspect: 0 to 360 degrees
    aspect = rng.uniform(0.0, 360.0, size=n_samples)

    # Distance to nearest stream/torrent: 10m to 2500m (exponentially distributed)
    distance_to_nearest_stream_m = np.clip(rng.exponential(scale=350.0, size=n_samples) + 10.0, 10.0, 2500.0)

    # Historical incident density (incidents per sq km in last 10 years)
    # Landslide/flood catalog density typically 0.0 to 4.5
    historical_incident_density = np.clip(rng.exponential(scale=0.6, size=n_samples), 0.0, 5.0)

    # 5. Hydrometeorology (Rainfall simulation)
    # Most days have low-moderate rainfall, while convective cloudbursts create extreme spikes
    # Cloudburst indicator: ~4% chance of extreme convective precipitation
    is_convective_storm = rng.binomial(1, 0.06, size=n_samples)

    rainfall_1h_mm = np.zeros(n_samples)
    rainfall_3h_mm = np.zeros(n_samples)
    rainfall_6h_mm = np.zeros(n_samples)
    rainfall_24h_mm = np.zeros(n_samples)

    for i in range(n_samples):
        if is_convective_storm[i]:
            # Intense localized burst (e.g., 35-110 mm/hr cloudburst)
            r1 = rng.uniform(35.0, 115.0)
            r3 = r1 + rng.uniform(15.0, 50.0)
            r6 = r3 + rng.uniform(10.0, 40.0)
            r24 = r6 + rng.uniform(10.0, 60.0)
        else:
            # Orographic / general monsoon rain: exponential distribution
            # 60% dry or light rain (<5mm), 30% moderate (5-25mm), 10% heavy (25-60mm)
            weather_regime = rng.choice(['light', 'moderate', 'heavy'], p=[0.60, 0.30, 0.10])
            if weather_regime == 'light':
                r24 = rng.exponential(scale=4.0)
                r6 = r24 * rng.uniform(0.3, 0.7)
                r3 = r6 * rng.uniform(0.3, 0.7)
                r1 = r3 * rng.uniform(0.2, 0.6)
            elif weather_regime == 'moderate':
                r24 = rng.uniform(15.0, 55.0)
                r6 = r24 * rng.uniform(0.4, 0.75)
                r3 = r6 * rng.uniform(0.4, 0.8)
                r1 = r3 * rng.uniform(0.3, 0.65)
            else:
                r24 = rng.uniform(55.0, 140.0)
                r6 = r24 * rng.uniform(0.5, 0.85)
                r3 = r6 * rng.uniform(0.4, 0.8)
                r1 = r3 * rng.uniform(0.3, 0.65)

        rainfall_1h_mm[i] = max(0.0, round(float(r1), 2))
        rainfall_3h_mm[i] = max(rainfall_1h_mm[i], round(float(r3), 2))
        rainfall_6h_mm[i] = max(rainfall_3h_mm[i], round(float(r6), 2))
        rainfall_24h_mm[i] = max(rainfall_6h_mm[i], round(float(r24), 2))

    # 6. Soil Saturation Index (0.0 to 1.0)
    # Linked to AMC and 24h rainfall:
    amc_base_sat = {'dry': 0.20, 'normal': 0.50, 'wet': 0.80}
    soil_saturation = np.zeros(n_samples)
    for i in range(n_samples):
        base_sat = amc_base_sat[amc[i]]
        # Additional saturation from 24h rain
        rain_contrib = min(0.35, rainfall_24h_mm[i] / 200.0)
        sat = base_sat + rain_contrib + rng.normal(0, 0.05)
        soil_saturation[i] = np.clip(sat, 0.02, 0.99)

    # 7. Physical Runoff Calculation via SCS-CN
    runoff_mm = scs_curve_number_runoff(rainfall_24h_mm, land_cover, amc)

    # 8. Flash Flood Hazard Index (FFHI) Calculation
    # Combines physical determinants:
    #   - Short-term burst intensity (kinetic flooding)
    #   - Total runoff generation (volumetric flooding)
    #   - Steep slope kinematics (velocity of flood wave)
    #   - Proximity to stream channel (inundation buffer)
    #   - Pre-existing soil saturation (impeded infiltration)
    #   - Geomorphological susceptibility (historical incident inventory)

    hazard_scores = np.zeros(n_samples)
    for i in range(n_samples):
        # Peak intensity factor (0 - 1)
        intensity_factor = min(1.0, rainfall_1h_mm[i] / 65.0)

        # Runoff volume factor (0 - 1)
        runoff_factor = min(1.0, runoff_mm[i] / 90.0)

        # Kinetic slope factor: steeper slopes accelerate runoff into torrents
        slope_factor = np.sin(np.radians(slope_degrees[i]))

        # Stream proximity factor: closer to stream -> higher inundation hazard
        # Exponential decay: hazard drops sharply beyond 300m
        stream_factor = np.exp(-distance_to_nearest_stream_m[i] / 280.0)

        # Soil saturation factor: saturated soils cannot absorb peak surges
        sat_factor = (soil_saturation[i]) ** 1.4

        # Historical incident density factor
        hist_factor = min(1.0, historical_incident_density[i] / 3.0)

        # Weighted physical composite index:
        # In flash floods, 1h rain intensity and runoff are primary drivers
        raw_hazard = (
            0.32 * intensity_factor +
            0.28 * runoff_factor +
            0.15 * sat_factor +
            0.12 * stream_factor +
            0.08 * slope_factor +
            0.05 * hist_factor
        )

        # Add mild environmental turbulence / stochastic unmeasured microclimate noise
        noise = rng.normal(0.0, 0.035)
        hazard_scores[i] = np.clip(raw_hazard + noise, 0.0, 1.0)

    # 9. Classify into Risk Tiers (low, medium, high, critical)
    # Calibrated thresholds reflecting rare high-impact events:
    # Low: ~68%, Medium: ~18%, High: ~9%, Critical: ~5%
    risk_tiers = []
    for s in hazard_scores:
        if s < 0.28:
            risk_tiers.append("low")
        elif s < 0.52:
            risk_tiers.append("medium")
        elif s < 0.74:
            risk_tiers.append("high")
        else:
            risk_tiers.append("critical")

    df = pd.DataFrame({
        "timestamp": [ts.strftime("%Y-%m-%d %H:%M:%S") for ts in timestamps],
        "rainfall_1h_mm": np.round(rainfall_1h_mm, 2),
        "rainfall_3h_mm": np.round(rainfall_3h_mm, 2),
        "rainfall_6h_mm": np.round(rainfall_6h_mm, 2),
        "rainfall_24h_mm": np.round(rainfall_24h_mm, 2),
        "soil_saturation_index": np.round(soil_saturation, 4),
        "slope_degrees": np.round(slope_degrees, 2),
        "elevation_m": np.round(elevation_m, 1),
        "aspect": np.round(aspect, 1),
        "historical_incident_density": np.round(historical_incident_density, 3),
        "land_cover_class": land_cover,
        "distance_to_nearest_stream_m": np.round(distance_to_nearest_stream_m, 1),
        "antecedent_moisture_condition": amc,
        "risk_score": np.round(hazard_scores, 4),
        "risk_level": risk_tiers,
        "is_synthetic": True
    })

    return df

def merge_real_catalog(synthetic_df: pd.DataFrame, catalog_csv_path: str) -> pd.DataFrame:
    """
    Merges real historical catalog data (e.g. NASA Global Landslide Catalog / NDMA records)
    with the synthetic baseline if provided.
    """
    if not os.path.exists(catalog_csv_path):
        print(f"[WARN] Catalog path {catalog_csv_path} not found. Proceeding with synthetic dataset only.")
        return synthetic_df

    try:
        real_df = pd.read_csv(catalog_csv_path)
        required_cols = [
            "timestamp", "rainfall_1h_mm", "rainfall_3h_mm", "rainfall_6h_mm", "rainfall_24h_mm",
            "soil_saturation_index", "slope_degrees", "elevation_m", "aspect",
            "historical_incident_density", "land_cover_class", "distance_to_nearest_stream_m",
            "antecedent_moisture_condition", "risk_level"
        ]
        missing = [c for c in required_cols if c not in real_df.columns]
        if missing:
            print(f"[WARN] Real catalog missing required columns: {missing}. Skipping real merge.")
            return synthetic_df

        if "risk_score" not in real_df.columns:
            tier_score_map = {"low": 0.15, "medium": 0.40, "high": 0.65, "critical": 0.88}
            real_df["risk_score"] = real_df["risk_level"].map(tier_score_map).fillna(0.3)
        real_df["is_synthetic"] = False

        merged = pd.concat([synthetic_df, real_df], ignore_index=True)
        merged["timestamp"] = pd.to_datetime(merged["timestamp"])
        merged = merged.sort_values("timestamp").reset_index(drop=True)
        merged["timestamp"] = merged["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[INFO] Merged {len(real_df)} real catalog records with {len(synthetic_df)} synthetic records.")
        return merged
    except Exception as e:
        print(f"[ERROR] Failed to parse real catalog: {e}. Falling back to synthetic.")
        return synthetic_df

def main():
    parser = argparse.ArgumentParser(description="Generate physically-plausible flash-flood dataset for Indian hill regions.")
    parser.add_argument("--samples", type=int, default=6000, help="Number of records to generate (default: 6000)")
    parser.add_argument("--output", type=str, default="data/flash_flood_data.csv", help="Output CSV path")
    parser.add_argument("--real-catalog", type=str, default="", help="Optional path to real historical incident CSV")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    print(f"Generating {args.samples} physically-consistent flash-flood records...")
    df = generate_synthetic_data(n_samples=args.samples, random_state=args.seed)

    if args.real_catalog:
        df = merge_real_catalog(df, args.real_catalog)

    df.to_csv(args.output, index=False)
    print(f"Saved dataset to {args.output}")
    print("\nClass distribution (Risk Tiers):")
    print(df["risk_level"].value_counts(normalize=True).round(4) * 100)
    print(f"\nTime range: {df['timestamp'].min()} to {df['timestamp'].max()}")

if __name__ == "__main__":
    main()
