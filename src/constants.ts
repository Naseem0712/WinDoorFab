import { DesignConfig, IronProfile, Unit, GateType, InnerDesign, RateUnit, QuoteDetails, InstallationCharge, WindowConfig, GridCell, WindowProfile, WindowProfileCategory } from './types';

// Raw data for gate profiles
const RAW_PROFILES = [
  { id: 'p0', name: 'Select Profile', width: 0, height: 0, thickness: 0, weightPerMeter: 0 },
  { id: 'p1', name: '12x12x1.6', width: 12, height: 12, thickness: 1.6, weightPerMeter: 0.47 },
  { id: 'p2', name: '12x12x2', width: 12, height: 12, thickness: 2, weightPerMeter: 0.55 },
  { id: 'p3', name: '15x15x1.6', width: 15, height: 15, thickness: 1.6, weightPerMeter: 0.62 },
  { id: 'p4', name: '15x15x2', width: 15, height: 15, thickness: 2, weightPerMeter: 0.74 },
  { id: 'p5', name: '15x15x2.2', width: 15, height: 15, thickness: 2.2, weightPerMeter: 0.79 },
  { id: 'p6', name: '20x20x1.6', width: 20, height: 20, thickness: 1.6, weightPerMeter: 0.87 },
  { id: 'p7', name: '20x20x2', width: 20, height: 20, thickness: 2, weightPerMeter: 1.05 },
  { id: 'p8', name: '20x20x2.2', width: 20, height: 20, thickness: 2.2, weightPerMeter: 1.13 },
  { id: 'p9', name: '20x20x2.6', width: 20, height: 20, thickness: 2.6, weightPerMeter: 1.29 },
  { id: 'p10', name: '25x25x1.6', width: 25, height: 25, thickness: 1.6, weightPerMeter: 1.12 },
  { id: 'p11', name: '25x25x2', width: 25, height: 25, thickness: 2, weightPerMeter: 1.37 },
  { id: 'p12', name: '25x25x2.2', width: 25, height: 25, thickness: 2.2, weightPerMeter: 1.48 },
  { id: 'p13', name: '25x25x2.6', width: 25, height: 25, thickness: 2.6, weightPerMeter: 1.7 },
  { id: 'p14', name: '25x25x2.9', width: 25, height: 25, thickness: 2.9, weightPerMeter: 1.84 },
  { id: 'p15', name: '30x30x1.6', width: 30, height: 30, thickness: 1.6, weightPerMeter: 1.37 },
  { id: 'p16', name: '30x30x2', width: 30, height: 30, thickness: 2, weightPerMeter: 1.68 },
  { id: 'p17', name: '30x30x2.2', width: 30, height: 30, thickness: 2.2, weightPerMeter: 1.82 },
  { id: 'p18', name: '30x30x2.6', width: 30, height: 30, thickness: 2.6, weightPerMeter: 2.1 },
  { id: 'p19', name: '30x30x2.9', width: 30, height: 30, thickness: 2.9, weightPerMeter: 2.3 },
  { id: 'p20', name: '30x30x3', width: 30, height: 30, thickness: 3, weightPerMeter: 2.36 },
  { id: 'p21', name: '40x20x1.6', width: 40, height: 20, thickness: 1.6, weightPerMeter: 1.37 },
  { id: 'p22', name: '40x20x2', width: 40, height: 20, thickness: 2, weightPerMeter: 1.68 },
  { id: 'p23', name: '50x25x1.6', width: 50, height: 25, thickness: 1.6, weightPerMeter: 1.75 },
  { id: 'p24', name: '50x25x2', width: 50, height: 25, thickness: 2, weightPerMeter: 2.15 },
  { id: 'p25', name: '40x40x1.6', width: 40, height: 40, thickness: 1.6, weightPerMeter: 1.88 },
  { id: 'p26', name: '40x40x2', width: 40, height: 40, thickness: 2, weightPerMeter: 2.31 },
  { id: 'p27', name: '40x40x3', width: 40, height: 40, thickness: 3, weightPerMeter: 3.3 },
  { id: 'p28', name: '50x50x1.6', width: 50, height: 50, thickness: 1.6, weightPerMeter: 2.38 },
  { id: 'p29', name: '50x50x2', width: 50, height: 50, thickness: 2, weightPerMeter: 2.94 },
  { id: 'p30', name: '50x50x3', width: 50, height: 50, thickness: 3, weightPerMeter: 4.25 },
  { id: 'p31', name: '60x40x2', width: 60, height: 40, thickness: 2, weightPerMeter: 2.94 },
  { id: 'p32', name: '60x40x3', width: 60, height: 40, thickness: 3, weightPerMeter: 4.25 },
  { id: 'p33', name: '75x50x2', width: 75, height: 50, thickness: 2, weightPerMeter: 3.72 },
  { id: 'p34', name: '75x50x3', width: 75, height: 50, thickness: 3, weightPerMeter: 5.42 },
  { id: 'p35', name: '100x50x3', width: 100, height: 50, thickness: 3, weightPerMeter: 6.6 },
  // MS Sheets
  { id: 'sheet-1.5', name: '1.5mm MS Sheet', width: 1.5, height: 1.5, thickness: 1.5, weightPerMeter: 11.78 }, // weight is kg/sq.m
  { id: 'sheet-2.0', name: '2.0mm MS Sheet', width: 2.0, height: 2.0, thickness: 2.0, weightPerMeter: 15.70 }, // weight is kg/sq.m
  { id: 'sheet-3.0', name: '3.0mm MS Sheet', width: 3.0, height: 3.0, thickness: 3.0, weightPerMeter: 23.55 }, // weight is kg/sq.m
];

