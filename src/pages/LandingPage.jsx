/**
 * LandingPage — BACHAV landing page.
 *
 * Uses ui-kit landing sections (HeroSection, FeaturesSection, ProcessSection,
 * RolesSection, CTASection) with flood-prediction domain content.
 *
 * The hero uses a static gradient fallback instead of a video — the user
 * plans to add a map-based visualization in a future iteration.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  HeroSection,
  FeaturesSection,
  ProcessSection,
  RolesSection,
  CTASection,
  SignInDrawer,
} from "../ui-kit";
import {
  CloudRain,
  Droplets,
  Mountain,
  Radio,
  Database,
  MapPin,
  Satellite,
  Timer,
  Bell,
  ShieldCheck,
  Landmark,
  Users,
  ArrowRight,
} from "lucide-react";

/* ── Feature data for the bento grid ── */
const features = [
  {
    icon: <CloudRain className="h-7 w-7" />,
    title: "Rainfall Integration",
    desc: "Ingests real-time and forecast rainfall data from IMD ground stations, Doppler radar, and satellite feeds to track precipitation intensity at sub-district resolution.",
    extraInfo: "Data includes 15-minute intervals, enabling hyper-accurate flow prediction into micro-watersheds and rapid response to sudden downpours.",
    colSpan: "col-span-1 md:col-span-2",
  },
  {
    icon: <Droplets className="h-7 w-7" />,
    title: "Soil Moisture Analysis",
    desc: "Monitors soil saturation levels through IoT probes deployed across vulnerable slopes. Saturated soil is the primary trigger for debris flows in hilly terrain.",
    extraInfo: "We cross-reference saturation data with geotechnical thresholds to trigger early-warning mechanisms hours before actual slope failure.",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    icon: <Mountain className="h-7 w-7" />,
    title: "Slope Stability Modelling",
    desc: "Combines DEM data, geological surveys, and real-time tilt sensor readings to assess slope failure probability at the village level.",
    extraInfo: "Utilizes advanced kinematic models and infinite slope analysis tailored specifically to the topography of the Western Ghats and Himalayas.",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    icon: <Database className="h-7 w-7" />,
    title: "Historical Landslide Data",
    desc: "Draws on the GSI national landslide inventory and district-level disaster records to calibrate risk models against known failure zones.",
    extraInfo: "Machine learning algorithms constantly refine prediction accuracy by training on decades of prior incident data and climatic variables.",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    icon: <Radio className="h-7 w-7" />,
    title: "Real-Time IoT Network",
    desc: "LoRa/NB-IoT sensor mesh for rain gauges, piezometers, stream-level gauges, and tilt sensors — designed for low-connectivity hill stations.",
    extraInfo: "Battery-efficient nodes can operate for years and relay critical alerts even during cellular network outages through mesh protocols.",
    colSpan: "col-span-1 md:col-span-1",
  },
];

/* ── How-it-works steps ── */
const processSteps = [
  {
    icon: <Satellite className="h-5 w-5" />,
    title: "Collect",
    desc: "Rainfall, soil moisture, stream level, and slope tilt data flows in from IoT sensors, IMD feeds, and satellite imagery every 15 minutes.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Analyse",
    desc: "Multi-source data is fused and fed into hydrological and geotechnical models calibrated for each micro-watershed.",
  },
  {
    icon: <Timer className="h-5 w-5" />,
    title: "Predict",
    desc: "The system generates village-level flood and landslide risk forecasts with 1–6 hour lead time — enough for organised evacuation.",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Alert",
    desc: "Colour-coded warnings (Green → Yellow → Orange → Red) are pushed to district officials, NDRF teams, and citizens via SMS, app, and public address systems.",
  },
];

/* ── Trust / credibility cards (replaces RolesSection) ── */
const trustCards = [
  {
    icon: <Landmark className="h-12 w-12" />,
    tag: "Government Framework",
    title: "Disaster Management",
    desc: "Designed for the National Disaster Response Force (NDRF) and district-level disaster management authorities under the Ministry of Home Affairs.",
  },
  {
    icon: <MapPin className="h-12 w-12" />,
    tag: "Coverage",
    title: "Hilly Regions",
    desc: "Purpose-built for the unique challenges of Uttarakhand, Himachal Pradesh, Northeast India, and Western Ghats — where flash floods arrive with minimal warning.",
  },
  {
    icon: <ShieldCheck className="h-12 w-12" />,
    tag: "Standards",
    title: "IMD/NDMA Protocol",
    desc: "Follows the standard four-stage colour-coded warning system recognised across Indian disaster management institutions.",
  },
  {
    icon: <Users className="h-12 w-12" />,
    tag: "Stakeholders",
    title: "Multi-Level Access",
    desc: "Separate views for citizens, block-level officials, district collectors, and NDRF coordinators — each seeing information relevant to their response role.",
  },
];

