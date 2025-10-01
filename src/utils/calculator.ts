import { DesignConfig, CalculationResult, DoorDesign, WindowConfig, HardwareItem, IronProfile, WindowProfile } from '../types';
import { UNITS } from '../constants';

function calculateInnerWeight(
  innerWidthM: number,
  innerHeightM: number,
  design: DoorDesign,
  conversionFactor: number,
  gateProfiles: IronProfile[]
): number {
  if (!design) return 0;
  
  let innerWeightKg = 0;

  switch(design.innerDesign) {
    case 'vertical-bars':
    case 'horizontal-bars': {
      const isVertical = design.innerDesign === 'vertical-bars';
      const dimensionM = isVertical ? innerWidthM : innerHeightM;
      const barLengthM = isVertical ? innerHeightM : innerWidthM;
      
      let totalLength = 0;
      let currentPositionM = 0;
      let i = 0;

      if (design.innerDesignSequence.length === 0) return 0;

      while(currentPositionM < dimensionM) {
        const step = design.innerDesignSequence[i % design.innerDesignSequence.length];
        const profile = gateProfiles.find(p => p.id === step.profileId);
        const gapM = (step.gap * conversionFactor) / 1000;
        
        if (!profile) {
            i++;
            continue;
        };

        const profileThicknessM = (isVertical ? profile.widthMm : profile.heightMm) / 1000;

        if (currentPositionM + profileThicknessM <= dimensionM) {
            totalLength += barLengthM;
        }

        currentPositionM += profileThicknessM + gapM;
        i++;
      }
      
      let sequenceWeightPerMeterSum = 0;
      let validProfilesInSequence = 0;
      for(const step of design.innerDesignSequence) {
         const profile = gateProfiles.find(p => p.id === step.profileId);
         if(profile) {
            sequenceWeightPerMeterSum += profile.weightKgPerMeter;
            validProfilesInSequence++;
         }
      }
      const avgWeightPerMeter = validProfilesInSequence > 0 ? sequenceWeightPerMeterSum / validProfilesInSequence : 0;
      innerWeightKg += totalLength * avgWeightPerMeter;

      break;
    }
    case 'criss-cross': {
      if (design.innerDesignSequence.length === 0) return 0;
      const step = design.innerDesignSequence[0];
      const profile = gateProfiles.find(p => p.id === step.profileId);
      if (!profile) break;

      const gapM = (step.gap * conversionFactor) / 1000;
      const profileThicknessM = profile.widthMm / 1000;
      const totalSpacing = profileThicknessM + gapM;

      if (totalSpacing > 0) {
          const numBarsOneWay = Math.ceil((innerWidthM + innerHeightM) / totalSpacing);
          const diagonalLengthM = Math.sqrt(innerWidthM ** 2 + innerHeightM ** 2);
          
          const totalLengthM = numBarsOneWay * diagonalLengthM * 2;
          
          innerWeightKg += totalLengthM * profile.weightKgPerMeter;
      }
      break;
    }
    case 'sheet': {
      // Assuming sheet profile weight is in kg/sq.m.
      const sheetProfile = gateProfiles.find(p => p.id === 'sheet-1.5'); // Example, should be dynamic if more sheets
      if (sheetProfile) {
        const sheetArea = innerWidthM * innerHeightM;
        innerWeightKg += sheetArea * sheetProfile.weightKgPerMeter;
      }
      break;
    }
  }
  return innerWeightKg;
}


export function calculateGateQuote(config: DesignConfig, gateProfiles: IronProfile[]): CalculationResult {
  const { width, height, unit, frameProfileId, gateType } = config;

  const conversionFactor = UNITS.find(u => u.value === unit)?.conversionFactor || 1;
  const widthMm = width * conversionFactor;
  const heightMm = height * conversionFactor;

  const areaSqM = (widthMm / 1000) * (heightMm / 1000);
  const areaSqFt = areaSqM * 10.7639;

  const frameProfile = gateProfiles.find(p => p.id === frameProfileId);
  
  if (!frameProfile) {
    return { widthMm, heightMm, areaSqM, areaSqFt, totalWeightKg: 0 };
  }

  const frameLengthM = (2 * (widthMm / 1000)) + (2 * (heightMm / 1000));
  let totalWeightKg = frameLengthM * frameProfile.weightKgPerMeter;
  
  const innerHeightM = (heightMm - 2 * frameProfile.heightMm) / 1000;
  
  if (gateType === 'sliding-openable') {
    const leftDoorWidthMm = (config.leftDoorWidth || width / 2) * conversionFactor;
    const rightDoorWidthMm = widthMm - leftDoorWidthMm;

    // Add weight for the middle vertical frame member
    totalWeightKg += (heightMm / 1000) * frameProfile.weightKgPerMeter;

    const leftInnerWidthM = (leftDoorWidthMm - frameProfile.widthMm - (frameProfile.widthMm/2)) / 1000;
    const rightInnerWidthM = (rightDoorWidthMm - frameProfile.widthMm - (frameProfile.widthMm/2)) / 1000;

    totalWeightKg += calculateInnerWeight(leftInnerWidthM, innerHeightM, config.leftDoorDesign, conversionFactor, gateProfiles);
    if(config.rightDoorDesign){
      totalWeightKg += calculateInnerWeight(rightInnerWidthM, innerHeightM, config.rightDoorDesign, conversionFactor, gateProfiles);
    }
  } else {
    const innerWidthM = (widthMm - 2 * frameProfile.widthMm) / 1000;
    totalWeightKg += calculateInnerWeight(innerWidthM, innerHeightM, config.leftDoorDesign, conversionFactor, gateProfiles);
  }

  return { widthMm, heightMm, areaSqM, areaSqFt, totalWeightKg };
}

