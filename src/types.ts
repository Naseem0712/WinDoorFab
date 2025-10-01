// FIX: Removed incorrect and circular imports.
// The above types are incorrect, so we redefine them here.
export type Unit = 'mm' | 'cm' | 'in' | 'ft';
export type GateType = 'sliding' | 'openable' | 'fixed' | 'sliding-openable';
export type InnerDesign = 'vertical-bars' | 'horizontal-bars' | 'criss-cross' | 'sheet';
export type RateUnit = 'sqft' | 'sqm' | 'kg';

export interface IronProfile {
  id: string;
  name: string;
  weightKgPerMeter: number;
  widthMm: number;
  heightMm: number;
  wallThicknessMm: number;
}

export interface InnerDesignStep {
  profileId: string;
  gap: number; // Gap is in the currently selected unit
}

export interface DoorDesign {
    innerDesign: InnerDesign;
    innerDesignSequence: InnerDesignStep[];
    color: string;
    texture: string; // base64 image data URL
}

export interface DesignConfig {
  width: number;
  height: number;
  unit: Unit;
  gateType: GateType;
  frameProfileId: string;
  frameColor: string;
  frameTexture: string; // base64 image data URL
  leftDoorWidth?: number; // Width is in the currently selected unit
  leftDoorDesign: DoorDesign;
  rightDoorDesign?: DoorDesign;
}

export type WindowCellType = 'fixed' | 'sliding' | 'casement' | 'top-hung' | 'glass';

export interface Fitting {
    id: string;
    type: 'handle' | 'hinge';
    x: number; // 0-1 relative position
    y: number; // 0-1 relative position
    size: number; // scale factor, 1.0 = 100%
    rotation: number; // degrees
}

export interface GridCell {
    id: string; // e.g., "r0c1"
    type: WindowCellType;
    hasMesh: boolean;
    fittings: Fitting[];
}

export type WindowProfileCategory = 'outer-frame' | 'vertical-mullion' | 'horizontal-mullion' | 'shutter-handle' | 'shutter-interlock' | 'shutter-top-bottom' | 'casement-frame' | 'casement-sash' | 'fixed-sash';

export interface WindowProfile {
  id: string;
  name: string;
  category: WindowProfileCategory;
  widthMm: number;
  heightMm: number;
  weightKgPerMeter: number;
  standardLengthM: number;
}


export interface WindowFrameProfiles {
    outerFrame: string; // profileId
    verticalMullion: string;
    horizontalMullion: string;
}

export interface WindowShutterProfiles {
    handleSection: string; // Sliding
    topBottomSection: string; // Sliding & Casement
    interlockSection: string; // Sliding
    casementSash: string; // Casement
}

export interface WindowConfig {
    width: number;
    height: number;
    unit: Unit;
    rowSizes: number[];
    colSizes: number[];
    grid: GridCell[][];
    glassThicknessMm: number;
    frameProfiles: WindowFrameProfiles;
    shutterProfiles: WindowShutterProfiles;
    color: string;
    texture: string;
    grillConfig?: DesignConfig;
}


export interface CalculationResult {
  widthMm: number;
  heightMm: number;
  areaSqM: number;
  areaSqFt: number;
  totalWeightKg: number;
  hardware?: Omit<HardwareItem, 'id' | 'rate' | 'isCalculated'>[];
}

export interface BankDetails {
    name: string;
    account: string;
    bank: string;
    branch: string;
    ifsc: string;
}

export interface CompanyDetails {
    name: string;
    logo: string; // base64 string
    gst: string;
    address: string;
    website: string;
    email: string;
    contact: string;
    bankDetails: BankDetails;
}

export interface CustomerDetails {
    name: string;
    address: string;
}

export interface QuoteMetaDetails {
    title: string;
    description: string;
    terms: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  isCalculated?: boolean;
}

export interface InstallationCharge {
    rate: number;
    unit: 'kg' | 'sqft' | 'sqm' | 'lumpsum';
}

export interface QuotationItem {
  id: string;
  productType: 'gate' | 'window';
  config: DesignConfig | WindowConfig;
  calculations: CalculationResult;
  grillCalculations?: CalculationResult;
  quantity: number;
  rate: number;
  rateUnit: RateUnit;
  grillRate?: number;
  grillRateUnit?: RateUnit;
  structureCost: number;
  description: string;
  previewImage?: string; // base64 data URL
}

export interface QuoteDetails {
    company: CompanyDetails;
    customer: CustomerDetails;
    meta: QuoteMetaDetails;
    items: QuotationItem[];
    hardware: HardwareItem[];
    installation: InstallationCharge;
}