const trustPoints = [
  "Follows IMD/NDMA standard four-stage colour-coded alert protocol",
  "Village and ward-level spatial resolution for hyper-local predictions",
  "Designed for low-bandwidth hill regions with offline-capable alerts",
  "Open data integration with existing government monitoring infrastructure",
  "Built under Smart India Hackathon — Problem Statement 26192",
  "Actionable lead time for evacuation planning and resource staging",
];

/* ── Footer links ── */
const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Alert System", href: "#roles" },
  { label: "Get Started", href: "#apply" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleAuth = async (email) => {
    await new Promise((r) => setTimeout(r, 1500));
    const isOfficial = email.includes("@gov.in") || email.includes("official") || email.includes("ndrf") || email.includes("admin");
    if (isOfficial) {
      navigate("/dashboard/authorities/home");
    } else {
      navigate("/dashboard/user/home");
    }
    return { success: true };
  };

  const AuthDrawerWrapper = (props) => (
    <SignInDrawer
      {...props}
      appName="BACHAV"
      roles={[]}
      onLogin={(email) => handleAuth(email)}
      onSignup={(_, email) => handleAuth(email)}
    />
  );

  return (
    <>
      {/* ── HERO ── */}
      <HeroSection
        appName="BACHAV"
        tagline={["Village-Level.", "Flash Flood.", "Early Warning."]}
        description="Hyper-local flash flood prediction for hilly regions. Integrates rainfall, soil moisture, slope stability, and real-time IoT data to provide village-level early warnings with actionable lead time."
        videoSrc="/hero-bg-video.mp4"
        navLinks={[
          { label: "Features", sectionId: "features" },
          { label: "How It Works", sectionId: "how-it-works" },
          { label: "Alert System", sectionId: "roles" },
        ]}
        ctaLabel="Learn How It Works"
        ctaSectionId="how-it-works"
        details={[
          {
            icon: <MapPin className="h-5 w-5" />,
            title: "Village-Level Resolution",
            desc: "Predictions are generated per village, not per district. Each micro-watershed is modelled independently.",
          },
          {
            icon: <Timer className="h-5 w-5" />,
            title: "1–6 Hour Lead Time",
            desc: "Enough advance warning for organised evacuation and resource staging by local authorities.",
          },
          {
            icon: <Radio className="h-5 w-5" />,
            title: "IoT Sensor Network",
            desc: "LoRa/NB-IoT mesh for rain gauges, piezometers, stream-level gauges, and tilt sensors.",
          },
        ]}
        SignInComponent={AuthDrawerWrapper}
      />

      {/* ── FEATURES ── */}
      <FeaturesSection
        sectionIndex="01"
        subtitle="Data Sources"
        title="Five data streams. One prediction model."
        features={features}
      />

      {/* ── HOW IT WORKS ── */}
      <ProcessSection
        sectionIndex="02"
        bigText={["we", "predict."]}
        steps={processSteps}
        problemTitle="Current Warning Systems"
        problemDesc="Regional forecasts cover entire districts. By the time a warning reaches a hill village, the flash flood has already arrived. Lead times are too short for organised evacuation."
        solutionTitle="BACHAV Approach"
        solutionDesc="Hyper-local, village-level forecasts with 1–6 hour lead time. Enough to evacuate, stage resources, and save lives."
      />

      {/* ── TRUST / CREDIBILITY ── */}
      <RolesSection
        sectionIndex="03"
        title="Built for disaster response."
        cards={trustCards}
        trustPoints={trustPoints}
        trustHeading="Grounded in established standards and field requirements."
      />

      {/* ── CTA + FOOTER ── */}
      <CTASection
        sectionIndex="04"
        bgText="BACHAV"
        heading="Start monitoring your region."
        subheading="Register to access village-level flood risk forecasts and real-time alert dashboards."
        ctaLabel="Create Your Account"
        appName="BACHAV"
        footerLinks={footerLinks}
        footerTagline="Flash flood prediction system for hilly regions. Problem Statement 26192 — Smart India Hackathon."
        copyright={`\u00a9 ${new Date().getFullYear()} BACHAV. All rights reserved.`}
        SignInComponent={AuthDrawerWrapper}
      />
    </>
  );
}
