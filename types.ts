export type Unit = 'mm' | 'cm' | 'in' | 'ft';
export type GateType = 'sliding' | 'openable' | 'fixed' | 'sliding-openable';
export type InnerDesign = 'vertical-bars' | 'horizontal-bars' | 'criss-cross' | 'sheet';
export type RateUnit = 'sqft' | 'sqm' | 'kg';

export interface IronProfile {
  id: string;
  name: string;
  weightKgPerMeter: number; // For kg calculation
  thicknessMm: number; // Represents the primary profile dimension (e.g., width) for rendering, or sheet thickness
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

export type WindowCellType = 'fixed' | 'sliding' | 'openable';

export interface GridCell {
    id: string; // e.g., "r0c1"
    type: WindowCellType;
}

export interface WindowFrameProfiles {
    outerFrame: string; // profileId
    verticalTrack: string;
    topTrack: string;
    bottomTrack: string;
}

export interface WindowShutterProfiles {
    handleSection: string;
    topSection: string;
    bottomSection: string;
    interlockSection: string;
}

export interface WindowConfig {
    width: number;
    height: number;
    unit: Unit;
    rows: number;
    cols: number;
    grid: GridCell[][];
    frameProfiles: WindowFrameProfiles;
    shutterProfiles: WindowShutterProfiles;
    color: string;
    texture: string;
}


export interface CalculationResult {
  widthMm: number;
  heightMm: number;
  areaSqM: number;
  areaSqFt: number;
  totalWeightKg: number;
  hardware?: Omit<HardwareItem, 'id' | 'rate' | 'isCalculated'>[];
}

export interface CompanyDetails {
    name: string;
    logo: string; // base64 string
    gst: string;
    address: string;
    website: string;
    email: string;
    contact: string;
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

export interface QuoteDetails {
    company: CompanyDetails;
    customer: CustomerDetails;
    meta: QuoteMetaDetails;
    hardware: HardwareItem[];
    installation: InstallationCharge;
}