export function calculateWindowQuote(config: WindowConfig, windowProfiles: WindowProfile[]): CalculationResult {
    const { width, height, unit, grid, rowSizes, colSizes, frameProfiles, shutterProfiles } = config;

    const conversionFactor = UNITS.find(u => u.value === unit)?.conversionFactor || 1;
    const widthMm = width * conversionFactor;
    const heightMm = height * conversionFactor;
    const widthM = widthMm / 1000;
    const heightM = heightMm / 1000;

    const areaSqM = widthM * heightM;
    const areaSqFt = areaSqM * 10.7639;

    let totalWeightKg = 0;
    const hardware: Omit<HardwareItem, 'id' | 'rate' | 'isCalculated'>[] = [];

    const getProfile = (id: string) => windowProfiles.find(p => p.id === id);

    const outerFrame = getProfile(frameProfiles.outerFrame);
    const vMullion = getProfile(frameProfiles.verticalMullion);
    const hMullion = getProfile(frameProfiles.horizontalMullion);
    const sHandle = getProfile(shutterProfiles.handleSection);
    const sInterlock = getProfile(shutterProfiles.interlockSection);
    const sTopBottom = getProfile(shutterProfiles.topBottomSection);
    const sCasement = getProfile(shutterProfiles.casementSash);
    
    if (!outerFrame || !vMullion || !hMullion || !sHandle || !sInterlock || !sTopBottom || !sCasement) {
        return { widthMm, heightMm, areaSqM, areaSqFt, totalWeightKg: 0, hardware: [] };
    }
    
    // 1. Outer Frame Weight
    totalWeightKg += (2 * widthM + 2 * heightM) * outerFrame.weightKgPerMeter;

    // 2. Mullions Weight
    const verticalMullionsLength = (colSizes.length > 1) ? (colSizes.length - 1) * (heightM - (2 * outerFrame.widthMm / 1000)) : 0;
    const horizontalMullionsLength = (rowSizes.length > 1) ? (rowSizes.length - 1) * (widthM - (2 * outerFrame.heightMm / 1000)) : 0;
    totalWeightKg += verticalMullionsLength * vMullion.weightKgPerMeter;
    totalWeightKg += horizontalMullionsLength * hMullion.weightKgPerMeter;

    // 3. Shutters/Sashes Weight & Hardware
    const totalColWeight = colSizes.reduce((a, b) => a + b, 0) || 1;
    const totalRowWeight = rowSizes.reduce((a, b) => a + b, 0) || 1;
    
    const innerWidthForCells = widthM - (2 * outerFrame.heightMm / 1000) - ((colSizes.length - 1) * vMullion.widthMm / 1000);
    const innerHeightForCells = heightM - (2 * outerFrame.widthMm / 1000) - ((rowSizes.length - 1) * hMullion.heightMm / 1000);

    const colWidthsM = colSizes.map(size => (innerWidthForCells * size) / totalColWeight);
    const rowHeightsM = rowSizes.map(size => (innerHeightForCells * size) / totalRowWeight);
    
    let slidingShutters = 0;
    let casementShutters = 0;
    let totalMeshAreaSqFt = 0;
    let totalHandles = 0;
    let totalHinges = 0;
    
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        const cellWidthM = colWidthsM[c];
        const cellHeightM = rowHeightsM[r];
        let sashWeight = 0;

        if (cell.hasMesh) {
            totalMeshAreaSqFt += (cellWidthM * 3.28084) * (cellHeightM * 3.28084);
        }
        
        cell.fittings.forEach(fitting => {
            if (fitting.type === 'handle') totalHandles++;
            if (fitting.type === 'hinge') totalHinges++;
        });

        switch(cell.type) {
            case 'sliding':
                sashWeight += (2 * cellWidthM) * sTopBottom.weightKgPerMeter;
                sashWeight += cellHeightM * sHandle.weightKgPerMeter;
                sashWeight += cellHeightM * sInterlock.weightKgPerMeter;
                slidingShutters++;
                break;
            case 'casement':
            case 'top-hung':
                 sashWeight += (2 * cellWidthM + 2 * cellHeightM) * sCasement.weightKgPerMeter;
                 casementShutters++;
                 break;
            case 'fixed':
                 sashWeight += (2 * cellWidthM + 2 * cellHeightM) * sCasement.weightKgPerMeter; // Assume fixed uses sash profile for simplicity
                 break;
        }
        totalWeightKg += sashWeight;
      });
    });

    if (slidingShutters > 0) {
        hardware.push({ name: 'Sliding Rollers', quantity: slidingShutters * 2, unit: 'pcs' });
        hardware.push({ name: 'Sliding Lock', quantity: slidingShutters, unit: 'pcs' });
    }
    if(casementShutters > 0) {
        hardware.push({ name: 'Casement Lock/Handle', quantity: casementShutters, unit: 'pcs' });
        hardware.push({ name: 'Friction Hinges', quantity: casementShutters * 2, unit: 'pcs' });
    }
    if (totalHandles > 0) {
        hardware.push({ name: 'Window Handle', quantity: totalHandles, unit: 'pcs' });
    }
    if (totalHinges > 0) {
        hardware.push({ name: 'Window Hinge', quantity: totalHinges, unit: 'pcs' });
    }
    if (totalMeshAreaSqFt > 0) {
        hardware.push({ name: 'SS Insect Mesh', quantity: parseFloat(totalMeshAreaSqFt.toFixed(2)), unit: 'sq ft' });
    }
    
    hardware.push({ name: 'Gasket/Sealant', quantity: Math.ceil(widthM + heightM) * 2, unit: 'meters' });
    hardware.push({ name: 'Screws & Fasteners', quantity: 1, unit: 'lot' });

    return { widthMm, heightMm, areaSqM, areaSqFt, totalWeightKg, hardware };
}