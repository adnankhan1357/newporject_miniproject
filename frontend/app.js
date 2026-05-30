/**
 * spotNgo - Smart Campus Indoor Navigation Script
 * Core Canvas Interaction, Zoom/Pan Math, Dynamic Particle Path Flow, and API Client
 */

// --- Global App State ---
let mapNodes = [];
let mapEdges = [];
let nodesDict = {};
let adjacencyList = {};

let startNodeId = "";
let endNodeId = "";
let currentFloor = 0;

let computedPath = [];      // Array of node IDs
let computedDirections = [];// Array of turn-by-turn objects
let totalDistance = 0;

// Canvas Pan & Zoom Matrices
let canvas = null;
let ctx = null;
let scale = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

let hoveredNodeId = null;
let animationFrameId = null;
let gridEnabled = true;
let isLightTheme = false;

// Backend Connection Endpoint
const API_BASE_URL = "https://newporject-miniproject-1.onrender.com/api";

// Fallback JSON Map Data in case the backend Flask API is offline
// (Extracted from c:\mini_project\college_map.json to provide seamless execution)
const FALLBACK_MAP_DATA = {
  "nodes": [
    { "id": "ext_f0_gate_number_9", "label": "Gate Number 9", "x": 900, "y": -900, "floor": 0, "type": "college_gate" },
    { "id": "ext_f0_j1", "label": "Junction 1", "x": 930, "y": -900, "floor": 0, "type": "junction" },
    { "id": "ext_f0_wash_basin", "label": "Wash Basin", "x": 960, "y": -900, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_cme_entrance", "label": "CME Entrance", "x": 1275, "y": -900, "floor": 0, "type": "building_entrance" },
    { "id": "cme_f0_registrar_office", "label": "Registrar Office", "x": 1275, "y": -1020, "floor": 0, "type": "office_room" },
    { "id": "cme_f0_male_washroom", "label": "Male Washroom (CME)", "x": 1215, "y": -1020, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_water_filter", "label": "Water Filter (CME)", "x": 1275, "y": -1050, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_lift_stairs", "label": "CME Lift/Stairs", "x": 1350, "y": -1050, "floor": 0, "type": "stairs_lift" },
    { "id": "cme_f0_iqac", "label": "IQAC", "x": 1275, "y": -1200, "floor": 0, "type": "office_room" },
    { "id": "cme_f0_tpo_office_placement_cell", "label": "TPO Office/Placement Cell", "x": 1275, "y": -1260, "floor": 0, "type": "office_room" },
    { "id": "cme_f0_guards_desk", "label": "Guards Desk (CME)", "x": 1335, "y": -1260, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_cme_exit", "label": "CME Exit", "x": 1605, "y": -1350, "floor": 0, "type": "building_entrance" },
    { "id": "cme_f0_cme_006", "label": "CME 006", "x": 1275, "y": -1485, "floor": 0, "type": "classroom" },
    { "id": "cme_f0_cme_004", "label": "CME 004", "x": 1290, "y": -1485, "floor": 0, "type": "classroom" },
    { "id": "cme_f0_language_lab", "label": "Language Lab", "x": 1275, "y": -1860, "floor": 0, "type": "lab" },
    { "id": "cme_f0_fluid_mechanics_lab", "label": "Fluid Mechanics Lab", "x": 1275, "y": -1995, "floor": 0, "type": "lab" },
    { "id": "cme_f0_cme_008", "label": "CME 008", "x": 1275, "y": -2025, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_service_room", "label": "Service Room", "x": 1275, "y": -2175, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_female_washroom", "label": "Female Washroom (CME)", "x": 1275, "y": -2205, "floor": 0, "type": "unknown" },
    { "id": "cme_f0_stairs", "label": "CME Stairs", "x": 1335, "y": -2175, "floor": 0, "type": "stairs_lift" },
    { "id": "cme_f0_administrative_office", "label": "Administrative Office", "x": 1515, "y": -2175, "floor": 0, "type": "office_room" },
    { "id": "ext_f0_j2", "label": "Junction 2", "x": 1725, "y": -900, "floor": 0, "type": "junction" },
    { "id": "ext_f0_j6", "label": "Junction 6", "x": 1725, "y": -1350, "floor": 0, "type": "junction" },
    { "id": "ext_f0_j3", "label": "Junction 3", "x": 2175, "y": -900, "floor": 0, "type": "junction" },
    { "id": "cb_f0_cb_entrance", "label": "CB Entrance", "x": 2175, "y": -1350, "floor": 0, "type": "building_entrance" },
    { "id": "cb_f0_library", "label": "Library", "x": 2115, "y": -1350, "floor": 0, "type": "hall" },
    { "id": "cb_f0_placement_hall", "label": "Placement Hall", "x": 2235, "y": -1350, "floor": 0, "type": "hall" },
    { "id": "cb_f0_entry_gate_1", "label": "CB Entry Gate 1", "x": 2385, "y": -1470, "floor": 0, "type": "entry_gate" },
    { "id": "cb_f0_entry_gate_2", "label": "CB Entry Gate 2", "x": 2085, "y": -1470, "floor": 0, "type": "entry_gate" },
    { "id": "cb_f0_executive_hall", "label": "Executive Hall", "x": 2235, "y": -1470, "floor": 0, "type": "hall" },
    { "id": "cb_f0_male_washroom", "label": "Male Washroom (CB)", "x": 2415, "y": -1470, "floor": 0, "type": "unknown" },
    { "id": "cb_f0_female_washroom", "label": "Female Washroom (CB)", "x": 1665, "y": -1470, "floor": 0, "type": "unknown" },
    { "id": "cb_f0_sv_auditorium", "label": "SV Auditorium", "x": 2475, "y": -1470, "floor": 0, "type": "hall" },
    { "id": "cb_f0_lift_stairs_1", "label": "CB Lift/Stairs 1", "x": 2415, "y": -1410, "floor": 0, "type": "stairs_lift" },
    { "id": "cb_f0_colonel_sirs_office", "label": "Colonel Sir's Office", "x": 2025, "y": -1470, "floor": 0, "type": "office_room" },
    { "id": "cb_f0_liftstairs_2", "label": "CB Lift/Stairs 2", "x": 2025, "y": -1410, "floor": 0, "type": "stairs_lift" },
    { "id": "cb_f0_cb_exit", "label": "CB Exit", "x": 1605, "y": -1470, "floor": 0, "type": "building_entrance" },
    { "id": "ext_f0_the_heritage_academy_building", "label": "Heritage Academy", "x": 2625, "y": -900, "floor": 0, "type": "junction" },
    { "id": "ext_f0_sac_ground", "label": "SAC Ground", "x": 3000, "y": -900, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_hostel_road_junction", "label": "Hostel Road Junction", "x": 3000, "y": -750, "floor": 0, "type": "junction" },
    { "id": "ext_f0_cheap_store", "label": "Cheap Store", "x": 3750, "y": -750, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_30_bigha_ground", "label": "30 Bigha Ground", "x": 3750, "y": -450, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_labours_canteen", "label": "Labours Canteen", "x": 3675, "y": -450, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_college_canteen", "label": "College Canteen", "x": 3750, "y": -225, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_ict_entrance", "label": "ICT Entrance", "x": 2625, "y": -1350, "floor": 0, "type": "building_entrance" },
    { "id": "ict_f0_guards_desk", "label": "Guards Desk (ICT)", "x": 2655, "y": -1350, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_liftstairs", "label": "ICT Lift/Stairs", "x": 2700, "y": -1350, "floor": 0, "type": "stairs_lift" },
    { "id": "ict_f0_ict_003_ieee_electron_devices_society", "label": "ICT 003 IEEE", "x": 2760, "y": -1350, "floor": 0, "type": "office_room" },
    { "id": "ict_f0_ict_002_microprocessor_and_microcontroller_lab", "label": "Microprocessor Lab", "x": 2760, "y": -1260, "floor": 0, "type": "lab" },
    { "id": "ict_f0_ict_001_circuit_and_network_lab", "label": "Circuit Lab", "x": 2745, "y": -1260, "floor": 0, "type": "lab" },
    { "id": "ict_f0_faculty_washroom", "label": "Faculty Washroom (ICT)", "x": 2760, "y": -1470, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_ict_004", "label": "ICT 004", "x": 2760, "y": -1545, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_ict_009_electrical_and_electronics_measurement_lab", "label": "Electrical Lab", "x": 2745, "y": -1545, "floor": 0, "type": "lab" },
    { "id": "ict_f0_ict_005_digital_electronics_lab", "label": "Digital Electronics Lab", "x": 2760, "y": -1770, "floor": 0, "type": "lab" },
    { "id": "ict_f0_ict_008", "label": "ICT 008", "x": 2745, "y": -1770, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_male_washroom", "label": "Male Washroom (ICT)", "x": 2760, "y": -1890, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_female_washroom", "label": "Female Washroom (ICT)", "x": 2760, "y": -1920, "floor": 0, "type": "unknown" },
    { "id": "ict_f0_stairs", "label": "ICT Stairs", "x": 2700, "y": -1920, "floor": 0, "type": "stairs_lift" },
    { "id": "ext_f0_basketball_court", "label": "Basketball Court", "x": 2175, "y": -675, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_school_cricket_ground", "label": "School Cricket Ground", "x": 2175, "y": -525, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_j5", "label": "Junction 5", "x": 2175, "y": 675, "floor": 0, "type": "junction" },
    { "id": "ext_f0_under_construction_building", "label": "Under Construction", "x": 930, "y": 0, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_heritage_school_canteen", "label": "Heritage School Canteen", "x": 930, "y": 750, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_j4", "label": "Junction 4", "x": 930, "y": 1350, "floor": 0, "type": "junction" },
    { "id": "ext_f0_heritage_school_entry_gate", "label": "School Entry Gate", "x": 1230, "y": 1350, "floor": 0, "type": "entry_gate" },
    { "id": "ext_f0_fee_department", "label": "Fee Department", "x": 1230, "y": 1425, "floor": 0, "type": "office_room" },
    { "id": "ext_f0_heritage_law_college", "label": "Heritage Law College", "x": 930, "y": 1500, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_punjab_national_bank", "label": "PNB Bank", "x": 930, "y": 2100, "floor": 0, "type": "unknown" },
    { "id": "ext_f0_gate_number_3", "label": "Gate Number 3", "x": 930, "y": 2550, "floor": 0, "type": "college_gate" },
    { "id": "ext_f0_atm", "label": "ATM", "x": 780, "y": 2550, "floor": 0, "type": "unknown" }
  ],
  "edges": [
    { "from": "ext_f0_gate_number_9", "to": "ext_f0_j1", "weight": 6 },
    { "from": "ext_f0_j1", "to": "ext_f0_wash_basin", "weight": 6 },
    { "from": "ext_f0_wash_basin", "to": "cme_f0_cme_entrance", "weight": 255 },
    { "from": "cme_f0_cme_entrance", "to": "ext_f0_j2", "weight": 90 },
    { "from": "ext_f0_j2", "to": "ext_f0_j6", "weight": 90 },
    { "from": "ext_f0_j6", "to": "cme_f0_cme_exit", "weight": 24 },
    { "from": "cme_f0_cme_entrance", "to": "cme_f0_registrar_office", "weight": 24 },
    { "from": "cme_f0_registrar_office", "to": "cme_f0_male_washroom", "weight": 12 },
    { "from": "cme_f0_registrar_office", "to": "cme_f0_water_filter", "weight": 6 },
    { "from": "cme_f0_water_filter", "to": "cme_f0_lift_stairs", "weight": 15 },
    { "from": "cme_f0_water_filter", "to": "cme_f0_iqac", "weight": 30 },
    { "from": "cme_f0_iqac", "to": "cme_f0_tpo_office_placement_cell", "weight": 12 },
    { "from": "cme_f0_tpo_office_placement_cell", "to": "cme_f0_guards_desk", "weight": 12 },
    { "from": "cme_f0_guards_desk", "to": "cme_f0_cme_exit", "weight": 30 },
    { "from": "cme_f0_tpo_office_placement_cell", "to": "cme_f0_cme_006", "weight": 45 },
    { "from": "cme_f0_cme_006", "to": "cme_f0_cme_004", "weight": 3 },
    { "from": "cme_f0_cme_006", "to": "cme_f0_language_lab", "weight": 75 },
    { "from": "cme_f0_language_lab", "to": "cme_f0_fluid_mechanics_lab", "weight": 9 },
    { "from": "cme_f0_fluid_mechanics_lab", "to": "cme_f0_cme_008", "weight": 6 },
    { "from": "cme_f0_cme_008", "to": "cme_f0_service_room", "weight": 24 },
    { "from": "cme_f0_service_room", "to": "cme_f0_female_washroom", "weight": 6 },
    { "from": "cme_f0_service_room", "to": "cme_f0_stairs", "weight": 12 },
    { "from": "cme_f0_stairs", "to": "cme_f0_administrative_office", "weight": 36 },
    { "from": "ext_f0_j2", "to": "ext_f0_j3", "weight": 90 },
    { "from": "ext_f0_j3", "to": "cb_f0_cb_entrance", "weight": 90 },
    { "from": "cb_f0_cb_entrance", "to": "cb_f0_library", "weight": 12 },
    { "from": "cb_f0_library", "to": "ext_f0_j6", "weight": 78 },
    { "from": "cb_f0_cb_entrance", "to": "cb_f0_placement_hall", "weight": 12 },
    { "from": "cb_f0_cb_entrance", "to": "cb_f0_entry_gate_1", "weight": 48 },
    { "from": "cb_f0_cb_entrance", "to": "cb_f0_entry_gate_2", "weight": 48 },
    { "from": "cb_f0_entry_gate_1", "to": "cb_f0_male_washroom", "weight": 6 },
    { "from": "cb_f0_male_washroom", "to": "cb_f0_lift_stairs_1", "weight": 12 },
    { "from": "cb_f0_male_washroom", "to": "cb_f0_sv_auditorium", "weight": 12 },
    { "from": "cb_f0_entry_gate_1", "to": "cb_f0_executive_hall", "weight": 30 },
    { "from": "cb_f0_executive_hall", "to": "cb_f0_entry_gate_2", "weight": 30 },
    { "from": "cb_f0_entry_gate_2", "to": "cb_f0_colonel_sirs_office", "weight": 12 },
    { "from": "cb_f0_colonel_sirs_office", "to": "cb_f0_liftstairs_2", "weight": 12 },
    { "from": "cb_f0_colonel_sirs_office", "to": "cb_f0_female_washroom", "weight": 72 },
    { "from": "cb_f0_female_washroom", "to": "cb_f0_cb_exit", "weight": 12 },
    { "from": "ext_f0_j3", "to": "ext_f0_the_heritage_academy_building", "weight": 90 },
    { "from": "cb_f0_placement_hall", "to": "ict_f0_ict_entrance", "weight": 78 },
    { "from": "ext_f0_the_heritage_academy_building", "to": "ext_f0_sac_ground", "weight": 75 },
    { "from": "ext_f0_sac_ground", "to": "ext_f0_hostel_road_junction", "weight": 30 },
    { "from": "ext_f0_hostel_road_junction", "to": "ext_f0_cheap_store", "weight": 150 },
    { "from": "ext_f0_cheap_store", "to": "ext_f0_30_bigha_ground", "weight": 60 },
    { "from": "ext_f0_30_bigha_ground", "to": "ext_f0_labours_canteen", "weight": 15 },
    { "from": "ext_f0_30_bigha_ground", "to": "ext_f0_college_canteen", "weight": 45 },
    { "from": "ext_f0_the_heritage_academy_building", "to": "ict_f0_ict_entrance", "weight": 90 },
    { "from": "ict_f0_ict_entrance", "to": "ict_f0_guards_desk", "weight": 6 },
    { "from": "ict_f0_guards_desk", "to": "ict_f0_liftstairs", "weight": 9 },
    { "from": "ict_f0_liftstairs", "to": "ict_f0_ict_003_ieee_electron_devices_society", "weight": 12 },
    { "from": "ict_f0_ict_003_ieee_electron_devices_society", "to": "ict_f0_ict_002_microprocessor_and_microcontroller_lab", "weight": 18 },
    { "from": "ict_f0_ict_002_microprocessor_and_microcontroller_lab", "to": "ict_f0_ict_001_circuit_and_network_lab", "weight": 3 },
    { "from": "ict_f0_ict_003_ieee_electron_devices_society", "to": "ict_f0_faculty_washroom", "weight": 24 },
    { "from": "ict_f0_faculty_washroom", "to": "ict_f0_ict_004", "weight": 15 },
    { "from": "ict_f0_ict_004", "to": "ict_f0_ict_009_electrical_and_electronics_measurement_lab", "weight": 3 },
    { "from": "ict_f0_ict_004", "to": "ict_f0_ict_005_digital_electronics_lab", "weight": 45 },
    { "from": "ict_f0_ict_005_digital_electronics_lab", "to": "ict_f0_ict_008", "weight": 3 },
    { "from": "ict_f0_ict_005_digital_electronics_lab", "to": "ict_f0_male_washroom", "weight": 24 },
    { "from": "ict_f0_male_washroom", "to": "ict_f0_female_washroom", "weight": 6 },
    { "from": "ict_f0_female_washroom", "to": "ict_f0_stairs", "weight": 12 },
    { "from": "ext_f0_under_construction_building", "to": "ext_f0_heritage_school_canteen", "weight": 150 },
    { "from": "ext_f0_heritage_school_canteen", "to": "ext_f0_j4", "weight": 120 },
    { "from": "ext_f0_j1", "to": "ext_f0_under_construction_building", "weight": 240 },
    { "from": "ext_f0_j4", "to": "ext_f0_heritage_school_entry_gate", "weight": 60 },
    { "from": "ext_f0_heritage_school_entry_gate", "to": "ext_f0_fee_department", "weight": 15 },
    { "from": "ext_f0_j4", "to": "ext_f0_heritage_law_college", "weight": 30 },
    { "from": "ext_f0_heritage_law_college", "to": "ext_f0_punjab_national_bank", "weight": 120 },
    { "from": "ext_f0_punjab_national_bank", "to": "ext_f0_gate_number_3", "weight": 90 },
    { "from": "ext_f0_gate_number_3", "to": "ext_f0_atm", "weight": 30 },
    { "from": "ext_f0_j3", "to": "ext_f0_basketball_court", "weight": 45 },
    { "from": "ext_f0_basketball_court", "to": "ext_f0_school_cricket_ground", "weight": 30 },
    { "from": "ext_f0_school_cricket_ground", "to": "ext_f0_j5", "weight": 240 },
    { "from": "ext_f0_j5", "to": "ext_f0_gate_number_3", "weight": 240 }
  ]
};

// --- Theme Handling System ---
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        isLightTheme = true;
    } else {
        document.body.classList.remove("light-theme");
        isLightTheme = false;
    }
    updateThemeUI();
}

function toggleTheme() {
    if (document.body.classList.contains("light-theme")) {
        document.body.classList.remove("light-theme");
        isLightTheme = false;
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.add("light-theme");
        isLightTheme = true;
        localStorage.setItem("theme", "light");
    }
    updateThemeUI();
    drawMap();
}

function updateThemeUI() {
    const landingToggle = document.getElementById("btn-theme-toggle-landing");
    if (landingToggle) {
        const textSpan = landingToggle.querySelector(".theme-text");
        if (textSpan) {
            textSpan.innerText = isLightTheme ? "Dark Mode" : "Light Mode";
        }
    }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initCanvas();
    fetchMapData();
    setupEventHandlers();
    initAdminPanel();
    
    // Trigger Lucide Icons initialization
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// --- Initialize Interactive Canvas and Resize Listeners ---
function initCanvas() {
    canvas = document.getElementById("map-canvas");
    ctx = canvas.getContext("2d");
    
    resizeCanvas();
    window.addEventListener("resize", () => {
        resizeCanvas();
        drawMap();
    });
}

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// --- Setup Event Listeners ---
function setupEventHandlers() {
    // --- LANDING PAGE LOGIC ---
    document.getElementById("btn-start-nav").addEventListener("click", () => {
        document.getElementById("landing-page").classList.add("hidden");
        document.getElementById("app-container").classList.remove("hidden");
        
        // Ensure canvas matches new layout size after unhiding
        setTimeout(() => {
            resizeCanvas();
            fitMapToViewport();
        }, 10);
    });

    document.getElementById("btn-back-home").addEventListener("click", () => {
        document.getElementById("app-container").classList.add("hidden");
        document.getElementById("landing-page").classList.remove("hidden");
    });

    // Theme Toggle Event Listeners
    const themeLandingBtn = document.getElementById("btn-theme-toggle-landing");
    if (themeLandingBtn) {
        themeLandingBtn.addEventListener("click", toggleTheme);
    }
    const themeAppBtn = document.getElementById("btn-theme-toggle-app");
    if (themeAppBtn) {
        themeAppBtn.addEventListener("click", toggleTheme);
    }

    // Landing Page Navigation Scrolling transitions
    document.getElementById("btn-about").addEventListener("click", () => {
        document.getElementById("about-section").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("btn-close-about").addEventListener("click", () => {
        document.getElementById("about-modal").classList.add("hidden");
    });
    document.getElementById("btn-back-about").addEventListener("click", () => {
        document.getElementById("about-modal").classList.add("hidden");
    });
    
    document.getElementById("btn-help").addEventListener("click", () => {
        document.getElementById("help-section").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("btn-close-help").addEventListener("click", () => {
        document.getElementById("help-modal").classList.add("hidden");
    });
    document.getElementById("btn-back-help").addEventListener("click", () => {
        document.getElementById("help-modal").classList.add("hidden");
    });

    document.getElementById("btn-scroll-down").addEventListener("click", () => {
        document.getElementById("help-section").scrollIntoView({ behavior: "smooth" });
    });
    
    document.getElementById("btn-history").addEventListener("click", () => {
        loadSearchHistory();
        document.getElementById("history-modal").classList.remove("hidden");
    });
    document.getElementById("btn-close-history").addEventListener("click", () => {
        document.getElementById("history-modal").classList.add("hidden");
    });
    document.getElementById("btn-back-history").addEventListener("click", () => {
        document.getElementById("history-modal").classList.add("hidden");
    });
    document.getElementById("btn-clear-history").addEventListener("click", async () => {
        try {
            await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
        } catch(e) {
            localStorage.removeItem("spotNgoHistory"); // fallback
        }
        loadSearchHistory();
    });

    // Buttons for zooming and panning
    const panAmount = 150;
    document.getElementById("btn-pan-up").addEventListener("click", () => { offsetY += panAmount; drawMap(); });
    document.getElementById("btn-pan-down").addEventListener("click", () => { offsetY -= panAmount; drawMap(); });
    document.getElementById("btn-pan-left").addEventListener("click", () => { offsetX += panAmount; drawMap(); });
    document.getElementById("btn-pan-right").addEventListener("click", () => { offsetX -= panAmount; drawMap(); });

    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomMap(1.2));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomMap(0.8));
    document.getElementById("btn-reset-view").addEventListener("click", () => fitMapToViewport());
    document.getElementById("btn-toggle-grid").addEventListener("click", toggleGrid);
    
    // Core Route compute actions
    document.getElementById("btn-find-path").addEventListener("click", computeRoute);
    document.getElementById("btn-clear").addEventListener("click", clearRoute);
    
    // Quick Presets hooks
    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const fromId = e.currentTarget.getAttribute("data-from");
            const toId = e.currentTarget.getAttribute("data-to");
            
            document.getElementById("start-node").value = fromId;
            document.getElementById("end-node").value = toId;
            startNodeId = fromId;
            endNodeId = toId;
            
            computeRoute();
        });
    });

    // Dropdowns changes
    document.getElementById("start-node").addEventListener("change", (e) => {
        startNodeId = e.target.value;
        drawMap();
    });
    document.getElementById("end-node").addEventListener("change", (e) => {
        endNodeId = e.target.value;
        drawMap();
    });

    // Floor navigation clicks
    document.querySelectorAll(".floor-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".floor-tab").forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentFloor = parseInt(e.currentTarget.getAttribute("data-floor"));
            
            updateBanner(`Viewing Floor <strong>${currentFloor}</strong> map.`);
            drawMap();
        });
    });

    // --- Interactive Canvas Drag and Zoom Listeners ---
    canvas.addEventListener("mousedown", (e) => {
        // Prevent action on right clicks (handled separately)
        if (e.button === 2) return;
        
        isDragging = true;
        startDragX = e.clientX - offsetX;
        startDragY = e.clientY - offsetY;
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        if (isDragging) {
            offsetX = e.clientX - startDragX;
            offsetY = e.clientY - startDragY;
            drawMap();
        } else {
            // Check if mouse is hovering over a node
            const worldCoords = screenToWorld(screenX, screenY);
            const foundNode = findNodeAt(worldCoords.x, worldCoords.y);
            
            if (foundNode && foundNode.floor === currentFloor) {
                if (hoveredNodeId !== foundNode.id) {
                    hoveredNodeId = foundNode.id;
                    canvas.style.cursor = "pointer";
                    drawMap();
                }
            } else if (hoveredNodeId !== null) {
                hoveredNodeId = null;
                canvas.style.cursor = "grab";
                drawMap();
            }
        }
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Mouse scroll for smooth zoom centering at cursor position
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Project cursor coordinate back into world space
        const worldPos = screenToWorld(mouseX, mouseY);
        
        scale *= zoomFactor;
        
        // Clamp scaling factor to avoid extreme bounds
        scale = Math.max(0.1, Math.min(10.0, scale));
        
        // Re-adjust offets to center zoom on cursor coordinate
        offsetX = mouseX - worldPos.x * scale;
        offsetY = mouseY - worldPos.y * scale;
        
        drawMap();
    }, { passive: false });

    // Node interactive selection (Double click for start)
    canvas.addEventListener("dblclick", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldPos = screenToWorld(mouseX, mouseY);
        const node = findNodeAt(worldPos.x, worldPos.y);
        
        if (node && node.floor === currentFloor) {
            startNodeId = node.id;
            document.getElementById("start-node").value = node.id;
            updateBanner(`Selected <strong>${node.label}</strong> as Starting Point.`);
            drawMap();
        }
    });

    // Node selection (Right click for destination)
    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldPos = screenToWorld(mouseX, mouseY);
        const node = findNodeAt(worldPos.x, worldPos.y);
        
        if (node && node.floor === currentFloor) {
            endNodeId = node.id;
            document.getElementById("end-node").value = node.id;
            updateBanner(`Selected <strong>${node.label}</strong> as Destination.`);
            drawMap();
        }
    });
}

