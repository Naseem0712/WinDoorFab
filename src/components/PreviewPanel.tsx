import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DesignConfig, DoorDesign, IronProfile, WindowConfig, WindowCellType, WindowProfile, Fitting } from '../types';
import { UNITS } from '../constants';
import { CubeTransparentIcon, PlusIcon, MinusIcon, ArrowPathIcon, ArrowsRightLeftIcon, WindowFixedIcon, WindowCasementIcon, WindowTopHungIcon } from './Icons';

interface PreviewPanelProps {
  productType: 'gate' | 'window';
  gateConfig: DesignConfig;
  windowConfig: WindowConfig;
  setWindowConfig: React.Dispatch<React.SetStateAction<WindowConfig>>;
  gateProfiles: IronProfile[];
  windowProfiles: WindowProfile[];
  selectedCellId: string | null;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
}

const adjustColor = (hex: string, percent: number): string => {
    if (!hex || hex.length < 7) return '#000000';
    try {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);

        const calculate = (val: number) => Math.round(Math.min(255, Math.max(0, val + (val * percent) / 100)));
        r = calculate(r);
        g = calculate(g);
        b = calculate(b);

        const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (error) {
        console.error("Invalid color for adjustColor:", hex);
        return hex;
    }
};

const renderGatePreview = (config: DesignConfig, scale: number, gateProfiles: IronProfile[], isGrill: boolean = false) => {
    const { width, height, unit, frameProfileId } = config;
    const conversionFactor = UNITS.find(u => u.value === unit)?.conversionFactor || 1;
    const widthMm = width * conversionFactor;
    const heightMm = height * conversionFactor;
    
    const frameProfile = gateProfiles.find(p => p.id === frameProfileId)!;
    
    const renderInnerDesign = (innerWidth: number, innerHeight: number, design: DoorDesign) => {
        const innerStyle: React.CSSProperties = {
            backgroundColor: design.color,
            backgroundImage: design.texture ? `url(${design.texture})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };

        switch (design.innerDesign) {
        case 'vertical-bars': {
            if (innerWidth <= 0) return null;
            const elements: { profile: IronProfile; gap: number }[] = [];
            let tempPosition = 0;
            let i = 0;
            while (true) {
                if(design.innerDesignSequence.length === 0) break;
                const step = design.innerDesignSequence[i % design.innerDesignSequence.length];
                const profile = gateProfiles.find(p => p.id === step.profileId);
                if (!profile) { i++; continue; }
                const gapMm = step.gap * conversionFactor;
                if (tempPosition + profile.widthMm <= innerWidth) {
                    elements.push({ profile, gap: gapMm });
                    tempPosition += profile.widthMm + gapMm;
                    i++;
                } else {
                    break;
                }
            }
            const totalPatternWidth = elements.reduce((acc, el) => acc + el.profile.widthMm, 0) +
                                    elements.slice(0, -1).reduce((acc, el) => acc + el.gap, 0);
            const startingOffset = (innerWidth - totalPatternWidth) / 2;
            const bars: React.ReactNode[] = [];
            let currentPosition = startingOffset;
            for (const [index, el] of elements.entries()) {
                bars.push(<div key={`bar-${index}`} className="absolute" style={{ ...innerStyle, left: `${currentPosition}px`, width: `${el.profile.widthMm}px`, top: 0, height: '100%', }}></div>);
                currentPosition += el.profile.widthMm + el.gap;
            }
            return bars;
        }
        case 'horizontal-bars': {
            if (innerHeight <= 0) return null;
            const elements: { profile: IronProfile; gap: number }[] = [];
            let tempPosition = 0;
            let i = 0;
            while (true) {
                if(design.innerDesignSequence.length === 0) break;
                const step = design.innerDesignSequence[i % design.innerDesignSequence.length];
                const profile = gateProfiles.find(p => p.id === step.profileId);
                if (!profile) { i++; continue; }
                const gapMm = step.gap * conversionFactor;
                if (tempPosition + profile.heightMm <= innerHeight) {
                    elements.push({ profile, gap: gapMm });
                    tempPosition += profile.heightMm + gapMm;
                    i++;
                } else {
                    break;
                }
            }
            const totalPatternHeight = elements.reduce((acc, el) => acc + el.profile.heightMm, 0) +
                                    elements.slice(0, -1).reduce((acc, el) => acc + el.gap, 0);
            const startingOffset = (innerHeight - totalPatternHeight) / 2;
            const bars: React.ReactNode[] = [];
            let currentPosition = startingOffset;
            for (const [index, el] of elements.entries()) {
                bars.push(<div key={`bar-${index}`} className="absolute" style={{ ...innerStyle, top: `${currentPosition}px`, height: `${el.profile.heightMm}px`, left: 0, width: '100%', }}></div>);
                currentPosition += el.profile.heightMm + el.gap;
            }
            return bars;
        }
        case 'criss-cross': {
            const bars: React.ReactNode[] = [];
            if(design.innerDesignSequence.length === 0) return null;
            const step = design.innerDesignSequence[0];
            const profile = gateProfiles.find(p => p.id === step.profileId);
            if (!profile || !step) return null;
            const barThickness = profile.widthMm;
            const gapMm = step.gap * conversionFactor;
            const totalSpacing = barThickness + gapMm;
            const diagonalLength = Math.sqrt(innerWidth ** 2 + innerHeight ** 2);
            const numBars = Math.ceil((innerWidth + innerHeight) / totalSpacing);
            for (let i = 0; i < numBars; i++) {
                const offset = (i * totalSpacing) - innerHeight;
                bars.push(<div key={`d1-${i}`} className="absolute origin-bottom-left" style={{ ...innerStyle, width: `${barThickness}px`, height: `${diagonalLength}px`, bottom: 0, left: `${offset}px`, transform: 'rotate(45deg)', }}></div>);
                bars.push(<div key={`d2-${i}`} className="absolute origin-bottom-right" style={{ ...innerStyle, width: `${barThickness}px`, height: `${diagonalLength}px`, bottom: 0, right: `${offset}px`, transform: 'rotate(-45deg)', }}></div>);
            }
            return bars;
        }
        case 'sheet':
            return <div className="absolute" style={{ ...innerStyle, top: 0, left: 0, width: '100%', height: '100%', }}></div>;
        default:
            return null;
        }
    };
    
    const renderDoor = (doorWidth: number, doorHeight: number, design: DoorDesign, key: string) => {
        const frameW = frameProfile?.widthMm || 0;
        const frameH = frameProfile?.heightMm || 0;
        const innerWidth = doorWidth - 2 * frameW;
        const innerHeight = doorHeight - 2 * frameH;
        const frameFill = config.frameTexture ? `url(#frame-texture-${key})` : config.frameColor;

        return (
            <div key={key} className="relative shrink-0" style={{ width: `${doorWidth}px`, height: `${doorHeight}px`, }}>
            <svg className="absolute top-0 left-0 w-full h-full" aria-hidden="true">
                {config.frameTexture && (<defs><pattern id={`frame-texture-${key}`} patternUnits="userSpaceOnUse" width="150" height="150"><image href={config.frameTexture} x="0" y="0" width="150" height="150" /></pattern></defs>)}
                <g fill={frameFill}>
                    <polygon points={`0,0 ${doorWidth},0 ${doorWidth - frameW},${frameH} ${frameW},${frameH}`} />
                    <polygon points={`${frameW},${doorHeight - frameH} ${doorWidth - frameW},${doorHeight - frameH} ${doorWidth},${doorHeight} 0,${doorHeight}`} />
                    <polygon points={`0,0 ${frameW},${frameH} ${frameW},${doorHeight - frameH} 0,${doorHeight}`} />
                    <polygon points={`${doorWidth - frameW},${frameH} ${doorWidth},0 ${doorWidth},${doorHeight} ${doorWidth - frameW},${doorHeight - frameH}`} />
                </g>
            </svg>
            <div className="absolute overflow-hidden" style={{ top: `${frameH}px`, left: `${frameW}px`, width: `${innerWidth > 0 ? innerWidth : 0}px`, height: `${innerHeight > 0 ? innerHeight : 0}px`, }}>
                {renderInnerDesign(innerWidth, innerHeight, design)}
            </div>
            </div>
        );
    };

    const hasValidDimensions = widthMm > 0 && heightMm > 0 && frameProfile?.widthMm > 0;
    if (!hasValidDimensions && !isGrill) return <div className="text-gray-500">Please enter valid dimensions to see a preview.</div>;

    const transformStyle = isGrill ? {} : { transform: `scale(${scale})` };

    return (
        <div id="preview-content" className="relative transition-transform duration-200 flex items-stretch justify-center origin-center" style={{ width: `${widthMm}px`, height: `${heightMm}px`, ...transformStyle }}>
            {config.gateType === 'sliding-openable' ? (
                <>
                    {renderDoor((config.leftDoorWidth || width / 2) * conversionFactor, heightMm, config.leftDoorDesign, 'left-door')}
                    <div className="w-px h-full bg-gray-900"></div>
                    {renderDoor((width - (config.leftDoorWidth || width / 2)) * conversionFactor, heightMm, config.rightDoorDesign || config.leftDoorDesign, 'right-door')}
                </>
            ) : (
                renderDoor(widthMm, heightMm, config.leftDoorDesign, 'single-door')
            )}
        </div>
    );
}

const realisticGlassStyle: React.CSSProperties = {
    background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.0) 60%, rgba(0, 0, 0, 0.05) 100%)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.2)',
};