// Processed list for use in the application
export const INITIAL_GATE_PROFILES: IronProfile[] = RAW_PROFILES.map(p => ({
  id: p.id,
  name: p.name,
  weightKgPerMeter: p.weightPerMeter,
  widthMm: p.width,
  heightMm: p.height,
  wallThicknessMm: p.thickness,
}));


// --- WINDOW CONSTANTS ---

export const INITIAL_WINDOW_PROFILES: WindowProfile[] = [
    { id: 'wp_of_1', name: '2.5 Track Outer Frame (60x55)', category: 'outer-frame', widthMm: 60, heightMm: 55, weightKgPerMeter: 1.1, standardLengthM: 6 },
    { id: 'wp_vm_1', name: 'Vertical Mullion (40x40)', category: 'vertical-mullion', widthMm: 40, heightMm: 40, weightKgPerMeter: 0.9, standardLengthM: 6 },
    { id: 'wp_hm_1', name: 'Horizontal Mullion (40x40)', category: 'horizontal-mullion', widthMm: 40, heightMm: 40, weightKgPerMeter: 0.9, standardLengthM: 6 },
    { id: 'wp_sh_1', name: 'Shutter Handle (25x60)', category: 'shutter-handle', widthMm: 25, heightMm: 60, weightKgPerMeter: 0.85, standardLengthM: 6 },
    { id: 'wp_si_1', name: 'Shutter Interlock (25x40)', category: 'shutter-interlock', widthMm: 25, heightMm: 40, weightKgPerMeter: 0.75, standardLengthM: 6 },
    { id: 'wp_st_1', name: 'Shutter Top/Bottom (25x40)', category: 'shutter-top-bottom', widthMm: 25, heightMm: 40, weightKgPerMeter: 0.80, standardLengthM: 6 },
    { id: 'wp_cf_1', name: 'Casement Frame (45x50)', category: 'casement-frame', widthMm: 45, heightMm: 50, weightKgPerMeter: 1.0, standardLengthM: 6 },
    { id: 'wp_cs_1', name: 'Casement Sash (45x60)', category: 'casement-sash', widthMm: 45, heightMm: 60, weightKgPerMeter: 1.2, standardLengthM: 6 },
];

export const WINDOW_PROFILE_CATEGORIES: {value: WindowProfileCategory, label: string}[] = [
    {value: 'outer-frame', label: 'Outer Frame'},
    {value: 'vertical-mullion', label: 'Vertical Mullion'},
    {value: 'horizontal-mullion', label: 'Horizontal Mullion'},
    {value: 'shutter-handle', label: 'Sliding Shutter Handle'},
    {value: 'shutter-interlock', label: 'Sliding Shutter Interlock'},
    {value: 'shutter-top-bottom', label: 'Sliding Shutter Top/Bottom'},
    {value: 'casement-frame', label: 'Casement/Fixed Frame'},
    {value: 'casement-sash', label: 'Casement/Top-Hung Sash'},
    {value: 'fixed-sash', label: 'Fixed Glass Sash'},
];

// --- SHARED CONSTANTS ---