// --- Coordinate Translation Logic ---
function worldToScreen(wx, wy) {
    return {
        x: wx * scale + offsetX,
        y: wy * scale + offsetY
    };
}

function screenToWorld(sx, sy) {
    return {
        x: (sx - offsetX) / scale,
        y: (sy - offsetY) / scale
    };
}

// Find a node within click bounds (approx 12 units in coordinate space)
function findNodeAt(wx, wy) {
    const clickRadius = 15;
    return mapNodes.find(node => {
        const dx = node.x - wx;
        const dy = node.y - wy;
        return Math.sqrt(dx*dx + dy*dy) <= clickRadius;
    });
}

// --- Fetch Map Data from API / Load Fallback ---
async function fetchMapData() {
    updateStatus("connecting", "Connecting to Brain...");
    
    try {
        const response = await fetch(`${API_BASE_URL}/map`);
        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }
        const data = await response.json();
        processMapData(data);
        updateStatus("connected", "Online - API Active");
        
    } catch (error) {
        console.warn("Could not connect to Flask Backend API. Loading local offline fallback...", error);
        processMapData(FALLBACK_MAP_DATA);
        updateStatus("offline", "Simulated - Local Engine");
    }
}

// Process data, build lookups, and populate selects
function processMapData(data) {
    mapNodes = data.nodes || [];
    mapEdges = data.edges || [];
    
    // Build quick dictionary lookups
    nodesDict = {};
    adjacencyList = {};
    
    mapNodes.forEach(node => {
        nodesDict[node.id] = node;
        adjacencyList[node.id] = {};
    });
    
    mapEdges.forEach(edge => {
        const u = edge.from;
        const v = edge.to;
        const w = edge.weight;
        
        if (nodesDict[u] && nodesDict[v]) {
            adjacencyList[u][v] = w;
            adjacencyList[v][u] = w;
        }
    });
    
    populateNodeSelects();
    fitMapToViewport();
    
    // Trigger animated rendering cycle
    startAnimationLoop();
}

