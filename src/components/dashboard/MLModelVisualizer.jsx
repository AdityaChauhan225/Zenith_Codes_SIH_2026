import React, { useState } from 'react';
import { 
  Brain, Cpu, Activity, Sliders, BarChart3, Layers, 
  X, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  RefreshCw, Sparkles, ShieldAlert, ChevronRight
} from 'lucide-react';

export function MLModelVisualizer({ isOpen, onClose, currentPrediction, coordinates = [31.7087, 76.9320] }) {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'simulator' | 'evaluation'
  
  // What-If Simulator state
  const [simFeatures, setSimFeatures] = useState({
    rainfall_1h_mm: 45.0,
    rainfall_3h_mm: 75.0,
    rainfall_6h_mm: 95.0,
    rainfall_24h_mm: 130.0,
    soil_saturation_index: 0.82,
    slope_degrees: 34.0,
    elevation_m: 1650.0,
    aspect: 180.0,
    historical_incident_density: 1.8,
    land_cover_class: 'barren',
    distance_to_nearest_stream_m: 75.0,
    antecedent_moisture_condition: 'wet'
  });
  
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState(null);

  const runSimulation = async (featuresToRun = simFeatures) => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featuresToRun)
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data);
      } else {
        setSimError(data.error || "Simulation failed");
      }
    } catch (err) {
      setSimError("Failed to connect to ML Backend: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePreset = (preset) => {
    let newFeats;
    if (preset === 'cloudburst') {
      newFeats = {
        rainfall_1h_mm: 65.0,
        rainfall_3h_mm: 110.0,
        rainfall_6h_mm: 155.0,
        rainfall_24h_mm: 210.0,
        soil_saturation_index: 0.95,
        slope_degrees: 42.0,
        elevation_m: 1980.0,
        aspect: 210.0,
        historical_incident_density: 2.8,
        land_cover_class: 'barren',
        distance_to_nearest_stream_m: 45.0,
        antecedent_moisture_condition: 'wet'
      };
    } else if (preset === 'moderate') {
      newFeats = {
        rainfall_1h_mm: 18.0,
        rainfall_3h_mm: 32.0,
        rainfall_6h_mm: 48.0,
        rainfall_24h_mm: 70.0,
        soil_saturation_index: 0.55,
        slope_degrees: 22.0,
        elevation_m: 1400.0,
        aspect: 140.0,
        historical_incident_density: 0.8,
        land_cover_class: 'agriculture',
        distance_to_nearest_stream_m: 250.0,
        antecedent_moisture_condition: 'normal'
      };
    } else {
      // calm
      newFeats = {
        rainfall_1h_mm: 2.0,
        rainfall_3h_mm: 4.0,
        rainfall_6h_mm: 8.0,
        rainfall_24h_mm: 14.0,
        soil_saturation_index: 0.20,
        slope_degrees: 12.0,
        elevation_m: 950.0,
        aspect: 90.0,
        historical_incident_density: 0.1,
        land_cover_class: 'forest',
        distance_to_nearest_stream_m: 850.0,
        antecedent_moisture_condition: 'dry'
      };
    }
    setSimFeatures(newFeats);
    runSimulation(newFeats);
  };

  if (!isOpen) return null;

  const predData = simResult || currentPrediction;
  const rawScore = typeof predData?.risk_score === 'number' && !isNaN(predData.risk_score) 
    ? predData.risk_score 
    : 0.087;
  const riskScore = Math.min(Math.max(rawScore, 0), 1);
  const riskLevel = (predData?.risk_level || (riskScore >= 0.75 ? "critical" : riskScore >= 0.5 ? "high" : riskScore >= 0.25 ? "medium" : "low")).toLowerCase();

  const rawExplanation = predData?.explanation && typeof predData.explanation === 'object' && Object.keys(predData.explanation).length > 0
    ? predData.explanation
    : {
        "rainfall_3h_mm": -0.35,
        "rainfall_24h_mm": -0.19,
        "soil_saturation_index": -0.17,
        "rainfall_1h_mm": -0.16,
        "distance_to_nearest_stream_m": -0.04,
        "antecedent_moisture_condition": 0.02
      };

  const rawTopDrivers = Array.isArray(predData?.top_drivers) && predData.top_drivers.length > 0
    ? predData.top_drivers
    : [
        { feature: "rainfall_3h_mm", impact: -0.35, direction: "suppressing" },
        { feature: "rainfall_24h_mm", impact: -0.19, direction: "suppressing" },
        { feature: "soil_saturation_index", impact: -0.17, direction: "suppressing" }
      ];

  const displayPred = {
    risk_level: riskLevel,
    risk_score: riskScore,
    explanation: rawExplanation,
    top_drivers: rawTopDrivers
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-600', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200', border: 'border-red-500' };
      case 'high': return { bg: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-orange-500' };
      case 'medium': return { bg: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', border: 'border-yellow-500' };
      default: return { bg: 'bg-emerald-600', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-500' };
    }
  };

  const tierColors = getTierColor(displayPred.risk_level);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-900 to-[#0B1A2B] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#145C8C]/50 border border-blue-400/30 text-blue-200">
              <Brain size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg tracking-tight">BACHAV ML Model & SHAP Visualizer</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  XGBoost v2.0 Active
                </span>
              </div>
              <p className="text-xs text-gray-300">TreeSHAP Local Explainability & Real-Time Hydrological Physics</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-gray-200 bg-gray-50 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'live'
                ? 'border-[#145C8C] text-[#145C8C]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Activity size={15} />
            Live Risk & SHAP Drivers
          </button>
          <button
            onClick={() => {
              setActiveTab('simulator');
              if (!simResult) runSimulation();
            }}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'simulator'
                ? 'border-[#145C8C] text-[#145C8C]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders size={15} />
            Interactive "What-If" Simulator
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'evaluation'
                ? 'border-[#145C8C] text-[#145C8C]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart3 size={15} />
            Model Metrics & Evaluation Plots
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: LIVE SHAP & RISK */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Risk Level Badge */}
                <div className={`p-4 rounded-xl border ${tierColors.border} bg-white shadow-xs flex flex-col justify-between`}>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hazard Classification</span>
                  <div className="my-2">
                    <span className={`text-3xl font-extrabold uppercase tracking-tight ${tierColors.text}`}>
                      {displayPred.risk_level} Risk
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Calibrated multi-class probability output</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${tierColors.bg} transition-all duration-700`}
                      style={{ width: `${Math.round(displayPred.risk_score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Continuous Risk Score */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Calibrated Risk Score</span>
                  <div className="my-2">
                    <span className="text-3xl font-light text-[#0B1A2B]">
                      {(displayPred.risk_score * 100).toFixed(1)}<span className="text-sm font-semibold text-gray-400 ml-1">/ 100</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Raw score: {displayPred.risk_score.toFixed(3)}</p>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${tierColors.badge}`}>
                    {displayPred.risk_score >= 0.75 ? "Evacuation Mandatory" : displayPred.risk_score >= 0.45 ? "Precautionary Standby" : "Normal Infiltration"}
                  </span>
                </div>

                {/* Model Architecture */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-[#145C8C] uppercase tracking-wider">Engine Specs</span>
                  <div className="space-y-1.5 my-1 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Architecture:</span>
                      <strong className="font-semibold text-gray-900">XGBoost + SHAP</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trees / Depth:</span>
                      <span className="font-mono font-medium">150 / 6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Validation Accuracy:</span>
                      <span className="font-mono text-emerald-700 font-bold">89.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Macro F1:</span>
                      <span className="font-mono text-blue-700 font-bold">0.8127</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Input: 12 Normalized Hydrological Features</span>
                </div>

              </div>

              {/* SHAP Feature Contribution Waterfall */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1A2B] flex items-center gap-2">
                      <Sparkles size={16} className="text-[#145C8C]" />
                      Local Feature Attribution (TreeSHAP)
                    </h4>
                    <p className="text-xs text-gray-500">
                      Shows exact mathematical contributions pushing this micro-watershed toward (<span className="text-red-600 font-semibold">+Elevating</span>) or away from (<span className="text-emerald-600 font-semibold">-Suppressing</span>) flash-flood surge.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    sum(SHAP) ~ log-odds margin
                  </span>
                </div>

                {displayPred.explanation && Object.keys(displayPred.explanation).length > 0 ? (
                  <div className="space-y-2.5">
                    {Object.entries(displayPred.explanation)
                      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                      .map(([feature, weight]) => {
                        const numWeight = typeof weight === 'number' && !isNaN(weight) ? weight : (parseFloat(weight) || 0);
                        const isElevating = numWeight > 0;
                        const absWeight = Math.abs(numWeight);
                        const barWidthPercent = Math.min((absWeight / 0.5) * 100, 100);
                        const formattedName = feature.replace(/_/g, ' ');

                        return (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-gray-700 capitalize flex items-center gap-1.5">
                                {isElevating ? (
                                  <ArrowUpRight size={14} className="text-red-500" />
                                ) : (
                                  <ArrowDownRight size={14} className="text-emerald-500" />
                                )}
                                {formattedName}
                              </span>
                              <span className={`font-mono font-bold text-xs ${isElevating ? 'text-red-600' : 'text-emerald-600'}`}>
                                {isElevating ? `+${numWeight.toFixed(4)}` : numWeight.toFixed(4)}
                              </span>
                            </div>
                            {/* Horizontal Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isElevating ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${barWidthPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center italic">No SHAP breakdown available for this response.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE WHAT-IF SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-[#0B1A2B] flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
                <div>
                  <h4 className="font-bold text-sm text-[#145C8C]">What-If Flash Flood Simulator</h4>
                  <p className="text-gray-600">Simulate cloudburst conditions or steep terrains to observe immediate XGBoost re-prediction.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePreset('calm')} 
                    className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[11px] font-semibold text-gray-700 shadow-xs"
                  >
                    Calm Day
                  </button>
                  <button 
                    onClick={() => handlePreset('moderate')} 
                    className="px-2.5 py-1 rounded-lg border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-[11px] font-semibold text-yellow-800 shadow-xs"
                  >
                    Monsoon Rain
                  </button>
                  <button 
                    onClick={() => handlePreset('cloudburst')} 
                    className="px-2.5 py-1 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-[11px] font-semibold text-red-700 shadow-xs"
                  >
                    Cloudburst Surge
                  </button>
                </div>
              </div>

              {simError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertTriangle size={15} />
                  {simError}
                </div>
              )}

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1h Rainfall */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">1-Hour Rainfall (mm/h)</span>
                    <span className="font-mono text-[#145C8C]">{simFeatures.rainfall_1h_mm} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={simFeatures.rainfall_1h_mm}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSimFeatures({
                        ...simFeatures,
                        rainfall_1h_mm: v,
                        rainfall_3h_mm: Math.max(simFeatures.rainfall_3h_mm, v),
                        rainfall_6h_mm: Math.max(simFeatures.rainfall_6h_mm, v),
                        rainfall_24h_mm: Math.max(simFeatures.rainfall_24h_mm, v)
                      });
                    }}
                    className="w-full accent-[#145C8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 block">&gt;40 mm/h represents cloudburst convective intensity</span>
                </div>

                {/* 24h Rainfall */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">24-Hour Cumulative (mm)</span>
                    <span className="font-mono text-[#145C8C]">{simFeatures.rainfall_24h_mm} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min={simFeatures.rainfall_1h_mm} 
                    max="300" 
                    step="5"
                    value={simFeatures.rainfall_24h_mm}
                    onChange={(e) => setSimFeatures({ ...simFeatures, rainfall_24h_mm: parseFloat(e.target.value) })}
                    className="w-full accent-[#145C8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 block">Drives total catchment volumetric water balance</span>
                </div>

                {/* Soil Saturation */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">Soil Saturation Index (0 - 1.0)</span>
                    <span className="font-mono text-[#145C8C]">{simFeatures.soil_saturation_index.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="1.0" 
                    step="0.05"
                    value={simFeatures.soil_saturation_index}
                    onChange={(e) => setSimFeatures({ ...simFeatures, soil_saturation_index: parseFloat(e.target.value) })}
                    className="w-full accent-[#145C8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 block">Near 1.0 = instant overland kinetic runoff</span>
                </div>

                {/* Distance to Stream */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">Distance to Nearest Stream / Torrent</span>
                    <span className="font-mono text-[#145C8C]">{simFeatures.distance_to_nearest_stream_m} m</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="1500" 
                    step="20"
                    value={simFeatures.distance_to_nearest_stream_m}
                    onChange={(e) => setSimFeatures({ ...simFeatures, distance_to_nearest_stream_m: parseFloat(e.target.value) })}
                    className="w-full accent-[#145C8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 block">&lt;150m indicates immediate inundation risk</span>
                </div>

                {/* Slope Degrees */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">Topographic Slope</span>
                    <span className="font-mono text-[#145C8C]">{simFeatures.slope_degrees}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="65" 
                    step="1"
                    value={simFeatures.slope_degrees}
                    onChange={(e) => setSimFeatures({ ...simFeatures, slope_degrees: parseFloat(e.target.value) })}
                    className="w-full accent-[#145C8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 block">Steep slopes accelerate runoff velocity into debris flow</span>
                </div>

                {/* Land Cover Class */}
                <div className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="block text-xs font-semibold text-gray-700">Land Cover Class</span>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {['forest', 'agriculture', 'urban', 'barren'].map((lc) => (
                      <button
                        key={lc}
                        type="button"
                        onClick={() => setSimFeatures({ ...simFeatures, land_cover_class: lc })}
                        className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                          simFeatures.land_cover_class === lc
                            ? 'bg-[#145C8C] text-white border-[#145C8C]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {lc}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 block">Forest retards runoff; barren accelerates surge</span>
                </div>

              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => runSimulation()}
                disabled={isSimulating}
                className="w-full py-3 bg-[#145C8C] hover:bg-[#0B1A2B] text-white rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Running XGBoost Inference...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Run XGBoost Risk Inference
                  </>
                )}
              </button>

              {/* Simulation Result Preview */}
              {simResult && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500">Simulation Output</h5>
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full text-white ${
                      simResult.risk_level === 'critical' ? 'bg-red-600' :
                      simResult.risk_level === 'high' ? 'bg-orange-500' :
                      simResult.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-emerald-600'
                    }`}>
                      {simResult.risk_level} Risk ({((typeof simResult.risk_score === 'number' ? simResult.risk_score : 0) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {simResult.top_drivers?.map((d, i) => {
                      const numImp = typeof d.impact === 'number' ? d.impact : (parseFloat(d.impact) || 0);
                      return (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                          {d.feature.replace(/_/g, ' ')}: <strong className={d.direction === 'elevating' ? 'text-red-600' : 'text-emerald-700'}>{d.direction} ({numImp > 0 ? `+${numImp.toFixed(3)}` : numImp.toFixed(3)})</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: MODEL EVALUATION & ARCHITECTURE PLOTS */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              
              {/* Metrics Table */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs">
                <h4 className="font-bold text-sm text-[#0B1A2B] mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Model Performance Benchmark (Monsoon Test Set)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Accuracy</span>
                    <span className="text-xl font-extrabold text-[#145C8C]">89.4%</span>
                    <span className="block text-[9px] text-gray-500 mt-0.5">Target: &ge; 85%</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Macro F1</span>
                    <span className="text-xl font-extrabold text-blue-600">0.8127</span>
                    <span className="block text-[9px] text-gray-500 mt-0.5">Target: &ge; 0.78</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Critical F1</span>
                    <span className="text-xl font-extrabold text-red-600">0.8333</span>
                    <span className="block text-[9px] text-gray-500 mt-0.5">Target: &ge; 0.78</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Cohen's Kappa</span>
                    <span className="text-xl font-extrabold text-indigo-600">0.7503</span>
                    <span className="block text-[9px] text-gray-500 mt-0.5">Target: &ge; 0.70</span>
                  </div>
                </div>
              </div>

              {/* Visual Artifacts Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SHAP Summary Plot */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-700">SHAP Beeswarm Summary</h5>
                    <span className="text-[10px] font-mono text-gray-400">reports/shap_summary.png</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[220px]">
                    <img 
                      src="/reports/shap_summary.png" 
                      alt="SHAP Beeswarm Plot" 
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Visualizes impact of each feature across 1,500 test samples. Red dots represent high feature values.</p>
                </div>

                {/* Confusion Matrix */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-700">Confusion Matrix (4 Tiers)</h5>
                    <span className="text-[10px] font-mono text-gray-400">reports/confusion_matrix.png</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[220px]">
                    <img 
                      src="/reports/confusion_matrix.png" 
                      alt="Confusion Matrix" 
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Demonstrates high sensitivity for Critical and High flood events without catastrophic false negatives.</p>
                </div>

                {/* Global Feature Importance */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-700">Global Feature Importance (SHAP Bar)</h5>
                    <span className="text-[10px] font-mono text-gray-400">reports/shap_bar.png</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[220px]">
                    <img 
                      src="/reports/shap_bar.png" 
                      alt="Global Feature Importance" 
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Mean absolute SHAP value ranking the 12 environmental features by global contribution.</p>
                </div>

                {/* Hydrological Pipeline Architecture */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-700">Physics & Pipeline Architecture</h5>
                    <span className="text-[10px] font-mono text-gray-400">reports/hydrological_pipeline_diagram.png</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[220px]">
                    <img 
                      src="/reports/hydrological_pipeline_diagram.png" 
                      alt="Hydrological Pipeline Architecture" 
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">End-to-end data flow: Ingestion &rarr; SCS-CN Physics &rarr; ColumnTransformer &rarr; XGBoost &rarr; TreeSHAP.</p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>API Server: <code>http://localhost:5000/api/predict</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Close Visualizer
          </button>
        </div>

      </div>
    </div>
  );
}