export const UNITS: { value: Unit, label: string, conversionFactor: number }[] = [
  { value: 'mm', label: 'Millimeters (mm)', conversionFactor: 1 },
  { value: 'cm', label: 'Centimeters (cm)', conversionFactor: 10 },
  { value: 'in', label: 'Inches (in)', conversionFactor: 25.4 },
  { value: 'ft', label: 'Feet (ft)', conversionFactor: 304.8 },
];

export const GATE_TYPES: { value: GateType, label: string }[] = [
  { value: 'sliding', label: 'Sliding' },
  { value: 'openable', label: 'Openable (Double Door)' },
  { value: 'fixed', label: 'Fixed Frame / Grill' },
  { value: 'sliding-openable', label: 'Sliding + Openable' },
];

export const INNER_DESIGNS: { value: InnerDesign, label: string }[] = [
  { value: 'vertical-bars', label: 'Vertical Bars' },
  { value: 'horizontal-bars', label: 'Horizontal Bars' },
  { value: 'criss-cross', label: 'Criss-Cross' },
  { value: 'sheet', label: 'Plain Sheet' },
];

export const RATE_UNITS: { value: RateUnit, label: string }[] = [
    { value: 'kg', label: 'per kg' },
    { value: 'sqft', label: 'per sq ft' },
    { value: 'sqm', label: 'per sq m' },
];

export const INSTALLATION_UNITS: { value: InstallationCharge['unit'], label: string }[] = [
    { value: 'lumpsum', label: 'Lumpsum' },
    { value: 'kg', label: 'Per Kg' },
    { value: 'sqft', label: 'Per Sq Ft' },
    { value: 'sqm', label: 'Per Sq M' },
];

// --- INITIAL CONFIGS ---

export const INITIAL_CONFIG: DesignConfig = {
  width: 3000,
  height: 1500,
  unit: 'mm',
  gateType: 'sliding',
  frameProfileId: 'p26', // 40x40x2
  frameColor: '#212121',
  frameTexture: '',
  leftDoorWidth: 1000,
  leftDoorDesign: {
    innerDesign: 'vertical-bars',
    innerDesignSequence: [
      { profileId: 'p7', gap: 100 }, // 20x20x2
    ],
    color: '#374151',
    texture: '',
  },
  rightDoorDesign: {
    innerDesign: 'vertical-bars',
    innerDesignSequence: [
      { profileId: 'p7', gap: 100 },
    ],
    color: '#374151',
    texture: '',
  },
};

const initialGrid: GridCell[][] = Array.from({ length: 1 }, (_, r) => 
    Array.from({ length: 3 }, (_, c) => ({ id: `r${r}c${c}`, type: 'fixed', hasMesh: false, fittings: [] }))
);
initialGrid[0][0].type = 'fixed';
initialGrid[0][1].type = 'sliding';
initialGrid[0][2].type = 'sliding';

export const INITIAL_WINDOW_CONFIG: WindowConfig = {
    width: 2400,
    height: 1200,
    unit: 'mm',
    rowSizes: [1],
    colSizes: [1, 1, 1],
    grid: initialGrid,
    glassThicknessMm: 5,
    frameProfiles: {
        outerFrame: 'wp_of_1',
        verticalMullion: 'wp_vm_1',
        horizontalMullion: 'wp_hm_1',
    },
    shutterProfiles: {
        handleSection: 'wp_sh_1',
        topBottomSection: 'wp_st_1',
        interlockSection: 'wp_si_1',
        casementSash: 'wp_cs_1',
    },
    color: '#E5E7EB', // Lighter color for aluminum
    texture: ''
};

export const INITIAL_QUOTE_DETAILS: QuoteDetails = {
    company: {
        name: 'Your Company Name',
        logo: '',
        gst: 'YOUR_GSTIN',
        address: '123 Workshop Lane, Industrial Area, City, State - 123456',
        website: 'www.yourcompany.com',
        email: 'contact@yourcompany.com',
        contact: '+91 98765 43210',
        bankDetails: {
            name: 'Your Company Name',
            account: '123456789012',
            bank: 'Bank Name',
            branch: 'Branch Name, City',
            ifsc: 'BANK0001234'
        }
    },
    customer: {
        name: 'Valued Customer',
        address: 'Project Site Address',
    },
    meta: {
        title: 'Custom Iron Gate Quotation',
        description: 'Supply and installation of custom-designed iron gate as per the specified design and dimensions.',
        terms: '1. 50% advance payment required.\n2. GST @ 18% applicable extra.\n3. Validity: 15 days.'
    },
    items: [],
    hardware: [],
    installation: {
        rate: 0,
        unit: 'lumpsum'
    }
}