function populateNodeSelects() {
    const startSelect = document.getElementById("start-node");
    const endSelect = document.getElementById("end-node");
    
    // Clear out except first choice
    startSelect.innerHTML = '<option value="">-- Choose Starting Point --</option>';
    endSelect.innerHTML = '<option value="">-- Choose Destination --</option>';
    
    // Sort nodes alphabetically for easier readability
    const sortedNodes = [...mapNodes].sort((a, b) => a.label.localeCompare(b.label));
    
    sortedNodes.forEach(node => {
        // Only list readable room items or gates, hide junctions for cleanliness
        if (node.type !== "junction") {
            const text = `${node.label} (Floor ${node.floor})`;
            
            const startOpt = new Option(text, node.id);
            const endOpt = new Option(text, node.id);
            
            startSelect.add(startOpt);
            endSelect.add(endOpt);
        }
    });
}

// Automatically scales and pans the map to perfectly fit the canvas
function fitMapToViewport() {
    if (mapNodes.length === 0) return;
    
    // Get coordinate bounding limits
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    // Filter nodes based on active floor to make zoom focused
    const floorNodes = mapNodes.filter(n => n.floor === currentFloor);
    const targetNodes = floorNodes.length > 0 ? floorNodes : mapNodes;
    
    targetNodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    });
    
    const mapW = maxX - minX;
    const mapH = maxY - minY;
    
    // Add extra viewport margin cushion
    const padding = 60;
    const drawW = canvas.width - padding * 2;
    const drawH = canvas.height - padding * 2;
    
    const scaleX = drawW / (mapW || 1);
    const scaleY = drawH / (mapH || 1);
    
    scale = Math.min(scaleX, scaleY);
    // Zoom in significantly by default so users can read the map easily
    scale = Math.max(0.8, Math.min(3.5, scale * 1.5));
    
    // Center bounding box on the screen
    const centerX = minX + mapW / 2;
    const centerY = minY + mapH / 2;
    
    offsetX = canvas.width / 2 - centerX * scale;
    offsetY = canvas.height / 2 - centerY * scale;
    
    drawMap();
}