const WindowPreview: React.FC<{
    config: WindowConfig;
    scale: number;
    zoom: number;
    setConfig: React.Dispatch<React.SetStateAction<WindowConfig>>;
    windowProfiles: WindowProfile[];
    gateProfiles: IronProfile[];
    selectedCellId: string | null;
    setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ config, scale, zoom, setConfig, windowProfiles, gateProfiles, selectedCellId, setSelectedCellId }) => {
    
    const [draggingFitting, setDraggingFitting] = useState<{cellId: string, fittingId: string} | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const cellRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);

    const { width, height, unit, rowSizes, colSizes, grid, color, texture, frameProfiles, shutterProfiles } = config;
    const conversionFactor = UNITS.find(u => u.value === unit)?.conversionFactor || 1;
    const widthMm = width * conversionFactor;
    const heightMm = height * conversionFactor;

    const getProfile = (id: string) => windowProfiles.find(p => p.id === id);

    const outerFrame = getProfile(frameProfiles.outerFrame);
    const vMullion = getProfile(frameProfiles.verticalMullion);
    const hMullion = getProfile(frameProfiles.horizontalMullion);

    const ofw = outerFrame?.widthMm || 0; 
    const ofh = outerFrame?.heightMm || 0;
    const vmw = vMullion?.widthMm || 0;
    const hmh = hMullion?.heightMm || 0;

    const totalColWeight = colSizes.reduce((a, b) => a + b, 0) || 1;
    const totalRowWeight = rowSizes.reduce((a, b) => a + b, 0) || 1;

    const availableWidthForCells = widthMm - ofh * 2 - (colSizes.length - 1) * vmw;
    const availableHeightForCells = heightMm - ofw * 2 - (rowSizes.length - 1) * hmh;

    const colWidths = colSizes.map(size => (availableWidthForCells * size) / totalColWeight);
    const rowHeights = rowSizes.map(size => (availableHeightForCells * size) / totalRowWeight);

    const handleCellTypeChange = (cellId: string, newType: WindowCellType) => {
        const newGrid = config.grid.map(row => row.map(cell => cell.id === cellId ? { ...cell, type: newType } : cell));
        setConfig(prev => ({ ...prev, grid: newGrid }));
    };

    useEffect(() => {
        if (selectedCellId && contentRef.current) {
            const cellEl = cellRefs.current[selectedCellId];
            const contentRect = contentRef.current.getBoundingClientRect();
            if (cellEl) {
                const cellRect = cellEl.getBoundingClientRect();
                const top = (cellRect.top - contentRect.top) / (scale * zoom) + 8;
                const left = (cellRect.left - contentRect.left) / (scale * zoom) + (cellRect.width / (scale * zoom) / 2);
                setToolbarPosition({ top, left });
            }
        } else {
            setToolbarPosition(null);
        }
    }, [selectedCellId, scale, zoom, config.grid, colWidths, rowHeights]);


    const handleFittingMouseDown = (e: React.MouseEvent, cellId: string, fittingId: string) => {
        e.stopPropagation();
        setDraggingFitting({ cellId, fittingId });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingFitting || !contentRef.current) return;
        
        const rect = contentRef.current.getBoundingClientRect();
        const unscaledX = (e.clientX - rect.left) / (scale * zoom);
        const unscaledY = (e.clientY - rect.top) / (scale * zoom);

        const { cellId, fittingId } = draggingFitting;
        const match = cellId.match(/r(\d+)c(\d+)/);
        if (!match) return;
        const cellRow = parseInt(match[1]);
        const cellCol = parseInt(match[2]);

        const cellX_start = ofh + colWidths.slice(0, cellCol).reduce((a, b) => a + b, 0) + cellCol * vmw;
        const cellY_start = ofw + rowHeights.slice(0, cellRow).reduce((a, b) => a + b, 0) + cellRow * hmh;
        
        const inset = 2; // Shutter inset
        const shutterWidth = colWidths[cellCol] - inset * 2;
        const shutterHeight = rowHeights[cellRow] - inset * 2;
        
        let relativeX = (unscaledX - cellX_start - inset) / shutterWidth;
        let relativeY = (unscaledY - cellY_start - inset) / shutterHeight;
        
        relativeX = Math.max(0, Math.min(1, relativeX));
        relativeY = Math.max(0, Math.min(1, relativeY));

        setConfig(prev => ({
            ...prev,
            grid: prev.grid.map(row => row.map(cell => {
                if (cell.id === cellId) {
                    return {
                        ...cell,
                        fittings: cell.fittings.map(f => f.id === fittingId ? { ...f, x: relativeX, y: relativeY } : f)
                    };
                }
                return cell;
            }))
        }));

    }, [draggingFitting, scale, zoom, setConfig, colWidths, rowHeights, ofw, ofh, vmw, hmh]);

    const handleMouseUp = useCallback(() => {
        setDraggingFitting(null);
    }, []);

    useEffect(() => {
        if (draggingFitting) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingFitting, handleMouseMove, handleMouseUp]);

    const frameGradientId = `frame-gradient-${unit.replace(/[^a-zA-Z0-9]/g, '')}`;
    const framePatternId = `window-frame-pattern`;
    const frameFill = texture ? `url(#${framePatternId})` : `url(#${frameGradientId})`;
    
    const Shutter = ({w, h, type, fittings, cellId, color, texture}: {w: number, h:number, type: WindowCellType, fittings: Fitting[], cellId: string, color: string, texture?: string}) => {
        const sHandle = getProfile(shutterProfiles.handleSection);
        const sInterlock = getProfile(shutterProfiles.interlockSection);
        const sTopBottom = getProfile(shutterProfiles.topBottomSection);
        const sCasement = getProfile(shutterProfiles.casementSash);

        if (!sHandle || !sInterlock || !sTopBottom || !sCasement) return null;

        const inset = 2;
        const sw = w - inset*2;
        const sh = h - inset*2;
        
        const isSliding = type === 'sliding';
        
        const leftW = isSliding ? sHandle.widthMm : sCasement.widthMm;
        const rightW = isSliding ? sInterlock.widthMm : sCasement.widthMm;
        const topH = isSliding ? sTopBottom.heightMm : sCasement.heightMm;
        const bottomH = isSliding ? sTopBottom.heightMm : sCasement.heightMm;

        const glassAreaW = sw - leftW - rightW;
        const glassAreaH = sh - topH - bottomH;
        
        const shutterFrameGradientId = `shutter-frame-gradient-${cellId}`;
        const shutterFramePatternId = `shutter-frame-pattern-${cellId}`;
        const shutterFrameFill = texture ? `url(#${shutterFramePatternId})` : `url(#${shutterFrameGradientId})`;

        return (
            <div className="absolute overflow-hidden shutter-component" style={{width: `${sw}px`, height: `${sh}px`, top: `${inset}px`, left: `${inset}px`}}>
                <svg width={sw} height={sh} className="absolute overflow-visible">
                     <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4"/></filter>
                        <linearGradient id={shutterFrameGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={adjustColor(color, 15)} />
                            <stop offset="50%" stopColor={color} />
                            <stop offset="100%" stopColor={adjustColor(color, -15)} />
                        </linearGradient>
                        {texture && (
                            <pattern id={shutterFramePatternId} patternUnits="objectBoundingBox" width="1" height="1">
                                <image href={texture} x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                            </pattern>
                        )}
                    </defs>
                    <g style={{filter: 'url(#shadow)'}} fill={shutterFrameFill}>
                        <polygon points={`0,0 ${sw},0 ${sw - rightW},${topH} ${leftW},${topH}`} />
                        <polygon points={`${leftW},${sh - bottomH} ${sw-rightW},${sh-bottomH} ${sw},${sh} 0,${sh}`} />
                        <polygon points={`0,0 ${leftW},${topH} ${leftW},${sh - bottomH} 0,${sh}`} />
                        <polygon points={`${sw - rightW},${topH} ${sw},0 ${sw},${sh} ${sw - rightW},${sh - bottomH}`} />
                    </g>
                     {fittings.map(fitting => {
                        const fittingX = fitting.x * sw;
                        const fittingY = fitting.y * sh;
                        const isDraggingThis = draggingFitting?.fittingId === fitting.id;
                        const transform = `translate(${fittingX} ${fittingY}) rotate(${fitting.rotation}) scale(${fitting.size * (isDraggingThis ? 1.1 : 1)})`;
                        if (fitting.type === 'handle') {
                             return <g key={fitting.id} transform={transform} onMouseDown={(e) => handleFittingMouseDown(e, cellId, fitting.id)} className={`cursor-move fitting-handle ${isDraggingThis ? 'is-dragging' : ''}`}>
                                <rect x={-8} y={-25} width="16" height="50" rx="3" fill="rgba(80,80,80,0.9)" stroke="rgba(255,255,255,0.2)" />
                             </g>
                        }
                        if (fitting.type === 'hinge') {
                             return <g key={fitting.id} transform={transform} onMouseDown={(e) => handleFittingMouseDown(e, cellId, fitting.id)} className={`cursor-move fitting-handle ${isDraggingThis ? 'is-dragging' : ''}`}>
                                <rect x={-10} y={-20} width="20" height="12" fill="rgba(100,100,100,0.9)" stroke="rgba(255,255,255,0.2)"/>
                                <rect x={-10} y={-8} width="4" height="8" fill="rgba(80,80,80,0.9)" />
                                <rect x={6} y={-8} width="4" height="8" fill="rgba(80,80,80,0.9)" />
                                <rect x={-10} y={8} width="20" height="12" fill="rgba(100,100,100,0.9)" stroke="rgba(255,255,255,0.2)"/>
                             </g>
                        }
                        return null;
                    })}
                </svg>
                <div className="absolute backdrop-blur-sm border border-white/10" style={{
                    left: `${leftW}px`, top: `${topH}px`, width: `${glassAreaW > 0 ? glassAreaW : 0}px`, height: `${glassAreaH > 0 ? glassAreaH : 0}px`,
                    ...realisticGlassStyle,
                }}/>
            </div>
        )
    }

    const cellTypes: { type: WindowCellType; icon: React.ReactNode; label: string }[] = [
        { type: 'fixed', icon: <WindowFixedIcon />, label: 'Fixed' },
        { type: 'sliding', icon: <ArrowsRightLeftIcon />, label: 'Sliding' },
        { type: 'casement', icon: <WindowCasementIcon />, label: 'Casement' },
        { type: 'top-hung', icon: <WindowTopHungIcon />, label: 'Top-Hung' },
        { type: 'glass', icon: <CubeTransparentIcon />, label: 'Glass Only' },
    ];
    const selectedCell = grid.flat().find(c => c.id === selectedCellId);

    return (
      <div ref={contentRef} id="preview-content" className="relative" style={{ width: `${widthMm}px`, height: `${heightMm}px`, transform: `scale(${scale})` }}>
        <svg width={widthMm} height={heightMm} className="absolute">
           <defs>
                <linearGradient id={frameGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={adjustColor(color, 20)} />
                    <stop offset="50%" stopColor={color} />
                    <stop offset="100%" stopColor={adjustColor(color, -20)} />
                </linearGradient>
                {texture && (
                    <pattern id={framePatternId} patternUnits="objectBoundingBox" width="1" height="1">
                        <image href={texture} x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                )}
                <pattern id="mesh-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
                    <path d="M 0 0 L 8 8 M 8 0 L 0 8" strokeWidth="0.5" stroke="rgba(150,150,150,0.7)"/>
                </pattern>
            </defs>
          <g fill={frameFill}>
            <polygon points={`0,0 ${widthMm},0 ${widthMm - ofh},${ofw} ${ofh},${ofw}`} />
            <polygon points={`${ofh},${heightMm - ofw} ${widthMm - ofh},${heightMm - ofw} ${widthMm},${heightMm} 0,${heightMm}`} />
            <polygon points={`0,0 ${ofh},${ofw} ${ofh},${heightMm - ofw} 0,${heightMm}`} />
            <polygon points={`${widthMm - ofh},${ofw} ${widthMm},0 ${widthMm},${heightMm} ${widthMm - ofh},${heightMm - ofw}`} />
            {Array.from({length: colSizes.length - 1}).map((_, i) => {
                const left = ofh + colWidths.slice(0, i + 1).reduce((a, b) => a + b, 0) + i * vmw;
                return <rect key={`v-mullion-${i}`} x={left} y={ofw} width={vmw} height={heightMm - 2 * ofw} />
            })}
            {Array.from({length: rowSizes.length - 1}).map((_, i) => {
                const top = ofw + rowHeights.slice(0, i + 1).reduce((a, b) => a + b, 0) + i * hmh;
                return <rect key={`h-mullion-${i}`} x={ofh} y={top} width={widthMm - 2 * ofh} height={hmh} />
            })}
          </g>
        </svg>

        <div className="absolute grid w-full h-full pointer-events-none" style={{
            gridTemplateColumns: colSizes.map(s => `${s}fr`).join(' '),
            gridTemplateRows: rowSizes.map(s => `${s}fr`).join(' '),
            gap: `${hmh}px ${vmw}px`, padding: `${ofw}px ${ofh}px`,
        }}>
            {grid.flat().map((cell) => {
                 const match = cell.id.match(/r(\d+)c(\d+)/);
                 const r = match ? parseInt(match[1]) : 0;
                 const c = match ? parseInt(match[2]) : 0;
                 const fontSize = Math.max(10, Math.min(colWidths[c] / 8, rowHeights[r] / 4, 32)); // Approximate font size
                 return (
                    <div 
                        key={cell.id} 
                        ref={el => { cellRefs.current[cell.id] = el; }}
                        onClick={(e) => { e.stopPropagation(); setSelectedCellId(cell.id); }} 
                        className={`relative cursor-pointer group pointer-events-auto ${selectedCellId === cell.id ? 'ring-4 ring-blue-500 ring-inset' : ''}`}>
                        {cell.hasMesh && <div className="absolute inset-0" style={{background: 'url(#mesh-pattern)'}}></div>}
                        {cell.type === 'glass' && <div className="w-full h-full flex items-center justify-center text-blue-200/50 font-bold tracking-widest" style={{
                            fontSize: `${fontSize}px`,
                            ...realisticGlassStyle,
                            }}>GLASS</div>}
                        {(cell.type === 'fixed' || cell.type === 'sliding' || cell.type === 'casement' || cell.type === 'top-hung') && <Shutter w={colWidths[c]} h={rowHeights[r]} type={cell.type} fittings={cell.fittings} cellId={cell.id} color={color} texture={texture} />}
                        
                        <div className={`absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${selectedCellId === cell.id ? '!opacity-0' : ''}`}>
                            <span className="text-white font-bold uppercase tracking-wider bg-black/50 px-3 py-1 rounded select-none" style={{fontSize: `${fontSize * 0.8}px`}}>{cell.type}</span>
                        </div>
                    </div>
                 )
            })}
        </div>
        
        {config.grillConfig && (
            <div className="absolute top-0 left-0 pointer-events-none" style={{ filter: 'drop-shadow(3px 3px 4px rgba(0,0,0,0.5))' }}>
                {renderGatePreview(config.grillConfig, 1, gateProfiles, true)}
            </div>
        )}

        {selectedCell && toolbarPosition && (
            <div 
                className="absolute z-10 flex flex-col w-80 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-600 shadow-lg overflow-hidden"
                style={{ 
                    top: `${toolbarPosition.top}px`, 
                    left: `${toolbarPosition.left}px`, 
                    transform: 'translateX(-50%)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-3 text-base text-center text-gray-400 border-b border-gray-700">Panel Type</div>
                 {cellTypes.map(({ type, icon, label }) => (
                    <button
                        key={type}
                        onClick={() => {
                            handleCellTypeChange(selectedCell.id, type);
                            setSelectedCellId(null); // Close on selection
                        }}
                        className={`flex items-center gap-5 w-full text-left px-6 py-4 text-lg transition-colors ${selectedCell.type === type ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        aria-label={`Set panel to ${label}`}
                    >
                         {React.cloneElement(icon as React.ReactElement<{ className?: string; }>, { className: "w-7 h-7" })}
                         <span>{label}</span>
                    </button>
                ))}
            </div>
        )}
      </div>
    );
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({ productType, gateConfig, windowConfig, setWindowConfig, gateProfiles, windowProfiles, selectedCellId, setSelectedCellId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const config = productType === 'gate' ? gateConfig : windowConfig;
  const { width, height, unit } = config;
  const conversionFactor = UNITS.find(u => u.value === unit)?.conversionFactor || 1;
  const widthMm = width * conversionFactor;
  const heightMm = height * conversionFactor;

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || widthMm <= 0 || heightMm <= 0) return;
      const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
      const scaleX = containerWidth / widthMm;
      const scaleY = containerHeight / heightMm;
      setScale(Math.min(scaleX, scaleY) * 0.9);
    };
    calculateScale();
    const debouncedCalculateScale = setTimeout(calculateScale, 300);
    window.addEventListener('resize', calculateScale);
    return () => {
        clearTimeout(debouncedCalculateScale);
        window.removeEventListener('resize', calculateScale);
    }
  }, [widthMm, heightMm, config]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-lg p-6 flex flex-col h-min relative">
       <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-700 pb-2 shrink-0">
         <CubeTransparentIcon className="w-6 h-6 text-blue-300"/>
         <h2 className="text-xl font-bold font-orbitron text-blue-300">Live Preview</h2>
       </div>
       <div 
        ref={containerRef} 
        className="flex-grow flex items-center justify-center w-full min-h-[300px] h-[50vh] max-h-[500px] overflow-hidden"
        onMouseDown={() => setSelectedCellId(null)}
       >
        <div 
          id="preview-wrapper" 
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, cursor: isPanning ? 'grabbing' : 'grab', transition: isPanning ? 'none' : 'transform 0.2s' }} 
          onMouseDown={(e) => {
            handleMouseDown(e);
            e.stopPropagation();
          }}
        >
            {productType === 'gate' 
                ? renderGatePreview(gateConfig, scale, gateProfiles) 
                : <WindowPreview config={windowConfig} scale={scale} zoom={zoom} setConfig={setWindowConfig} windowProfiles={windowProfiles} gateProfiles={gateProfiles} selectedCellId={selectedCellId} setSelectedCellId={setSelectedCellId} />
            }
        </div>
      </div>
      <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 flex items-center gap-1 border border-gray-700 shadow-lg">
          <button onClick={() => setZoom(z => Math.max(0.2, z / 1.2))} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" aria-label="Zoom Out"><MinusIcon className="w-5 h-5" /></button>
          <span className="text-xs w-12 text-center font-mono text-gray-300" onClick={handleResetView} title="Reset View">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(10, z * 1.2))} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" aria-label="Zoom In"><PlusIcon className="w-5 h-5" /></button>
          <div className="w-px h-5 bg-gray-600 mx-1"></div>
          <button onClick={handleResetView} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" aria-label="Reset View"><ArrowPathIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default PreviewPanel;