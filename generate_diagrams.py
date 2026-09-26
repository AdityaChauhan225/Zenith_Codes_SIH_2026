"""
Generate high-resolution architecture diagrams for the Zenith Codes Flash Flood Risk System.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image

# Allow larger images if needed
Image.MAX_IMAGE_PIXELS = None

os.makedirs("reports", exist_ok=True)

def generate_system_architecture_diagram():
    fig, ax = plt.subplots(figsize=(14, 10), dpi=150)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Color palette
    c_blue = '#0284c7'
    c_cyan = '#06b6d4'
    c_emerald = '#10b981'
    c_amber = '#f59e0b'
    c_rose = '#f43f5e'
    c_purple = '#8b5cf6'
    c_card = '#1e293b'
    c_text = '#f8fafc'
    c_muted = '#94a3b8'

    # Title
    ax.text(7, 9.6, "ZENITH CODES (SIH 2026) - END-TO-END SYSTEM ARCHITECTURE", 
            ha='center', va='center', color=c_text, fontsize=15, fontweight='bold', family='sans-serif')
    ax.text(7, 9.25, "Hilly Mountain Catchments Flash-Flood Prediction, Nowcasting & Offline-First Emergency SOS Platform", 
            ha='center', va='center', color=c_cyan, fontsize=9.5, family='sans-serif')

    def draw_layer_box(y, height, title, subtitle, color):
        rect = patches.FancyBboxPatch((0.4, y), 13.2, height, boxstyle="round,pad=0.08,rounding_size=0.12",
                                      facecolor=c_card, edgecolor=color, linewidth=1.5)
        ax.add_patch(rect)
        ax.text(0.7, y + height - 0.22, title, color=color, fontsize=10.5, fontweight='bold', family='sans-serif')
        ax.text(0.7, y + height - 0.44, subtitle, color=c_muted, fontsize=7.8, family='sans-serif')

    def draw_sub_card(x, y, w, h, title, lines, accent_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.08",
                                      facecolor='#111827', edgecolor=accent_color, linewidth=1.0)
        ax.add_patch(rect)
        ax.text(x + 0.15, y + h - 0.20, title, color='#ffffff', fontsize=8.2, fontweight='bold', family='sans-serif')
        for idx, line in enumerate(lines):
            ax.text(x + 0.15, y + h - 0.38 - idx * 0.16, line, color=c_muted, fontsize=7.0, family='sans-serif')

    # LAYER 1: DATA SOURCES & INGESTION (Top)
    draw_layer_box(7.3, 1.6, "LAYER 1: DATA INGESTION & GEOSPATIAL TELEMETRY", "Parallel multi-threaded REST/GIS connectors with failover endpoints", c_blue)
    draw_sub_card(0.6, 7.42, 2.3, 0.95, "Open-Meteo Weather API", ["• Hourly Precipitation", "• Volumetric Soil Moisture", "• Surface Pressure & RH"], c_blue)
    draw_sub_card(3.1, 7.42, 2.3, 0.95, "Copernicus 30m DEM", ["• 3x3 Elevation Matrix", "• Horn's Spatial Gradient", "• Slope Deg & Azimuth Aspect"], c_blue)
    draw_sub_card(5.6, 7.42, 2.3, 0.95, "OSM Overpass Hydro", ["• River / Torrent Ways", "• Geodesic Line Segment Proj.", "• Multi-endpoint fallback"], c_blue)
    draw_sub_card(8.1, 7.42, 2.3, 0.95, "Land Cover & Soils", ["• ESA WorldCover 10m", "• Nominatim Reverse GIS", "• 4 Canonical Soil Classes"], c_blue)
    draw_sub_card(10.6, 7.42, 2.8, 0.95, "Historical Inventory", ["• NASA GLC & EONET v3", "• 10km Buffer Event Count", "• Target Incident Exclusion"], c_blue)

    # LAYER 2: 2-TIER CACHE & PIPELINE ASSEMBLER
    draw_layer_box(5.5, 1.5, "LAYER 2: HIGH-PERFORMANCE CACHE & FEATURE ASSEMBLER", "Thread-safe 2-tier caching reducing latency from ~4.2s to sub-millisecond (0.4ms)", c_emerald)
    draw_sub_card(0.6, 5.62, 3.8, 0.88, "WeatherCache (TTL = 1800s)", ["• In-memory 30-min time-to-live cache", "• Spatial grid quantization: 0.01 deg (~1.1 km)", "• Thread-safe lock concurrency"], c_emerald)
    draw_sub_card(4.7, 5.62, 3.8, 0.88, "StaticCache (Persistent)", ["• Long-lived DEM, Slope, Aspect & Streams", "• Fine grid quantization: 0.0001 deg (~11m)", "• Swappable Redis/In-Memory backend"], c_emerald)
    draw_sub_card(8.8, 5.62, 4.6, 0.88, "Exact 12-Feature Pipeline Assembler", ["• Strict 120h AMC calculation (excl. target hr)", "• ThreadPoolExecutor(max_workers=5)", "• Strict JSON Contract & Schema Validators"], c_emerald)

    # LAYER 3: AI / ML & DEEP LEARNING CORE
    draw_layer_box(3.5, 1.7, "LAYER 3: AI/ML MODELING & EXPLAINABILITY ENGINE", "Hydrological SCS-CN Physics + XGBoost Classifier + PyTorch GRU Nowcaster + SHAP", c_purple)
    draw_sub_card(0.6, 3.62, 3.8, 1.05, "PyTorch GRU Rainfall Nowcaster", ["• 2-Layer Recurrent Neural Network", "• Input: 24h past [Rain, RH, Baro]", "• Output: 6h cumulative precipitation", "• Proactive feature enrichment"], c_purple)
    draw_sub_card(4.7, 3.62, 4.0, 1.05, "XGBoost 4-Tier Classifier", ["• Multiclass: Low, Medium, High, Critical", "• Balanced class weighting for rare bursts", "• Time-based leak-free train/test holdout", "• Macro F1: 0.8127 | Accuracy: 89.4%"], c_purple)
    draw_sub_card(9.0, 3.62, 4.4, 1.05, "SHAP Local Explainability & Score", ["• TreeExplainer exact attribution values", "• Directional weighting [-1, 0, +1, +2]", "• Continuous calibrated score (0.01-0.99)", "• Human-readable causal explanations"], c_purple)

    # LAYER 4: REAL-TIME BACKEND & INCIDENT DISPATCH
    draw_layer_box(1.8, 1.4, "LAYER 4: REAL-TIME DISPATCH SERVER & SPATIAL ENGINE", "Node.js Express + Socket.IO Event Engine + Haversine Routing", c_amber)
    draw_sub_card(0.6, 1.92, 3.8, 0.82, "Express REST API Server", ["• Health & SOS Ingestion endpoints", "• 3-second rapid de-duplication filter", "• Status lifecycle (ACTIVE -> RESOLVED)"], c_amber)
    draw_sub_card(4.7, 1.92, 3.8, 0.82, "Socket.IO Real-Time Engine", ["• Bi-directional low-latency WebSockets", "• Broadcasts 'new_sos_alert' to command", "• Live status sync across all responders"], c_amber)
    draw_sub_card(8.8, 1.92, 4.6, 0.82, "Haversine Shelter Routing Engine", ["• Ingests verified shelter database", "• Real-time distance sorting & capacity checks", "• Direct evacuation route prioritization"], c_amber)

    # LAYER 5: CLIENTS, OFFLINE NODES & COMMAND
    draw_layer_box(0.1, 1.4, "LAYER 5: EDGE NODES, OFFLINE CLIENTS & AUTHORITY COMMAND", "Zero-connectivity resilience in mountain valleys + Live GIS Incident Dashboard", c_rose)
    draw_sub_card(0.6, 0.22, 3.8, 0.82, "Beacon Point (React Native)", ["• Offline-First Store-and-Forward architecture", "• Firestore built-in offline persistence", "• Auto-syncs GPS beacons on network return"], c_rose)
    draw_sub_card(4.7, 0.22, 3.8, 0.82, "Citizen Emergency SOS PWA", ["• High-contrast single-click distress button", "• LocalStorage offline queue with auto-flush", "• Geolocation API with high-accuracy mode"], c_rose)
    draw_sub_card(8.8, 0.22, 4.6, 0.82, "Authority GIS Command Dashboard", ["• Interactive Leaflet.js / OpenStreetMap GIS", "• Real-time pulsing distress pins & audio chimes", "• One-click shelter allocation & alert resolution"], c_rose)

    # Draw vertical connectors between layers
    connector_xs = [2.5, 6.6, 11.0]
    for x in connector_xs:
        ax.annotate('', xy=(x, 7.3), xytext=(x, 7.0),
                    arrowprops=dict(arrowstyle="->", color='#64748b', lw=1.5))
        ax.annotate('', xy=(x, 5.5), xytext=(x, 5.2),
                    arrowprops=dict(arrowstyle="->", color='#64748b', lw=1.5))
        ax.annotate('', xy=(x, 3.5), xytext=(x, 3.2),
                    arrowprops=dict(arrowstyle="->", color='#64748b', lw=1.5))
        ax.annotate('', xy=(x, 1.8), xytext=(x, 1.5),
                    arrowprops=dict(arrowstyle="->", color='#64748b', lw=1.5))

    output_path = os.path.join("reports", "system_architecture_diagram.png")
    plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated: {output_path} (Size: {Image.open(output_path).size})")

def generate_hydrology_diagram():
    fig, ax = plt.subplots(figsize=(12, 7), dpi=150)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis('off')

    c_text = '#f8fafc'
    c_cyan = '#06b6d4'
    c_blue = '#38bdf8'
    c_amber = '#fbbf24'
    c_rose = '#f87171'
    c_emerald = '#34d399'

    ax.text(6, 6.7, "PHYSICAL HYDROLOGY & FLASH-FLOOD HAZARD INDEX (FFHI)", 
            ha='center', va='center', color=c_text, fontsize=13, fontweight='bold')
    ax.text(6, 6.35, "Soil Conservation Service Curve Number (SCS-CN) Runoff & Multi-Factor Mountain Risk Synthesis", 
            ha='center', va='center', color=c_cyan, fontsize=8.5)

    # Box 1: SCS-CN Physics
    rect1 = patches.FancyBboxPatch((0.5, 3.6), 5.2, 2.4, boxstyle="round,pad=0.08,rounding_size=0.12",
                                   facecolor='#1e293b', edgecolor=c_blue, linewidth=1.5)
    ax.add_patch(rect1)
    ax.text(0.8, 5.65, "1. SCS Curve Number Runoff Physics", color=c_blue, fontsize=9.5, fontweight='bold')
    ax.text(0.8, 5.25, r"$Q = \frac{(P - I_a)^2}{P - I_a + S} \quad (P > I_a, \text{ else } 0)$", color='#ffffff', fontsize=9.0)
    ax.text(0.8, 4.85, r"$I_a = 0.2 \cdot S \quad ; \quad S = \frac{25400}{CN} - 254$", color=c_text, fontsize=8.2)
    ax.text(0.8, 4.45, "Curve Numbers by Land Cover (AMC II):", color=c_amber, fontsize=7.8)
    ax.text(0.8, 4.15, "• Forest: 60  |  Agriculture: 76  |  Barren: 86  |  Urban: 93", color='#cbd5e1', fontsize=7.5)
    ax.text(0.8, 3.85, "Adjusted dynamically for Antecedent Moisture (AMC I/II/III)", color='#94a3b8', fontsize=7.2)

    # Box 2: Geomorphology & Horn's Gradient
    rect2 = patches.FancyBboxPatch((6.3, 3.6), 5.2, 2.4, boxstyle="round,pad=0.08,rounding_size=0.12",
                                   facecolor='#1e293b', edgecolor=c_emerald, linewidth=1.5)
    ax.add_patch(rect2)
    ax.text(6.6, 5.65, "2. Topographic & Spatial Gradient (Horn's 3x3)", color=c_emerald, fontsize=9.5, fontweight='bold')
    ax.text(6.6, 5.25, r"$\frac{\partial z}{\partial x} = \frac{(z_{02}+2z_{12}+z_{22}) - (z_{00}+2z_{10}+z_{20})}{8 \cdot \Delta x}$", color='#ffffff', fontsize=8.2)
    ax.text(6.6, 4.8, r"$\text{Slope}^\circ = \arctan\left(\sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}\right) \cdot \frac{180}{\pi}$", color='#ffffff', fontsize=8.2)
    ax.text(6.6, 4.35, r"$\text{Aspect}^\circ = \text{mod}(180 + \frac{180}{\pi}\text{atan2}(\partial z/\partial y, -\partial z/\partial x), 360)$", color='#ffffff', fontsize=8.2)
    ax.text(6.6, 3.9, "Stream Proximity: Geodesic point-to-segment distance $d_{stream}$", color='#94a3b8', fontsize=7.2)

    # Box 3: FFHI Composite Formulation
    rect3 = patches.FancyBboxPatch((0.5, 0.5), 11.0, 2.7, boxstyle="round,pad=0.08,rounding_size=0.12",
                                   facecolor='#1e293b', edgecolor=c_rose, linewidth=1.5)
    ax.add_patch(rect3)
    ax.text(0.8, 2.85, "3. Flash Flood Hazard Index (FFHI) Multi-Factor Composite Formulation", color=c_rose, fontsize=10.0, fontweight='bold')
    ax.text(0.8, 2.5, r"$\text{Hazard} = 0.32 \cdot I_{1h} + 0.28 \cdot Q_{runoff} + 0.15 \cdot \theta_{sat}^{1.4} + 0.12 \cdot e^{-d/280} + 0.08 \cdot \sin(\text{slope}) + 0.05 \cdot H_{dens}$", 
            color='#ffffff', fontsize=9.0)
    
    start_y = 2.1
    ax.text(0.8, start_y, "Weight Breakdown & Physical Drivers:", color=c_amber, fontsize=8.2, fontweight='bold')
    
    rows = [
        ["1h Burst Intensity (I_1h)", "32%", "Cloudbursts (>40mm/h) overwhelm mountain infiltration rate, creating immediate overland flow."],
        ["Runoff Volume (Q_runoff)", "28%", "SCS-CN volumetric discharge accounting for catchment retention capacity S and soil moisture."],
        ["Soil Saturation (theta_sat)", "15%", "Pre-saturated soils (AMC III) cause 100% of additional precipitation to convert directly to runoff."],
        ["Riparian Proximity (e^-d/280)", "12%", "Exponential risk decay with distance; mountain torrents (nallahs) flood within <150m."],
        ["Kinetic Slope (sin slope)", "8%", "Steep mountain gradients (>30°) accelerate runoff velocity into high-energy debris flows."],
        ["Historical Density (H_dens)", "5%", "Identifies recurring geomorphological choke points and historical landslide track channels."]
    ]

    for idx, (factor, weight, desc) in enumerate(rows):
        y_pos = start_y - 0.22 - idx * 0.2
        ax.text(1.0, y_pos, f"• {factor}:", color='#ffffff', fontsize=7.4, fontweight='bold')
        ax.text(3.4, y_pos, f"[{weight}]", color=c_rose, fontsize=7.4, fontweight='bold')
        ax.text(4.1, y_pos, desc, color='#cbd5e1', fontsize=7.0)

    output_path = os.path.join("reports", "hydrological_pipeline_diagram.png")
    plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated: {output_path} (Size: {Image.open(output_path).size})")

if __name__ == "__main__":
    generate_system_architecture_diagram()
    generate_hydrology_diagram()