function zoomMap(factor) {
    const mouseX = canvas.width / 2;
    const mouseY = canvas.height / 2;
    const worldPos = screenToWorld(mouseX, mouseY);
    
    scale *= factor;
    scale = Math.max(0.1, Math.min(10.0, scale));
    
    offsetX = mouseX - worldPos.x * scale;
    offsetY = mouseY - worldPos.y * scale;
    drawMap();
}

function toggleGrid() {
    gridEnabled = !gridEnabled;
    drawMap();
}

// --- Local A* Engine (Fallback Simulator for standalone robustness) ---
function runLocalAstar(start, end) {
    const openSet = [[0, start]];
    const cameFrom = {};
    
    const gScore = { [start]: 0 };
    const fScore = { [start]: localHeuristic(start, end) };
    
    const openSetHash = new Set([start]);
    
    while (openSet.length > 0) {
        // Sort ascending to get node with lowest f_score
        openSet.sort((a, b) => a[0] - b[0]);
        const [_, current] = openSet.shift();
        
        openSetHash.delete(current);
        
        if (current === end) {
            // Reconstruct shortest path
            const path = [];
            let curr = end;
            while (curr in cameFrom) {
                path.push(curr);
                curr = cameFrom[curr];
            }
            path.push(start);
            return path.reverse();
        }
        
        const neighbors = adjacencyList[current] || {};
        for (const neighbor in neighbors) {
            const weight = neighbors[neighbor];
            const tentativeG = gScore[current] + weight;
            
            if (tentativeG < (gScore[neighbor] !== undefined ? gScore[neighbor] : Infinity)) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeG;
                const f = tentativeG + localHeuristic(neighbor, end);
                fScore[neighbor] = f;
                
                if (!openSetHash.has(neighbor)) {
                    openSet.push([f, neighbor]);
                    openSetHash.add(neighbor);
                }
            }
        }
    }
    return []; // No path found
}

function localHeuristic(n1, n2) {
    const node1 = nodesDict[n1];
    const node2 = nodesDict[n2];
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const df = (node1.floor - node2.floor) * 120.0;
    return Math.sqrt(dx*dx + dy*dy + df*df);
}

function generateLocalDirections(path) {
    const directions = [];
    for (let i = 0; i < path.length - 1; i++) {
        const u = nodesDict[path[i]];
        const v = nodesDict[path[i+1]];
        const weight = adjacencyList[path[i]][path[i+1]];
        
        let instruction = "";
        if (u.floor !== v.floor) {
            const verb = v.type === "stairs_lift" ? "Take the Lift/Stairs" : "Change floors";
            instruction = `${verb} from ${u.label} (Floor ${u.floor}) to ${v.label} (Floor ${v.floor})`;
        } else {
            instruction = `Walk from ${u.label} to ${v.label} (${weight} meters)`;
        }
        
        directions.push({
            step: i + 1,
            instruction: instruction,
            distance: weight,
            floor: u.floor
        });
    }
    return directions;
}

// --- Core Route Compute Actions ---
async function computeRoute() {
    if (!startNodeId || !endNodeId) {
        updateBanner("<i data-lucide='alert-triangle'></i> Please select both <strong>Start</strong> and <strong>Destination</strong> points.");
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    if (startNodeId === endNodeId) {
        showToast("<strong>You are already at the selected location.</strong>", false);
        return;
    }
    
    updateBanner("Computing shortest path...");
    const requestBody = { from: startNodeId, to: endNodeId };
    
    try {
        // Fetch computed route from the API
        const response = await fetch(`${API_BASE_URL}/find-path`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.same_location) {
            // Server confirmed same source/destination
            showToast("<strong>You are already at the selected location.</strong>", false);
            clearRouteResults();
        } else if (data.success) {
            computedPath = data.path;
            computedDirections = data.directions;
            totalDistance = data.total_distance;
            displayRouteResults();
        } else {
            updateBanner(`Route Calculation Failed: ${data.message}`);
            clearRouteResults();
        }
    } catch (error) {
        console.warn("API pathfinding unavailable, utilizing local routing engine.", error);
        
        // Execute pathfinding locally
        const path = runLocalAstar(startNodeId, endNodeId);
        if (path.length > 0) {
            computedPath = path;
            computedDirections = generateLocalDirections(path);
            
            totalDistance = 0;
            for (let i = 0; i < path.length - 1; i++) {
                totalDistance += adjacencyList[path[i]][path[i+1]] || 0;
            }
            
            displayRouteResults();
        } else {
            updateBanner("No path could be computed between the selected locations.");
            clearRouteResults();
        }
    }
}

// Reveal results and draw directions UI
function displayRouteResults() {
    saveSearchToHistory();
    const resultsPanel = document.getElementById("path-results");
    resultsPanel.classList.remove("hidden");
    
    document.getElementById("val-distance").innerText = `${totalDistance}m`;
    // Est. time: 80 meters per minute walking speed
    const estTime = Math.ceil(totalDistance / 80);
    document.getElementById("val-time").innerText = `${estTime} min`;
    
    // Count floor transitions
    let floorChanges = 0;
    for (let i = 0; i < computedPath.length - 1; i++) {
        if (nodesDict[computedPath[i]].floor !== nodesDict[computedPath[i+1]].floor) {
            floorChanges++;
        }
    }
    document.getElementById("val-floors").innerText = floorChanges;
    
    // Build directions list elements
    const dirListContainer = document.getElementById("directions-list");
    dirListContainer.innerHTML = "";
    
    computedDirections.forEach(step => {
        const stepDiv = document.createElement("div");
        stepDiv.className = "direction-step";
        if (step.instruction.includes("Floor")) {
            stepDiv.className += " floor-change";
        }
        
        // Add click listener so clicking a turn highlights that floor and focuses it!
        stepDiv.addEventListener("click", () => {
            currentFloor = step.floor;
            // Activate corresponding floor tab
            document.querySelectorAll(".floor-tab").forEach(tab => {
                tab.classList.remove("active");
                if (parseInt(tab.getAttribute("data-floor")) === currentFloor) {
                    tab.classList.add("active");
                }
            });
            drawMap();
            updateBanner(`Focused on floor change step ${step.step}.`);
        });
        
        stepDiv.innerHTML = `
            <div class="step-num">${step.step}</div>
            <div class="step-details">
                <span class="step-text">${step.instruction}</span>
                <span class="step-dist">${step.distance} meters &bull; Click to view floor</span>
            </div>
        `;
        dirListContainer.appendChild(stepDiv);
    });
    
    // Check if path starts/ends on another floor, set canvas floor focus
    const startNode = nodesDict[startNodeId];
    if (startNode && startNode.floor !== currentFloor) {
        currentFloor = startNode.floor;
        document.querySelectorAll(".floor-tab").forEach(tab => {
            tab.classList.remove("active");
            if (parseInt(tab.getAttribute("data-floor")) === currentFloor) {
                tab.classList.add("active");
            }
        });
    }
    
    updateBanner(`Route computed! Glowing path covers <strong>${totalDistance}m</strong> across floor plans.`);
    fitMapToViewport();
}

function clearRoute() {
    startNodeId = "";
    endNodeId = "";
    document.getElementById("start-node").value = "";
    document.getElementById("end-node").value = "";
    
    clearRouteResults();
    updateBanner("Cleared selection. Double-click map to set <strong>Start</strong> point.");
    drawMap();
}

function clearRouteResults() {
    computedPath = [];
    computedDirections = [];
    totalDistance = 0;
    
    document.getElementById("path-results").classList.add("hidden");
    document.getElementById("directions-list").innerHTML = "";
}

// --- Master Canvas Drawing Loop ---
function drawMap() {
    if (!ctx || mapNodes.length === 0) return;
    
    // Clear whole viewport
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw dynamic background blueprint grid
    if (gridEnabled) {
        drawBlueprintGrid();
    }
    
    // 2. Draw architectural building blocks (Zones)
    drawBuildingOutlines();
    
    // 3. Draw connections (Corridors & Roads)
    drawEdges();
    
    // 4. Draw shortest computed route (Laser overlay)
    drawShortestPathLaser();
    
    // 5. Draw node points (rooms, gates, utilities)
    drawNodes();
    
    // 6. Draw HUD overlays (Compass, Scale Bar)
    drawCompassAndScale();
    
    // 7. Draw visual hover labels/overlays
    drawHoverTooltip();
}

// Background Blueprint Grid
function drawBlueprintGrid() {
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.04)" : "rgba(99, 102, 241, 0.03)";
    ctx.lineWidth = 1;
    
    const gridSpacing = 50; // Grid cells in world space
    
    // Calculate world-bounds visible on screen
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(canvas.width, canvas.height);
    
    const startX = Math.floor(topLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(bottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(topLeft.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(bottomRight.y / gridSpacing) * gridSpacing;
    
    // Draw vertical grid lines
    for (let x = startX; x <= endX; x += gridSpacing) {
        const screenPos = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(screenPos.x, 0);
        ctx.lineTo(screenPos.x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = startY; y <= endY; y += gridSpacing) {
        const screenPos = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, screenPos.y);
        ctx.lineTo(canvas.width, screenPos.y);
        ctx.stroke();
    }
}

// Draw dynamic building outline bounding boxes to contextualize zones
function drawBuildingOutlines() {
    // Define the buildings and their node prefixes
    const buildings = [
        { 
            code: "cme_", 
            name: "CME BUILDING (Civil & Mech)", 
            color: isLightTheme ? "rgba(79, 70, 229, 0.03)" : "rgba(99, 102, 241, 0.02)", 
            border: isLightTheme ? "rgba(79, 70, 229, 0.12)" : "rgba(99, 102, 241, 0.12)" 
        },
        { 
            code: "cb_", 
            name: "CB BUILDING (Central Block)", 
            color: isLightTheme ? "rgba(37, 99, 235, 0.03)" : "rgba(59, 130, 246, 0.02)", 
            border: isLightTheme ? "rgba(37, 99, 235, 0.15)" : "rgba(59, 130, 246, 0.15)" 
        },
        { 
            code: "ict_", 
            name: "ICT BUILDING (Info Tech)", 
            color: isLightTheme ? "rgba(124, 58, 237, 0.03)" : "rgba(139, 92, 246, 0.02)", 
            border: isLightTheme ? "rgba(124, 58, 237, 0.12)" : "rgba(139, 92, 246, 0.12)" 
        }
    ];

    buildings.forEach(b => {
        // Find all nodes in this building on the current floor
        const bNodes = mapNodes.filter(n => n.id.startsWith(b.code) && n.floor === currentFloor);
        if (bNodes.length === 0) return;

        // Compute coordinate boundary limits
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        bNodes.forEach(n => {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        });

        // Add visual padding around nodes
        const pad = 35;
        const wX = minX - pad;
        const wY = minY - pad;
        const wW = (maxX - minX) + pad * 2;
        const wH = (maxY - minY) + pad * 2;

        // Project to screen pixels
        const screenTopLeft = worldToScreen(wX, wY);
        const screenBottomRight = worldToScreen(wX + wW, wY + wH);
        const sW = screenBottomRight.x - screenTopLeft.x;
        const sH = screenBottomRight.y - screenTopLeft.y;

        // Draw structural filled bounding block
        ctx.beginPath();
        ctx.roundRect(screenTopLeft.x, screenTopLeft.y, sW, sH, Math.max(8, 12 * scale));
        ctx.fillStyle = b.color;
        ctx.strokeStyle = b.border;
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.fill();
        ctx.stroke();

        // Draw building name banner in block background
        ctx.font = `bold ${Math.max(10, Math.round(13 * scale))}px var(--font-heading)`;
        ctx.fillStyle = isLightTheme ? "rgba(15, 23, 42, 0.18)" : "rgba(255, 255, 255, 0.15)";
        ctx.textAlign = "left";
        ctx.fillText(b.name, screenTopLeft.x + 15, screenTopLeft.y + 25);
    });
}

// Draw base graph edges as realistic pathways (Wide roads and corridors)
function drawEdges() {
    mapEdges.forEach(edge => {
        const u = nodesDict[edge.from];
        const v = nodesDict[edge.to];
        
        if (u && v && u.floor === currentFloor && v.floor === currentFloor) {
            const sU = worldToScreen(u.x, u.y);
            const sV = worldToScreen(v.x, v.y);
            
            const isOutdoor = u.id.startsWith("ext_") && v.id.startsWith("ext_");
            
            // --- Realistic Roadway / Corridor Rendering ---
            ctx.lineCap = "round";

            // 1. Draw outer curbs / borders
            ctx.beginPath();
            ctx.moveTo(sU.x, sU.y);
            ctx.lineTo(sV.x, sV.y);
            ctx.lineWidth = Math.max(14, 24 * scale);
            ctx.strokeStyle = isOutdoor 
                ? (isLightTheme ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 110, 130, 0.6)") 
                : (isLightTheme ? "rgba(79, 70, 229, 0.15)" : "rgba(99, 102, 241, 0.3)");
            ctx.stroke();

            // 2. Draw main road surface
            ctx.beginPath();
            ctx.moveTo(sU.x, sU.y);
            ctx.lineTo(sV.x, sV.y);
            ctx.lineWidth = Math.max(10, 18 * scale);
            ctx.strokeStyle = isOutdoor 
                ? (isLightTheme ? "rgba(226, 232, 240, 1)" : "rgba(45, 50, 60, 1)") 
                : (isLightTheme ? "rgba(241, 245, 249, 1)" : "rgba(15, 23, 42, 1)");
            ctx.stroke();
            
            // 3. Draw dashed lane division in the middle
            ctx.beginPath();
            ctx.moveTo(sU.x, sU.y);
            ctx.lineTo(sV.x, sV.y);
            ctx.lineWidth = Math.max(2, 3 * scale);
            ctx.setLineDash([10 * scale, 10 * scale]);
            ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.4)" : "rgba(255, 215, 0, 0.85)"; // Dash line
            ctx.stroke();
            ctx.setLineDash([]); // reset line dash immediately
        }
    });
}

// Draw computed route with double laser glows and flow particles
function drawShortestPathLaser() {
    if (computedPath.length < 2) return;
    
    // 1st Pass: Large glowing background laser blur
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.25)" : "rgba(99, 102, 241, 0.25)";
    ctx.lineWidth = Math.max(8, 12 * scale);
    ctx.shadowColor = isLightTheme ? "#4f46e5" : "#6366f1";
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    let hasPointOnFloor = false;
    
    for (let i = 0; i < computedPath.length; i++) {
        const node = nodesDict[computedPath[i]];
        if (node && node.floor === currentFloor) {
            const screenPos = worldToScreen(node.x, node.y);
            if (!hasPointOnFloor) {
                ctx.moveTo(screenPos.x, screenPos.y);
                hasPointOnFloor = true;
            } else {
                ctx.lineTo(screenPos.x, screenPos.y);
            }
        } else {
            // Cut line if it transitions off this floor
            hasPointOnFloor = false;
        }
    }
    ctx.stroke();
    
    // Reset shadow context immediately to keep renders fast
    ctx.shadowBlur = 0;
    
    // 2nd Pass: Inner high-intensity core
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    hasPointOnFloor = false;
    for (let i = 0; i < computedPath.length; i++) {
        const node = nodesDict[computedPath[i]];
        if (node && node.floor === currentFloor) {
            const screenPos = worldToScreen(node.x, node.y);
            if (!hasPointOnFloor) {
                ctx.moveTo(screenPos.x, screenPos.y);
                hasPointOnFloor = true;
            } else {
                ctx.lineTo(screenPos.x, screenPos.y);
            }
        } else {
            hasPointOnFloor = false;
        }
    }
    ctx.stroke();
    
    // 3rd Pass: Draw animated flow pulse particle along each path vector segment
    drawAnimatedFlowParticles();
}

// Draw animated time-based flow pulses traveling along vectors
function drawAnimatedFlowParticles() {
    const time = Date.now() / 1000;
    // Particle velocity
    const speed = 2.0; 
    
    for (let i = 0; i < computedPath.length - 1; i++) {
        const u = nodesDict[computedPath[i]];
        const v = nodesDict[computedPath[i+1]];
        
        if (u && v && u.floor === currentFloor && v.floor === currentFloor) {
            const sU = worldToScreen(u.x, u.y);
            const sV = worldToScreen(v.x, v.y);
            
            // Calculate segment length
            const dx = sV.x - sU.x;
            const dy = sV.y - sU.y;
            
            // Periodically cycle particle progress (0.0 to 1.0)
            let progress = (time * speed) % 1.0;
            
            // Calculate interpolated screen position
            const px = sU.x + dx * progress;
            const py = sU.y + dy * progress;
            
            // Draw small glowing laser flow bullet
            ctx.beginPath();
            ctx.arc(px, py, Math.max(4, 5 * scale), 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.shadowColor = isLightTheme ? "#4f46e5" : "#6366f1";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }
}

// Draw physical nodes categorized by colors
function drawNodes() {
    const time = Date.now() / 1000;
    
    mapNodes.forEach(node => {
        // Draw nodes on the current active floor view
        if (node.floor === currentFloor) {
            const sPos = worldToScreen(node.x, node.y);
            const isStart = node.id === startNodeId;
            const isEnd = node.id === endNodeId;
            const isHovered = node.id === hoveredNodeId;
            const isPathNode = computedPath.includes(node.id);
            
            // UX Enhancement: Hide abstract internal routing points unless they are part of the active path
            if ((node.type === "junction" || node.type === "unknown") && !isPathNode && !isStart && !isEnd) {
                return;
            }
            
            // Get stylized colors matching node structures
            const colors = getNodeColors(node.type);
            
            // If hovered, draw subtle background ring
            if (isHovered) {
                ctx.beginPath();
                ctx.arc(sPos.x, sPos.y, Math.max(12, 16 * scale), 0, Math.PI * 2);
                ctx.fillStyle = isLightTheme ? "rgba(79, 70, 229, 0.1)" : "rgba(99, 102, 241, 0.12)";
                ctx.fill();
                ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.4)" : "rgba(99, 102, 241, 0.4)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Draw special outer pulse animation for endpoints
            if (isStart) {
                const pulseRadius = Math.max(12, 16 * scale) + Math.sin(time * 8) * 3;
                ctx.beginPath();
                ctx.arc(sPos.x, sPos.y, pulseRadius, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (isEnd) {
                const pulseRadius = Math.max(12, 16 * scale) + Math.sin(time * 8) * 3;
                ctx.beginPath();
                ctx.arc(sPos.x, sPos.y, pulseRadius, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(236, 72, 153, 0.45)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw solid node outline ring
            ctx.beginPath();
            const radius = isStart || isEnd ? Math.max(6, 8 * scale) : Math.max(4, 5 * scale);
            ctx.arc(sPos.x, sPos.y, radius, 0, Math.PI * 2);
            
            if (isStart) {
                ctx.fillStyle = isLightTheme ? "#059669" : "#10b981";
                ctx.strokeStyle = "#fff";
            } else if (isEnd) {
                ctx.fillStyle = isLightTheme ? "#db2777" : "#ec4899";
                ctx.strokeStyle = "#fff";
            } else {
                ctx.fillStyle = colors.fill;
                ctx.strokeStyle = isPathNode ? (isLightTheme ? "#4f46e5" : "#6366f1") : colors.border;
            }
            
            ctx.lineWidth = isPathNode || isHovered ? 2 : 1;
            ctx.fill();
            ctx.stroke();
            
            // --- PERMANENT ROOM LABELS FOR NORMAL USER READABILITY ---
            // Hide for abstract junctions/unknown utility points to prevent clutter
            if (node.type !== "junction" && node.type !== "unknown" && scale > 0.45) {
                ctx.shadowColor = isLightTheme ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = isLightTheme ? 2 : 4;
                ctx.fillStyle = isStart || isEnd ? (isLightTheme ? "#0f172a" : "#fff") : (isLightTheme ? "#0f172a" : "rgba(255, 255, 255, 0.85)");
                ctx.font = `${isStart || isEnd ? 'bold' : '500'} ${Math.max(9, Math.round(10 * scale))}px var(--font-body)`;
                ctx.textAlign = "left";
                
                // Offset label slightly to the right of node point
                const textOffset = isStart || isEnd ? Math.max(10, 13 * scale) : Math.max(7, 9 * scale);
                ctx.fillText(node.label, sPos.x + textOffset, sPos.y + 3);
                ctx.shadowBlur = 0; // reset
            }
        }
        
        // Visual indicator for stairs/lifts that link to active paths on other floors!
        else if (computedPath.includes(node.id) && (node.type === "stairs_lift" || node.type === "stairs")) {
            // Find if neighbor is on our current floor
            const neighbors = adjacencyList[node.id] || {};
            let hasNeighborOnThisFloor = false;
            for (const neighborId in neighbors) {
                if (nodesDict[neighborId] && nodesDict[neighborId].floor === currentFloor) {
                    hasNeighborOnThisFloor = true;
                    break;
                }
            }
            
            if (hasNeighborOnThisFloor) {
                // Draw staircase overlay portal glowing!
                const sPos = worldToScreen(node.x, node.y);
                const pulseRadius = Math.max(8, 10 * scale) + Math.sin(time * 5) * 2;
                ctx.beginPath();
                ctx.arc(sPos.x, sPos.y, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = isLightTheme ? "rgba(234, 88, 12, 0.12)" : "rgba(255, 157, 0, 0.15)";
                ctx.fill();
                ctx.strokeStyle = isLightTheme ? "rgba(234, 88, 12, 0.5)" : "rgba(255, 157, 0, 0.6)";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                // Portal label text
                ctx.font = `bold ${Math.round(8 * scale)}px var(--font-mono)`;
                ctx.fillStyle = varColorToHex("--text-secondary");
                ctx.textAlign = "center";
                ctx.fillText(`UP/DOWN portal to Fl.${node.floor}`, sPos.x, sPos.y - Math.max(12, 15*scale));
            }
        }
    });
}

// Categorized node theme palette getter
function getNodeColors(type) {
    if (isLightTheme) {
        switch (type) {
            case "college_gate":
                return { fill: "#ca8a04", border: "#fff" }; // Amber/Gold
            case "building_entrance":
            case "entry_gate":
                return { fill: "#059669", border: "#fff" }; // Emerald
            case "office_room":
                return { fill: "#06b6d4", border: "rgba(6, 182, 212, 0.5)" }; // Cyber Cyan
            case "classroom":
                return { fill: "#a855f7", border: "rgba(168, 85, 247, 0.5)" }; // Violet
            case "lab":
                return { fill: "#d946ef", border: "rgba(217, 70, 239, 0.5)" }; // Magenta
            case "stairs_lift":
            case "stairs":
                return { fill: "#ea580c", border: "#fff" }; // Orange
            case "hall":
                return { fill: "#2563eb", border: "rgba(37, 99, 235, 0.5)" }; // Intense Blue
            case "junction":
                return { fill: "#cbd5e1", border: "rgba(203, 213, 225, 0.4)" }; // Slate Light
            default:
                return { fill: "#cbd5e1", border: "#94a3b8" };
        }
    } else {
        switch (type) {
            case "college_gate":
                return { fill: "#ffd700", border: "#fff" }; // Gold
            case "building_entrance":
            case "entry_gate":
                return { fill: "#10b981", border: "#fff" }; // Emerald Green
            case "office_room":
                return { fill: "#00f0ff", border: "rgba(0, 240, 255, 0.5)" }; // Cyber Cyan
            case "classroom":
                return { fill: "#8b5cf6", border: "rgba(139, 92, 246, 0.5)" }; // Violet
            case "lab":
                return { fill: "#ff00ea", border: "rgba(255, 0, 234, 0.5)" }; // Magenta
            case "stairs_lift":
            case "stairs":
                return { fill: "#ff9d00", border: "#fff" }; // Stair Warning Orange
            case "hall":
                return { fill: "#0076ff", border: "rgba(0, 118, 255, 0.5)" }; // Intense Blue
            case "junction":
                return { fill: "#4e5e6a", border: "rgba(78, 94, 106, 0.4)" }; // Slate Gray
            default:
                return { fill: "#2c3b47", border: "#4e5e6a" }; // Muted Slate
        }
    }
}

// Draw dynamic HUD overlay tools (Compass, Scale Bar)
function drawCompassAndScale() {
    // 1. Scale Bar HUD in bottom-left
    const startX = 30;
    const startY = canvas.height - 30;
    
    // Let's draw a bar representing exactly 100 meters (100 units in map coordinates)
    const meterUnits = 100;
    const barWidth = meterUnits * scale;
    
    if (barWidth > 15 && barWidth < canvas.width * 0.5) {
        ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.5)" : "rgba(99, 102, 241, 0.5)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        // Left tick
        ctx.moveTo(startX, startY - 4);
        ctx.lineTo(startX, startY + 4);
        // Main horizontal line
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + barWidth, startY);
        // Right tick
        ctx.moveTo(startX + barWidth, startY - 4);
        ctx.lineTo(startX + barWidth, startY + 4);
        ctx.stroke();
        
        // Scale label
        ctx.font = "500 10px var(--font-mono)";
        ctx.fillStyle = isLightTheme ? "rgba(79, 70, 229, 0.7)" : "rgba(99, 102, 241, 0.7)";
        ctx.textAlign = "left";
        ctx.fillText(`${meterUnits} meters (Map Scale)`, startX, startY - 10);
    }
    
    // 2. High-Tech HUD compass rose in upper-right
    const compassX = canvas.width - 60;
    const compassY = 120;
    const compassR = 22;
    
    // Draw compass outer HUD circle ring
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassR, 0, Math.PI * 2);
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.2)" : "rgba(99, 102, 241, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(compassX - compassR - 4, compassY);
    ctx.lineTo(compassX + compassR + 4, compassY);
    ctx.moveTo(compassX, compassY - compassR - 4);
    ctx.lineTo(compassX, compassY + compassR + 4);
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.1)" : "rgba(99, 102, 241, 0.1)";
    ctx.stroke();
    
    // Compass Needle (North indicator)
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 14); // tip
    ctx.lineTo(compassX - 5, compassY + 4); // left
    ctx.lineTo(compassX, compassY); // center
    ctx.closePath();
    ctx.fillStyle = "rgba(236, 72, 153, 0.75)"; // glowing north tip
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 14); // tip
    ctx.lineTo(compassX + 5, compassY + 4); // right
    ctx.lineTo(compassX, compassY); // center
    ctx.closePath();
    ctx.fillStyle = isLightTheme ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.75)";
    ctx.fill();
    
    // Compass labels
    ctx.font = "bold 9px var(--font-heading)";
    ctx.fillStyle = isLightTheme ? "rgba(79, 70, 229, 0.9)" : "rgba(236, 72, 153, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", compassX, compassY - compassR - 10);
}

// Draw dynamic hover tooltip over nodes
function drawHoverTooltip() {
    if (!hoveredNodeId) return;
    
    const node = nodesDict[hoveredNodeId];
    if (!node || node.floor !== currentFloor) return;
    
    const sPos = worldToScreen(node.x, node.y);
    
    // Draw Glassmorphic Tooltip Container
    const text = `${node.label} [${node.type.replace('_', ' ')}]`;
    ctx.font = "bold 11px var(--font-body)";
    const textWidth = ctx.measureText(text).width;
    
    const paddingX = 10;
    const paddingY = 6;
    const width = textWidth + paddingX * 2;
    const height = 22;
    
    const tx = sPos.x - width / 2;
    const ty = sPos.y - height - 16;
    
    // Draw rounded toolip base
    ctx.beginPath();
    ctx.roundRect(tx, ty, width, height, 5);
    ctx.fillStyle = isLightTheme ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 14, 23, 0.9)";
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.4)" : "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    // Draw little arrow pointer
    ctx.beginPath();
    ctx.moveTo(sPos.x - 4, ty + height);
    ctx.lineTo(sPos.x, ty + height + 4);
    ctx.lineTo(sPos.x + 4, ty + height);
    ctx.closePath();
    ctx.fillStyle = isLightTheme ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 14, 23, 0.9)";
    ctx.strokeStyle = isLightTheme ? "rgba(79, 70, 229, 0.4)" : "rgba(99, 102, 241, 0.4)";
    ctx.fill();
    
    // Draw text values
    ctx.fillStyle = isLightTheme ? "#0f172a" : "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, sPos.x, ty + height / 2);
}

// Animation loop to drive path pulses and coordinate glows
function startAnimationLoop() {
    function animate() {
        drawMap();
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Cancel any previous frames to prevent multiple threads running
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animate();
}

// --- Dynamic Overlays & Status Setters ---
function updateStatus(state, message) {
    const dot = document.querySelector(".status-dot");
    const label = document.querySelector(".status-text");
    
    dot.className = "status-dot"; // reset
    if (state === "connecting") {
        dot.classList.add("pulsing");
    } else if (state === "connected") {
        dot.classList.add("connected");
    } else {
        dot.classList.add("offline");
    }
    
    label.innerText = message;
}

function updateBanner(htmlContent) {
    const textElement = document.getElementById("banner-text");
    textElement.innerHTML = htmlContent;
}

// Dynamic Floating Toast Notification System
let toastTimer = null;
function showToast(message, isError = true) {
    const toast = document.getElementById("toast-alert");
    const msgEl = document.getElementById("toast-message");
    const iconEl = toast.querySelector(".toast-icon");
    
    msgEl.innerHTML = message;
    
    // Animate between neon warning pink and cyber status cyan
    if (isError) {
        toast.style.borderColor = "rgba(255, 0, 127, 0.4)";
        toast.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 0, 127, 0.2)";
        iconEl.style.color = "var(--color-pink)";
        iconEl.style.filter = "drop-shadow(0 0 4px var(--color-pink))";
        iconEl.setAttribute("data-lucide", "alert-triangle");
    } else {
        toast.style.borderColor = "rgba(0, 240, 255, 0.4)";
        toast.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.2)";
        iconEl.style.color = "var(--color-cyan)";
        iconEl.style.filter = "drop-shadow(0 0 4px var(--color-cyan))";
        iconEl.setAttribute("data-lucide", "info");
    }
    
    if (window.lucide) window.lucide.createIcons();
    
    // Clear any active running transition delays
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    
    toast.classList.remove("hidden");
    // Trigger smooth fade and slide down
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);
    
    // Auto slide back up and hide
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
        toastTimer = setTimeout(() => {
            toast.classList.add("hidden");
            toastTimer = null;
        }, 400);
    }, 4000);
}

// Resolve CSS hex values directly
function varColorToHex(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}


// =============================================================
// ADMIN PANEL SYSTEM
// =============================================================

// Admin state
let isAdminLoggedIn = false;
let adminNodes = [];      // working copy (pending edits)
let adminEdges = [];      // working copy
let pendingChanges = [];  // { action:'add'|'edit'|'delete', type:'node'|'edge', label, data, original }

const ADMIN_ID = 'admin@gmail.com';
const ADMIN_PW = 'admin';

// ---- Wire up all admin UI once DOM is ready ----
function initAdminPanel() {
    // Login flow
    const triggerLoginModal = () => {
        document.getElementById('admin-login-modal').classList.remove('hidden');
        document.getElementById('admin-id-input').value = '';
        document.getElementById('admin-pw-input').value = '';
        document.getElementById('login-error').classList.add('hidden');
        if (window.lucide) window.lucide.createIcons();
    };
    document.getElementById('btn-admin-login').addEventListener('click', triggerLoginModal);
    document.getElementById('btn-landing-admin-login').addEventListener('click', triggerLoginModal);

    document.getElementById('btn-close-login').addEventListener('click', () =>
        document.getElementById('admin-login-modal').classList.add('hidden'));

    document.getElementById('admin-id-input').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
    document.getElementById('admin-pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
    document.getElementById('btn-do-login').addEventListener('click', attemptLogin);

    // Admin panel close
    document.getElementById('btn-close-admin').addEventListener('click', closeAdminPanel);

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`admin-tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Node management
    document.getElementById('btn-add-node').addEventListener('click', () => openNodeForm(null));
    document.getElementById('btn-close-node-form').addEventListener('click', () =>
        document.getElementById('node-form-modal').classList.add('hidden'));
    document.getElementById('btn-cancel-node-form').addEventListener('click', () =>
        document.getElementById('node-form-modal').classList.add('hidden'));
    document.getElementById('btn-save-node-form').addEventListener('click', saveNodeForm);
    document.getElementById('node-search').addEventListener('input', () => renderNodesTable());

    // Edge management
    document.getElementById('btn-add-edge').addEventListener('click', () => openEdgeForm(null));
    document.getElementById('btn-close-edge-form').addEventListener('click', () =>
        document.getElementById('edge-form-modal').classList.add('hidden'));
    document.getElementById('btn-cancel-edge-form').addEventListener('click', () =>
        document.getElementById('edge-form-modal').classList.add('hidden'));
    document.getElementById('btn-save-edge-form').addEventListener('click', saveEdgeForm);
    document.getElementById('edge-search').addEventListener('input', () => renderEdgesTable());

    // Pending changes actions
    document.getElementById('btn-discard-changes').addEventListener('click', discardPendingChanges);
    document.getElementById('btn-proceed').addEventListener('click', openConfirmModal);

    // Confirm modal
    document.getElementById('btn-cancel-confirm').addEventListener('click', () =>
        document.getElementById('confirm-modal').classList.add('hidden'));
    document.getElementById('btn-apply-changes').addEventListener('click', applyChanges);

    // Close modals on overlay click
    ['admin-login-modal', 'node-form-modal', 'edge-form-modal', 'confirm-modal'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
            if (e.target.id === id) document.getElementById(id).classList.add('hidden');
        });
    });
}

async function attemptLogin() {
    const id    = document.getElementById('admin-id-input').value.trim();
    const pw    = document.getElementById('admin-pw-input').value;
    const errEl = document.getElementById('login-error');

    // Try backend authentication first
    let backendOk = false;
    try {
        const res  = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: id, password: pw })
        });
        const data = await res.json();
        if (data.success) {
            backendOk = true;
            sessionStorage.setItem('spotNgoAdminToken', data.token || '');
        }
    } catch(e) {
        // Backend offline – fall back to hardcoded credentials
        backendOk = (id === ADMIN_ID && pw === ADMIN_PW);
    }

    if (backendOk) {
        isAdminLoggedIn = true;
        errEl.classList.add('hidden');
        document.getElementById('admin-login-modal').classList.add('hidden');
        openAdminPanel();
    } else {
        errEl.classList.remove('hidden');
        document.getElementById('admin-pw-input').value = '';
        document.getElementById('admin-pw-input').focus();
        if (window.lucide) window.lucide.createIcons();
    }
}

function openAdminPanel() {
    // Deep-copy live data into working copies
    adminNodes = mapNodes.map(n => ({ ...n }));
    adminEdges = mapEdges.map(e => ({ ...e }));
    pendingChanges = [];

    updatePendingUI();
    renderNodesTable();
    renderEdgesTable();

    // Auto-transition to main map view if logged in from landing page
    const landing = document.getElementById('landing-page');
    if (!landing.classList.contains('hidden')) {
        landing.classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        setTimeout(() => {
            resizeCanvas();
            fitMapToViewport();
        }, 10);
    }

    document.getElementById('admin-panel-modal').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}

function closeAdminPanel() {
    document.getElementById('admin-panel-modal').classList.add('hidden');
}

// ---- Node Table ----
const TYPE_COLORS = {
    college_gate:      '#ffd700',
    building_entrance: '#39ff14',
    entry_gate:        '#39ff14',
    office_room:       '#00f0ff',
    classroom:         '#bd00ff',
    lab:               '#ff00ea',
    stairs_lift:       '#ff9d00',
    stairs:            '#ff9d00',
    hall:              '#0076ff',
    junction:          '#4e5e6a',
    unknown:           '#2c3b47'
};

function typeBadge(type) {
    const color = TYPE_COLORS[type] || '#4e5e6a';
    return `<span class="type-badge" style="background:${color}22;border:1px solid ${color}55;color:${color}">${type.replace(/_/g,' ')}</span>`;
}

function renderNodesTable() {
    const query = document.getElementById('node-search').value.toLowerCase();
    const tbody = document.getElementById('nodes-tbody');
    tbody.innerHTML = '';

    const filtered = adminNodes.filter(n =>
        n.id.toLowerCase().includes(query) ||
        n.label.toLowerCase().includes(query) ||
        (n.type || '').toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px">No nodes match your search.</td></tr>`;
        return;
    }

    filtered.forEach((node, idx) => {
        const realIdx = adminNodes.indexOf(node);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${node.id}</code></td>
            <td>${node.label}</td>
            <td style="font-family:var(--font-mono);font-size:11px">${node.x}</td>
            <td style="font-family:var(--font-mono);font-size:11px">${node.y}</td>
            <td style="font-family:var(--font-mono);font-size:11px">${node.floor}</td>
            <td>${typeBadge(node.type || 'unknown')}</td>
            <td>
                <div class="row-actions">
                    <button class="row-btn edit" title="Edit" onclick="openNodeForm(${realIdx})"><i data-lucide="pencil"></i></button>
                    <button class="row-btn delete" title="Delete" onclick="deleteNode(${realIdx})"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
}

function openNodeForm(idx) {
    const modal = document.getElementById('node-form-modal');
    const title = document.getElementById('node-form-title');
    const errEl = document.getElementById('node-form-error');
    errEl.classList.add('hidden');

    if (idx === null) {
        // ADD mode
        title.textContent = 'Add New Node';
        document.getElementById('node-edit-original-id').value = '';
        document.getElementById('nf-id').value = '';
        document.getElementById('nf-label').value = '';
        document.getElementById('nf-x').value = '';
        document.getElementById('nf-y').value = '';
        document.getElementById('nf-floor').value = '0';
        document.getElementById('nf-type').value = 'junction';
    } else {
        // EDIT mode
        const node = adminNodes[idx];
        title.textContent = 'Edit Node';
        document.getElementById('node-edit-original-id').value = node.id;
        document.getElementById('nf-id').value = node.id;
        document.getElementById('nf-label').value = node.label;
        document.getElementById('nf-x').value = node.x;
        document.getElementById('nf-y').value = node.y;
        document.getElementById('nf-floor').value = node.floor;
        document.getElementById('nf-type').value = node.type || 'unknown';
    }

    modal.classList.remove('hidden');
    document.getElementById('nf-id').focus();
    if (window.lucide) window.lucide.createIcons();
}

function saveNodeForm() {
    const errEl = document.getElementById('node-form-error');
    errEl.classList.add('hidden');

    const originalId = document.getElementById('node-edit-original-id').value;
    const newId    = document.getElementById('nf-id').value.trim();
    const newLabel = document.getElementById('nf-label').value.trim();
    const newX     = parseFloat(document.getElementById('nf-x').value);
    const newY     = parseFloat(document.getElementById('nf-y').value);
    const newFloor = parseInt(document.getElementById('nf-floor').value);
    const newType  = document.getElementById('nf-type').value;

    if (!newId || !newLabel || isNaN(newX) || isNaN(newY)) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Duplicate ID check (when adding or when ID changed)
    const isDuplicate = adminNodes.some(n => n.id === newId && n.id !== originalId);
    if (isDuplicate) {
        errEl.textContent = `Node ID "${newId}" already exists. Please use a unique ID.`;
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const newNode = { id: newId, label: newLabel, x: newX, y: newY, floor: newFloor, type: newType };

    if (!originalId) {
        // ADD
        adminNodes.push(newNode);
        pendingChanges.push({ action: 'add', type: 'node', label: `Add node: ${newLabel}`, data: newNode });
    } else {
        // EDIT
        const idx = adminNodes.findIndex(n => n.id === originalId);
        const original = { ...adminNodes[idx] };
        adminNodes[idx] = newNode;
        // Update any edges referencing the old ID
        if (newId !== originalId) {
            adminEdges.forEach(e => {
                if (e.from === originalId) e.from = newId;
                if (e.to   === originalId) e.to   = newId;
            });
        }
        pendingChanges.push({ action: 'edit', type: 'node', label: `Edit node: ${original.label} → ${newLabel}`, data: newNode, original });
    }

    document.getElementById('node-form-modal').classList.add('hidden');
    updatePendingUI();
    renderNodesTable();
    renderEdgesTable();
}

function deleteNode(idx) {
    const node = adminNodes[idx];
    if (!confirm(`Delete node "${node.label}" (${node.id})? Related edges will also be removed.`)) return;

    // Remove all edges that reference this node
    const removedEdges = adminEdges.filter(e => e.from === node.id || e.to === node.id);
    adminEdges = adminEdges.filter(e => e.from !== node.id && e.to !== node.id);
    adminNodes.splice(idx, 1);

    pendingChanges.push({ action: 'delete', type: 'node', label: `Delete node: ${node.label}` });
    if (removedEdges.length > 0) {
        pendingChanges.push({ action: 'delete', type: 'edge', label: `Auto-removed ${removedEdges.length} edge(s) connected to ${node.label}` });
    }

    updatePendingUI();
    renderNodesTable();
    renderEdgesTable();
}

// ---- Edge Table ----
function populateEdgeNodeSelects() {
    const fromSel = document.getElementById('ef-from');
    const toSel   = document.getElementById('ef-to');
    const sorted  = [...adminNodes].sort((a,b) => a.label.localeCompare(b.label));

    [fromSel, toSel].forEach(sel => {
        sel.innerHTML = '';
        sorted.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = `${n.label} (${n.id})`;
            sel.appendChild(opt);
        });
    });
}

function renderEdgesTable() {
    const query = document.getElementById('edge-search').value.toLowerCase();
    const tbody = document.getElementById('edges-tbody');
    tbody.innerHTML = '';

    const filtered = adminEdges
        .map((e, i) => ({ ...e, _idx: i }))
        .filter(e =>
            e.from.toLowerCase().includes(query) ||
            e.to.toLowerCase().includes(query)
        );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">No edges match your search.</td></tr>`;
        return;
    }

    filtered.forEach(edge => {
        const fromNode = adminNodes.find(n => n.id === edge.from);
        const toNode   = adminNodes.find(n => n.id === edge.to);
        const fromLabel = fromNode ? fromNode.label : edge.from;
        const toLabel   = toNode   ? toNode.label   : edge.to;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${edge.from}</code><br><span style="font-size:10px;color:var(--text-secondary)">${fromLabel}</span></td>
            <td><code>${edge.to}</code><br><span style="font-size:10px;color:var(--text-secondary)">${toLabel}</span></td>
            <td style="font-family:var(--font-mono);font-size:12px">${edge.weight} m</td>
            <td>
                <div class="row-actions">
                    <button class="row-btn edit" title="Edit" onclick="openEdgeForm(${edge._idx})"><i data-lucide="pencil"></i></button>
                    <button class="row-btn delete" title="Delete" onclick="deleteEdge(${edge._idx})"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
}

function openEdgeForm(idx) {
    populateEdgeNodeSelects();
    const errEl = document.getElementById('edge-form-error');
    errEl.classList.add('hidden');

    if (idx === null) {
        document.getElementById('edge-form-title').textContent = 'Add New Edge';
        document.getElementById('edge-edit-index').value = '';
        document.getElementById('ef-weight').value = '';
    } else {
        const edge = adminEdges[idx];
        document.getElementById('edge-form-title').textContent = 'Edit Edge';
        document.getElementById('edge-edit-index').value = idx;
        document.getElementById('ef-from').value   = edge.from;
        document.getElementById('ef-to').value     = edge.to;
        document.getElementById('ef-weight').value = edge.weight;
    }

    document.getElementById('edge-form-modal').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}

function saveEdgeForm() {
    const errEl = document.getElementById('edge-form-error');
    errEl.classList.add('hidden');

    const idxRaw   = document.getElementById('edge-edit-index').value;
    const fromId   = document.getElementById('ef-from').value;
    const toId     = document.getElementById('ef-to').value;
    const weight   = parseFloat(document.getElementById('ef-weight').value);

    if (!fromId || !toId || isNaN(weight) || weight <= 0) {
        errEl.textContent = 'Please fill all fields. Weight must be a positive number.';
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    if (fromId === toId) {
        errEl.textContent = 'From and To nodes must be different.';
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const newEdge = { from: fromId, to: toId, weight };
    const fromLabel = (adminNodes.find(n => n.id === fromId) || {}).label || fromId;
    const toLabel   = (adminNodes.find(n => n.id === toId)   || {}).label || toId;

    if (idxRaw === '') {
        // ADD
        adminEdges.push(newEdge);
        pendingChanges.push({ action: 'add', type: 'edge', label: `Add edge: ${fromLabel} ↔ ${toLabel} (${weight}m)` });
    } else {
        // EDIT
        const idx = parseInt(idxRaw);
        const original = { ...adminEdges[idx] };
        adminEdges[idx] = newEdge;
        pendingChanges.push({ action: 'edit', type: 'edge', label: `Edit edge: ${fromLabel} ↔ ${toLabel} (${weight}m)` });
    }

    document.getElementById('edge-form-modal').classList.add('hidden');
    updatePendingUI();
    renderEdgesTable();
}

function deleteEdge(idx) {
    const e = adminEdges[idx];
    const fromLabel = (adminNodes.find(n => n.id === e.from) || {}).label || e.from;
    const toLabel   = (adminNodes.find(n => n.id === e.to)   || {}).label || e.to;
    if (!confirm(`Delete edge between "${fromLabel}" and "${toLabel}"?`)) return;

    adminEdges.splice(idx, 1);
    pendingChanges.push({ action: 'delete', type: 'edge', label: `Delete edge: ${fromLabel} ↔ ${toLabel}` });

    updatePendingUI();
    renderEdgesTable();
}

// ---- Pending Changes UI ----
function updatePendingUI() {
    const count = pendingChanges.length;
    document.getElementById('pending-count').textContent = count;
    document.getElementById('btn-proceed').disabled = (count === 0);
    document.getElementById('btn-discard-changes').disabled = (count === 0);

    const listEl = document.getElementById('pending-list');
    listEl.innerHTML = '';
    pendingChanges.forEach(ch => {
        const chip = document.createElement('span');
        chip.className = `pending-chip ${ch.action}`;
        chip.textContent = ch.label;
        listEl.appendChild(chip);
    });
}

function discardPendingChanges() {
    if (!confirm('Discard all pending changes and reset to the current live map?')) return;
    adminNodes = mapNodes.map(n => ({ ...n }));
    adminEdges = mapEdges.map(e => ({ ...e }));
    pendingChanges = [];
    updatePendingUI();
    renderNodesTable();
    renderEdgesTable();
}

// ---- Confirm & Apply ----
function openConfirmModal() {
    const listEl = document.getElementById('confirm-changes-list');
    listEl.innerHTML = '';

    const iconMap = { add: 'plus-circle', edit: 'pencil', delete: 'trash-2' };
    pendingChanges.forEach(ch => {
        const div = document.createElement('div');
        div.className = `confirm-item ${ch.action}`;
        div.innerHTML = `<i data-lucide="${iconMap[ch.action]}"></i><span>${ch.label}</span>`;
        listEl.appendChild(div);
    });

    document.getElementById('save-status').classList.add('hidden');
    document.getElementById('btn-apply-changes').disabled = false;
    document.getElementById('confirm-modal').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}

async function applyChanges() {
    const statusEl = document.getElementById('save-status');
    const applyBtn = document.getElementById('btn-apply-changes');
    applyBtn.disabled = true;
    statusEl.className = 'save-status';
    statusEl.textContent = 'Saving…';
    statusEl.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/save-map`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes: adminNodes, edges: adminEdges })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Commit to live state
            mapNodes = adminNodes.map(n => ({ ...n }));
            mapEdges = adminEdges.map(e => ({ ...e }));
            processMapData({ nodes: mapNodes, edges: mapEdges });

            pendingChanges = [];
            updatePendingUI();

            statusEl.className = 'save-status success';
            statusEl.textContent = '✓ ' + data.message;

            // Close confirm modal after short delay, keep admin panel open
            setTimeout(() => {
                document.getElementById('confirm-modal').classList.add('hidden');
                renderNodesTable();
                renderEdgesTable();
                updateBanner(`Map updated by admin. ${mapNodes.length} nodes, ${mapEdges.length} edges loaded.`);
            }, 1600);
        } else {
            throw new Error(data.error || 'Unknown server error');
        }
    } catch (err) {
        statusEl.className = 'save-status error';
        statusEl.textContent = '✗ Save failed: ' + err.message + '. Check Flask server is running.';
        applyBtn.disabled = false;
        console.error('Admin save error:', err);
    }
}

// --- Search History Functionality ---
function saveSearchToHistory() {
    if (!startNodeId || !endNodeId) return;
    
    const startNode = nodesDict[startNodeId];
    const endNode = nodesDict[endNodeId];
    if (!startNode || !endNode) return;
    
    // History is now saved automatically by the backend /api/find-path endpoint.
    // This function is kept as a no-op for compatibility.
}

async function loadSearchHistory() {
    const listContainer = document.getElementById("history-list");
    listContainer.innerHTML = '<p class="empty-msg">Loading…</p>';

    let history = [];
    try {
        const res = await fetch(`${API_BASE_URL}/history?limit=20`);
        if (res.ok) {
            const rows = await res.json();
            history = rows.map(r => ({
                route: `${r.from_label} → ${r.to_label}`,
                time:  r.searched_at
                           ? new Date(r.searched_at + 'Z').toLocaleString([], {hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'})
                           : '',
                from:  r.from_id,
                to:    r.to_id,
                distance: r.distance_m,
                walk:     r.walk_min
            }));
        }
    } catch(e) {
        // Fallback to localStorage if backend is offline
        history = JSON.parse(localStorage.getItem("spotNgoHistory") || "[]");
    }

    if (history.length === 0) {
        listContainer.innerHTML = '<p class="empty-msg">No recent searches found.</p>';
        return;
    }

    listContainer.innerHTML = "";
    history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div class="history-route">
                <i data-lucide="route"></i>
                <span>${item.route}</span>
            </div>
            <div class="history-time">${item.time}${item.distance ? ` · ${item.distance}m` : ''}</div>
        `;

        // Make it clickable to instantly search again
        div.addEventListener("click", () => {
            document.getElementById("start-node").value = item.from;
            document.getElementById("end-node").value = item.to;
            startNodeId = item.from;
            endNodeId = item.to;

            // Close modal and compute
            document.getElementById("history-modal").classList.add("hidden");

            // If we are on landing page, switch to map
            if (!document.getElementById("landing-page").classList.contains("hidden")) {
                document.getElementById("landing-page").classList.add("hidden");
                document.getElementById("app-container").classList.remove("hidden");
                setTimeout(() => { resizeCanvas(); fitMapToViewport(); computeRoute(); }, 10);
            } else {
                computeRoute();
            }
        });
        
        listContainer.appendChild(div);
    });
    
    if (window.lucide) window.lucide.createIcons();
}
