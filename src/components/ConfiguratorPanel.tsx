import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { DesignConfig, InnerDesignStep, DoorDesign, QuoteDetails, HardwareItem, InstallationCharge, WindowConfig, IronProfile, WindowProfile, RateUnit, QuotationItem, WindowProfileCategory, BankDetails } from '../types';
import { GATE_TYPES, INNER_DESIGNS, INSTALLATION_UNITS, UNITS, RATE_UNITS, WINDOW_PROFILE_CATEGORIES, INITIAL_CONFIG } from '../constants';
import { getDesignSuggestion, isAiAvailable } from '../services/geminiService';
import { WandSparklesIcon, TrashIcon, DocumentDuplicateIcon, PlusIcon, MinusIcon } from './Icons';
import SearchableSelect from './SearchableSelect';
import { calculateGateQuote, calculateWindowQuote } from '../utils/calculator';

// Helper Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4 border-b border-gray-800 pb-6 last:border-b-0 last:pb-0">
    <h3 className="text-lg font-bold text-blue-300 font-orbitron">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; }
const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.id || props.name} className="block text-gray-400 text-xs mb-1">{label}</label>
    <input {...props} id={props.id || props.name} onFocus={handleFocus} className="w-full h-10 p-2 bg-gray-800/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; }
const Textarea: React.FC<TextareaProps> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-gray-400 text-xs mb-1">{label}</label>
        <textarea {...props} id={props.id || props.name} className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" rows={props.rows || 3} />
    </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label: string; options: { value: string | number; label: string }[]; }
const Select: React.FC<SelectProps> = ({ label, options, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-gray-400 text-xs mb-1">{label}</label>
        <select {...props} id={props.id || props.name} className="w-full h-10 pl-2 pr-8 bg-gray-800/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%path stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
            {options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
        </select>
    </div>
);

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
);

interface ColorInputProps { label: string; color: string; onColorChange: (color: string) => void; texture: string; onTextureChange: (texture: string) => void; }
const ColorInput: React.FC<ColorInputProps> = ({ label, color, onColorChange, texture, onTextureChange }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { onTextureChange(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };
    return (
        <div>
            <label className="block text-gray-400 text-xs mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative h-10 w-12 rounded-md border border-gray-600 overflow-hidden shrink-0">
                    <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="absolute top-0 left-0 w-full h-full cursor-pointer opacity-0" />
                    <div className="w-full h-full" style={{ backgroundColor: color, backgroundImage: texture ? `url(${texture})` : 'none', backgroundSize: 'cover' }}></div>
                </div>
                <input type="text" value={color} onChange={(e) => onColorChange(e.target.value)} className="flex-grow h-10 p-2 bg-gray-800/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="#RRGGBB" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-3 flex items-center bg-gray-700 rounded-md hover:bg-gray-600 transition-colors text-xs text-white shrink-0">Texture</button>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleTextureUpload} className="hidden" />
                 {texture && (<div className="relative group shrink-0">
                        <img src={texture} alt="Texture preview" className="h-10 w-10 rounded-md object-cover border border-gray-600"/>
                        <button type="button" onClick={() => onTextureChange('')} className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-red-600 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label="Remove texture"><XMarkIcon className="w-3 h-3"/></button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ConfiguratorPanelProps {
  productType: 'gate' | 'window';
  setProductType: (type: 'gate' | 'window') => void;
  gateConfig: DesignConfig;
  setGateConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
  windowConfig: WindowConfig;
  setWindowConfig: React.Dispatch<React.SetStateAction<WindowConfig>>;
  quoteDetails: QuoteDetails;
  setQuoteDetails: React.Dispatch<React.SetStateAction<QuoteDetails>>;
  gateProfiles: IronProfile[];
  setGateProfiles: React.Dispatch<React.SetStateAction<IronProfile[]>>;
  windowProfiles: WindowProfile[];
  setWindowProfiles: React.Dispatch<React.SetStateAction<WindowProfile[]>>;
  selectedCellId: string | null;
  setSelectedCellId: React.Dispatch<React.SetStateAction<string | null>>;
}

const TabButton: React.FC<{title: string, isActive: boolean, onClick: () => void}> = ({ title, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-colors focus:outline-none ${isActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:bg-gray-800/50'}`}>
        {title}
    </button>
);

const ProductButton: React.FC<{title: string, isActive: boolean, onClick: () => void}> = ({ title, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 py-2 px-2 text-center text-sm rounded-md transition-colors focus:outline-none ${isActive ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`}>
        {title}
    </button>
);


// Gate Specific Components
interface InnerDesignConfiguratorProps {
    title: string;
    design: DoorDesign;
    onDesignChange: (newDesign: DoorDesign) => void;
    gateProfiles: IronProfile[];
    onCopy?: () => void;
    copyLabel?: string;
}
const InnerDesignConfigurator: React.FC<InnerDesignConfiguratorProps> = ({ title, design, onDesignChange, gateProfiles, onCopy, copyLabel }) => {
    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => { onDesignChange({ ...design, innerDesign: e.target.value as DoorDesign['innerDesign'] }); };
    const handleSequenceChange = (index: number, field: keyof InnerDesignStep, value: string | number) => {
        const newSequence = [...(design.innerDesignSequence || [])];
        const step = { ...newSequence[index] };
        if (field === 'profileId') step.profileId = value as string; else step.gap = Number(value) || 0;
        newSequence[index] = step;
        onDesignChange({ ...design, innerDesignSequence: newSequence });
    };
    const addSequenceStep = () => {
        const seq = design.innerDesignSequence || [];
        const lastStep = seq[seq.length - 1] || { profileId: 'p1', gap: 100 };
        onDesignChange({...design, innerDesignSequence: [...seq, lastStep]});
    };
    const removeSequenceStep = (index: number) => {
        const seq = design.innerDesignSequence || [];
        if (seq.length <= 1) return;
        onDesignChange({...design, innerDesignSequence: seq.filter((_, i) => i !== index)});
    };
    return (
      <Section title={title}>
        {onCopy && copyLabel && (<button onClick={onCopy} className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"><DocumentDuplicateIcon className="w-4 h-4" />{copyLabel}</button>)}
        <Select label="Style" name="innerDesign" value={design.innerDesign} onChange={handleStyleChange} options={INNER_DESIGNS} />
        <ColorInput label="Inner Fill Color & Texture" color={design.color} onColorChange={c => onDesignChange({ ...design, color: c })} texture={design.texture} onTextureChange={t => onDesignChange({ ...design, texture: t })} />
        {(design.innerDesign === 'vertical-bars' || design.innerDesign === 'horizontal-bars') && (
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <h4 className="text-md font-semibold text-gray-300">Design Sequence</h4>
            {(design.innerDesignSequence || []).map((step, index) => (
              <div key={index} className="flex items-end gap-2 p-2 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="flex-grow"><SearchableSelect label={`Profile #${index + 1}`} value={step.profileId} onChange={(newValue) => handleSequenceChange(index, 'profileId', newValue)} options={gateProfiles.map(p => ({ value: p.id, label: p.name }))} /></div>
                <div className="w-24"><Input label="Gap" type="number" value={step.gap || ''} onChange={(e) => handleSequenceChange(index, 'gap', e.target.value)} placeholder="e.g., 100"/></div>
                <button onClick={() => removeSequenceStep(index)} disabled={(design.innerDesignSequence || []).length <= 1} className="p-2 h-10 bg-red-600/80 rounded-md hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>
              </div>
            ))}
            <button onClick={addSequenceStep} className="w-full px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">+ Add Step to Sequence</button>
          </div>
        )}
         {(design.innerDesign === 'criss-cross') && ((design.innerDesignSequence || []).length > 0) && (
            <div className="pt-4 border-t border-gray-700">
                 <div className="flex items-end gap-2 p-2 bg-gray-800/50 rounded-md border border-gray-700">
                    <div className="flex-grow"><SearchableSelect label={`Profile`} value={design.innerDesignSequence[0].profileId} onChange={(newValue) => handleSequenceChange(0, 'profileId', newValue)} options={gateProfiles.map(p => ({ value: p.id, label: p.name }))} /></div>
                    <div className="w-24"><Input label="Gap" type="number" value={design.innerDesignSequence[0].gap || ''} onChange={(e) => handleSequenceChange(0, 'gap', e.target.value)} placeholder="e.g., 100"/></div>
                </div>
            </div>
         )}
      </Section>
    )
}

const GateConfigurator: React.FC<{config: DesignConfig, setConfig: React.Dispatch<React.SetStateAction<DesignConfig>>, gateProfiles: IronProfile[]}> = ({ config, setConfig, gateProfiles }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const showAi = isAiAvailable();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: name.includes('width') || name.includes('height') || name.includes('gap') ? parseFloat(value) || 0 : value }));
    };

    const handleAiSuggest = async () => {
        if (!aiPrompt) return;
        setIsLoadingAi(true);
        try {
            const suggestion = await getDesignSuggestion(aiPrompt, config, gateProfiles);
            if (suggestion) { setConfig(prev => ({...prev, ...suggestion})); }
        } catch (error) {
            console.error("AI suggestion failed:", error);
            alert("Failed to get AI suggestion. Please check your API key and try again.");
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    const rightDoorWidth = config.gateType === 'sliding-openable' ? config.width - (config.leftDoorWidth || 0) : 0;

    return <>
        {showAi && <Section title="AI Design Assistant">
            <Textarea label="Describe your design" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., a modern gate with thin vertical bars and a 50mm frame" rows={2}/>
            <button onClick={handleAiSuggest} disabled={isLoadingAi} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isLoadingAi ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating...</> : <><WandSparklesIcon className="w-4 h-4" />Generate with AI</>}
            </button>
        </Section>}
        
        <Section title="Overall Dimensions">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Total Width" name="width" value={config.width || ''} onChange={handleChange} type="number" placeholder="e.g., 3000"/>
                <Input label="Total Height" name="height" value={config.height || ''} onChange={handleChange} type="number" placeholder="e.g., 1500"/>
            </div>
            <Select label="Unit" name="unit" value={config.unit} onChange={handleChange} options={UNITS} />
            {config.gateType === 'sliding-openable' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <Input label="Left Door Width" name="leftDoorWidth" value={config.leftDoorWidth || ''} onChange={handleChange} type="number" max={config.width} placeholder="e.g., 1500"/>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Right Door Width</label>
                        <div className="w-full h-10 flex items-center p-2 bg-gray-800/50 border border-gray-700 rounded-md text-gray-300">
                            {rightDoorWidth > 0 ? `${rightDoorWidth.toFixed(0)} ${config.unit}` : '-'}
                        </div>
                    </div>
                </div>
            )}
        </Section>

        <Section title="Gate Structure">
            <Select label="Type" name="gateType" value={config.gateType} onChange={handleChange} options={GATE_TYPES} />
            <SearchableSelect label="Frame Profile" value={config.frameProfileId} onChange={(newValue) => setConfig(prev => ({ ...prev, frameProfileId: newValue }))} options={gateProfiles.map(p => ({ value: p.id, label: p.name }))} />
            <ColorInput label="Frame Color & Texture" color={config.frameColor} onColorChange={c => setConfig(prev => ({ ...prev, frameColor: c }))} texture={config.frameTexture} onTextureChange={t => setConfig(prev => ({ ...prev, frameTexture: t }))} />
        </Section>

        {config.gateType === 'sliding-openable' ? (
            <>
                <InnerDesignConfigurator title="Left Door Inner Design" design={config.leftDoorDesign} gateProfiles={gateProfiles} onDesignChange={(newDesign) => setConfig(prev => ({...prev, leftDoorDesign: newDesign}))} onCopy={() => setConfig(prev => ({...prev, rightDoorDesign: { ...prev.leftDoorDesign } }))} copyLabel="Copy Design to Right Door" />
                <InnerDesignConfigurator title="Right Door Inner Design" design={config.rightDoorDesign || config.leftDoorDesign} gateProfiles={gateProfiles} onDesignChange={(newDesign) => setConfig(prev => ({...prev, rightDoorDesign: newDesign}))} onCopy={() => setConfig(prev => ({...prev, leftDoorDesign: { ...prev.rightDoorDesign! } }))} copyLabel="Copy Design to Left Door" />
            </>
        ) : (
            <InnerDesignConfigurator title="Inner Design" design={config.leftDoorDesign} gateProfiles={gateProfiles} onDesignChange={(newDesign) => setConfig(prev => ({...prev, leftDoorDesign: newDesign, rightDoorDesign: newDesign}))} />
        )}
    </>
}

// Window Specific Components
const WindowConfigurator: React.FC<{config: WindowConfig, setConfig: React.Dispatch<React.SetStateAction<WindowConfig>>, windowProfiles: WindowProfile[], gateProfiles: IronProfile[], selectedCellId: string | null}> = ({ config, setConfig, windowProfiles, gateProfiles, selectedCellId }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: name === 'width' || name === 'height' ? parseFloat(value) || 0 : value }));
    };

    const handleGridChange = (type: 'rows' | 'cols', delta: number) => {
        setConfig(prev => {
            const newConfig = {...prev};
            const sizes = type === 'rows' ? [...newConfig.rowSizes] : [...newConfig.colSizes];
            const newCount = Math.max(1, sizes.length + delta);

            if (newCount > sizes.length) sizes.push(1); // Add a new section with relative size 1
            else if (newCount < sizes.length) sizes.pop(); // Remove the last section
            
            if (type === 'rows') newConfig.rowSizes = sizes; else newConfig.colSizes = sizes;
            
            // Rebuild grid
            newConfig.grid = Array.from({ length: newConfig.rowSizes.length }, (_, r) => 
                Array.from({ length: newConfig.colSizes.length }, (_, c) => {
                    const existingCell = prev.grid[r]?.[c];
                    return existingCell || { id: `r${r}c${c}`, type: 'fixed', hasMesh: false, fittings: [] };
                })
            );
            return newConfig;
        });
    }

    const handleProfileChange = (section: 'frameProfiles' | 'shutterProfiles', key: string, value: string) => {
        setConfig(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    }

    const handleSelectedCellChange = (field: 'hasMesh', value: boolean) => {
        if (!selectedCellId) return;
        setConfig(prev => ({
            ...prev,
            grid: prev.grid.map(row => row.map(cell => {
                if (cell.id === selectedCellId) return { ...cell, [field]: value };
                return cell;
            }))
        }));
    };

    const selectedCell = useMemo(() => {
        if (!selectedCellId) return null;
        return config.grid.flat().find(c => c.id === selectedCellId);
    }, [selectedCellId, config.grid]);

    const getProfilesByCategory = (cat: WindowProfileCategory) => windowProfiles.filter(p => p.category === cat).map(p => ({ value: p.id, label: p.name }));

    return <>
        <Section title="Overall Dimensions">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Total Width" name="width" value={config.width || ''} onChange={handleChange} type="number" placeholder="e.g., 2400"/>
                <Input label="Total Height" name="height" value={config.height || ''} onChange={handleChange} type="number" placeholder="e.g., 1200"/>
            </div>
            <Select label="Unit" name="unit" value={config.unit} onChange={handleChange} options={UNITS} />
        </Section>
        <Section title="Grid Layout">
            <div className="grid grid-cols-2 gap-4 items-center">
                <label className="text-gray-400 text-xs">Horizontal Panels</label>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleGridChange('rows', -1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><MinusIcon className="w-4 h-4"/></button>
                    <span className="flex-grow text-center text-lg font-bold">{config.rowSizes.length}</span>
                    <button onClick={() => handleGridChange('rows', 1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><PlusIcon className="w-4 h-4"/></button>
                </div>
                 <label className="text-gray-400 text-xs">Vertical Panels</label>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleGridChange('cols', -1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><MinusIcon className="w-4 h-4"/></button>
                    <span className="flex-grow text-center text-lg font-bold">{config.colSizes.length}</span>
                    <button onClick={() => handleGridChange('cols', 1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><PlusIcon className="w-4 h-4"/></button>
                </div>
            </div>
        </Section>

        {selectedCell && <Section title={`Selected Panel (${selectedCellId})`}>
             <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md">
                <label htmlFor="hasMesh" className="text-gray-300">Enable Insect Mesh</label>
                <input type="checkbox" id="hasMesh" checked={selectedCell.hasMesh} onChange={e => handleSelectedCellChange('hasMesh', e.target.checked)} className="w-5 h-5 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-600"/>
            </div>
        </Section>}

        <Section title="Window Profiles">
             <SearchableSelect label="Outer Frame" value={config.frameProfiles.outerFrame} onChange={v => handleProfileChange('frameProfiles', 'outerFrame', v)} options={getProfilesByCategory('outer-frame')} />
             <SearchableSelect label="Vertical Mullion" value={config.frameProfiles.verticalMullion} onChange={v => handleProfileChange('frameProfiles', 'verticalMullion', v)} options={getProfilesByCategory('vertical-mullion')} />
             <SearchableSelect label="Horizontal Mullion" value={config.frameProfiles.horizontalMullion} onChange={v => handleProfileChange('frameProfiles', 'horizontalMullion', v)} options={getProfilesByCategory('horizontal-mullion')} />
             <h4 className="text-md font-semibold text-gray-300 pt-2 border-t border-gray-700">Shutter / Sash Profiles</h4>
             <SearchableSelect label="Sliding - Handle Section" value={config.shutterProfiles.handleSection} onChange={v => handleProfileChange('shutterProfiles', 'handleSection', v)} options={getProfilesByCategory('shutter-handle')} />
             <SearchableSelect label="Sliding - Interlock Section" value={config.shutterProfiles.interlockSection} onChange={v => handleProfileChange('shutterProfiles', 'interlockSection', v)} options={getProfilesByCategory('shutter-interlock')} />
             <SearchableSelect label="Sliding - Top/Bottom" value={config.shutterProfiles.topBottomSection} onChange={v => handleProfileChange('shutterProfiles', 'topBottomSection', v)} options={getProfilesByCategory('shutter-top-bottom')} />
             <SearchableSelect label="Casement/Fixed Sash" value={config.shutterProfiles.casementSash} onChange={v => handleProfileChange('shutterProfiles', 'casementSash', v)} options={getProfilesByCategory('casement-sash')} />
        </Section>
        <Section title="Appearance">
            <ColorInput label="Frame Color & Texture" color={config.color} onColorChange={c => setConfig(prev => ({ ...prev, color: c }))} texture={config.texture} onTextureChange={t => setConfig(prev => ({ ...prev, texture: t }))} />
        </Section>
        <Section title="Security Grill">
            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md">
                <label htmlFor="hasGrill" className="text-gray-300">Add Iron Security Grill</label>
                <input 
                    type="checkbox" 
                    id="hasGrill" 
                    checked={!!config.grillConfig} 
                    onChange={e => {
                        if (e.target.checked) {
                            setConfig(prev => ({...prev, grillConfig: { ...INITIAL_CONFIG, width: prev.width, height: prev.height, unit: prev.unit }}));
                        } else {
                            setConfig(prev => {
                                const newConfig = {...prev};
                                delete newConfig.grillConfig;
                                return newConfig;
                            });
                        }
                    }}
                    className="w-5 h-5 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-600"
                />
            </div>
            {config.grillConfig && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                     <InnerDesignConfigurator 
                        title="Grill Design"
                        design={config.grillConfig.leftDoorDesign} 
                        gateProfiles={gateProfiles} 
                        onDesignChange={(newDesign) => setConfig(prev => ({...prev, grillConfig: {...prev.grillConfig!, leftDoorDesign: newDesign, rightDoorDesign: newDesign}}))} 
                     />
                </div>
            )}
        </Section>
    </>
}

// Add to Quote Section
const AddItemSection: React.FC<{
    productType: 'gate' | 'window';
    gateConfig: DesignConfig;
    windowConfig: WindowConfig;
    gateProfiles: IronProfile[];
    windowProfiles: WindowProfile[];
    setQuoteDetails: React.Dispatch<React.SetStateAction<QuoteDetails>>;
}> = ({ productType, gateConfig, windowConfig, gateProfiles, windowProfiles, setQuoteDetails }) => {
    
    const [rate, setRate] = useState(productType === 'gate' ? 120 : 450);
    const [rateUnit, setRateUnit] = useState<RateUnit>(productType === 'gate' ? 'kg' : 'sqft');
    const [grillRate, setGrillRate] = useState(150);
    const [grillRateUnit, setGrillRateUnit] = useState<RateUnit>('kg');
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState('');

    const config = productType === 'gate' ? gateConfig : windowConfig;
    const isWindowWithGrill = productType === 'window' && windowConfig.grillConfig;

    const calculations = useMemo(() => (
        productType === 'gate' 
        ? calculateGateQuote(gateConfig, gateProfiles)
        : calculateWindowQuote(windowConfig, windowProfiles)
    ), [productType, gateConfig, windowConfig, gateProfiles, windowProfiles]);

    const grillCalculations = useMemo(() => {
        if (isWindowWithGrill) {
            return calculateGateQuote(windowConfig.grillConfig!, gateProfiles);
        }
        return null;
    }, [isWindowWithGrill, windowConfig.grillConfig, gateProfiles]);

    const handleAddItem = async () => {
        const previewElement = document.getElementById('preview-content');
        let previewImage = '';
        if(previewElement) {
             // Temporarily reset styles for capture
            const originalTransform = previewElement.style.transform;
            previewElement.style.transform = 'scale(1)';
            try {
                const canvas = await html2canvas(previewElement, { scale: 1, useCORS: true, backgroundColor: null });
                previewImage = canvas.toDataURL('image/png', 0.8);
            } catch(e) { console.error("Could not capture preview:", e); }
             // Restore original styles
            previewElement.style.transform = originalTransform;
        }


        let windowCost = 0;
        if (rate > 0) {
            switch(rateUnit) {
                case 'sqft': windowCost = calculations.areaSqFt * rate; break;
                case 'sqm': windowCost = calculations.areaSqM * rate; break;
                case 'kg': windowCost = calculations.totalWeightKg * rate; break;
            }
        }

        let grillCost = 0;
        if (isWindowWithGrill && grillCalculations && grillRate > 0) {
            switch(grillRateUnit) {
                case 'sqft': grillCost = grillCalculations.areaSqFt * grillRate; break;
                case 'sqm': grillCost = grillCalculations.areaSqM * grillRate; break;
                case 'kg': grillCost = grillCalculations.totalWeightKg * grillRate; break;
            }
        }

        const structureCost = (windowCost + grillCost) * quantity;
        
        const defaultDesc = productType === 'gate' ? 'Custom Iron Gate' : `Aluminium Window${isWindowWithGrill ? ' with Security Grill' : ''}`;

        const newItem: QuotationItem = {
            id: `${productType}_${Date.now()}`,
            productType,
            config: JSON.parse(JSON.stringify(config)), // Deep copy
            calculations,
            quantity,
            rate,
            rateUnit,
            structureCost,
            description: description || defaultDesc,
            previewImage,
            ...(isWindowWithGrill && {
                grillCalculations,
                grillRate,
                grillRateUnit
            })
        }

        setQuoteDetails(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    }

    return (
        <Section title="Add Item to Quotation">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <span className="text-gray-400">{isWindowWithGrill ? 'Window Weight:' : 'Est. Weight:'}</span><span className="font-bold text-right">{calculations.totalWeightKg.toFixed(2)} kg</span>
                <span className="text-gray-400">{isWindowWithGrill ? 'Window Area:' : 'Est. Area:'}</span><span className="font-bold text-right">{calculations.areaSqFt.toFixed(2)} sq ft</span>
                {isWindowWithGrill && grillCalculations && <>
                    <span className="text-gray-400">Grill Weight:</span><span className="font-bold text-right">{grillCalculations.totalWeightKg.toFixed(2)} kg</span>
                    <span className="text-gray-400">Grill Area:</span><span className="font-bold text-right">{grillCalculations.areaSqFt.toFixed(2)} sq ft</span>
                </>}
            </div>
            <Textarea label="Item Description" value={description} onChange={e => setDescription(e.target.value)} placeholder={`e.g., Custom ${productType}...`} rows={2}/>
            <div className="space-y-4">
                <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">{isWindowWithGrill ? 'Aluminium Window Rate' : 'Rate'}</label>
                     <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-3 flex items-stretch">
                            <input type="number" value={rate || ''} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} placeholder="Rate" onFocus={handleFocus} className="flex-grow w-full p-2 h-10 bg-gray-800/50 border border-gray-700 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                            <select value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)} className="p-2 h-10 bg-gray-700 border border-gray-700 border-l-0 text-white rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                {RATE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <Input label="Quantity" type="number" value={quantity || ''} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" placeholder='Quantity'/>
                        </div>
                    </div>
                </div>
                {isWindowWithGrill && (
                     <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">Iron Grill Rate</label>
                         <div className="grid grid-cols-5 gap-4">
                            <div className="col-span-3 flex items-stretch">
                                <input type="number" value={grillRate || ''} onFocus={handleFocus} onChange={(e) => setGrillRate(parseFloat(e.target.value) || 0)} placeholder="Grill Rate" className="flex-grow w-full p-2 h-10 bg-gray-800/50 border border-gray-700 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                                <select value={grillRateUnit} onChange={(e) => setGrillRateUnit(e.target.value as RateUnit)} className="p-2 h-10 bg-gray-700 border border-gray-700 border-l-0 text-white rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    {RATE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <button onClick={handleAddItem} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-all duration-200">
                <PlusIcon className="w-5 h-5"/> Add to Quote
            </button>
        </Section>
    );
}


// Main Panel
const ConfiguratorPanel: React.FC<ConfiguratorPanelProps> = (props) => {
  const { productType, setProductType, gateConfig, setGateConfig, windowConfig, setWindowConfig, quoteDetails, setQuoteDetails, gateProfiles, windowProfiles, selectedCellId } = props;
  const [activeTab, setActiveTab] = useState<'design' | 'details'>('design');

  const handleDetailsChange = (section: 'company' | 'customer' | 'meta', key: string, value: string) => { 
      let finalValue = value;
      if (key === 'gst') {
          finalValue = value.toUpperCase();
      }
      setQuoteDetails(prev => ({...prev, [section]: {...prev[section], [key]: finalValue }})); 
  };
  const handleBankDetailsChange = (key: keyof BankDetails, value: string) => {
      setQuoteDetails(prev => ({...prev, company: {...prev.company, bankDetails: {...prev.company.bankDetails, [key]: value}}}));
  }
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { handleDetailsChange('company', 'logo', reader.result as string); };
      reader.readAsDataURL(file);
    }
  };
  const handleHardwareChange = (index: number, field: keyof Omit<HardwareItem, 'id'>, value: string | number) => {
    setQuoteDetails(prev => {
        const newHardware = [...prev.hardware];
        const item = { ...newHardware[index] };
        if (field === 'quantity' || field === 'rate') item[field] = Number(value) || 0;
        else if (field === 'name' || field === 'unit') item[field] = value as string;
        newHardware[index] = item;
        return { ...prev, hardware: newHardware };
    });
  };
  const handleAddHardware = () => { setQuoteDetails(prev => ({ ...prev, hardware: [...prev.hardware, { id: `hw_${Date.now()}`, name: '', quantity: 1, unit: 'pcs', rate: 0 }], })); };
  const handleRemoveHardware = (index: number) => { setQuoteDetails(prev => ({ ...prev, hardware: prev.hardware.filter((_, i) => i !== index), })); };
  const handleInstallationChange = (field: keyof InstallationCharge, value: string | number) => {
      setQuoteDetails(prev => {
          const installation = { ...prev.installation };
          if (field === 'rate') installation.rate = Number(value) || 0;
          else if (field === 'unit') installation.unit = value as InstallationCharge['unit'];
          return { ...prev, installation };
      });
  };

  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 flex flex-col text-sm">
      <div className="flex shrink-0 border-b border-gray-700">
        <TabButton title="Design" isActive={activeTab === 'design'} onClick={() => setActiveTab('design')} />
        <TabButton title="Quotation Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
      </div>

      <div className="flex-grow p-6 space-y-6 overflow-y-auto hide-scrollbar scroll-smooth pb-24">
        {activeTab === 'design' && (
          <>
            <Section title="Product Type">
                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                    <ProductButton title="Gate / Grill" isActive={productType === 'gate'} onClick={() => setProductType('gate')} />
                    <ProductButton title="Window" isActive={productType === 'window'} onClick={() => setProductType('window')} />
                </div>
            </Section>
            {productType === 'gate' && <GateConfigurator config={gateConfig} setConfig={setGateConfig} gateProfiles={gateProfiles} />}
            {productType === 'window' && <WindowConfigurator config={windowConfig} setConfig={setWindowConfig} windowProfiles={windowProfiles} gateProfiles={gateProfiles} selectedCellId={selectedCellId} />}
            <AddItemSection productType={productType} gateConfig={gateConfig} windowConfig={windowConfig} gateProfiles={gateProfiles} windowProfiles={windowProfiles} setQuoteDetails={setQuoteDetails} />
          </>
        )}

        {activeTab === 'details' && (
          <>
            <Section title="Company Details">
                <Input label="Company Name" value={quoteDetails.company.name} onChange={e => handleDetailsChange('company', 'name', e.target.value)} />
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Company Logo</label>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500" />
                </div>
                <Input label="GSTIN" value={quoteDetails.company.gst} onChange={e => handleDetailsChange('company', 'gst', e.target.value)} />
                <Textarea label="Address" value={quoteDetails.company.address} onChange={e => handleDetailsChange('company', 'address', e.target.value)} />
                <Input label="Website" value={quoteDetails.company.website} onChange={e => handleDetailsChange('company', 'website', e.target.value)} />
                <Input label="Email" value={quoteDetails.company.email} onChange={e => handleDetailsChange('company', 'email', e.target.value)} />
                <Input label="Contact No." value={quoteDetails.company.contact} onChange={e => handleDetailsChange('company', 'contact', e.target.value)} />
            </Section>
            <Section title="Bank Details">
                <Input label="Account Holder Name" value={quoteDetails.company.bankDetails.name} onChange={e => handleBankDetailsChange('name', e.target.value)} />
                <Input label="Account Number" value={quoteDetails.company.bankDetails.account} onChange={e => handleBankDetailsChange('account', e.target.value)} />
                <Input label="Bank Name" value={quoteDetails.company.bankDetails.bank} onChange={e => handleBankDetailsChange('bank', e.target.value)} />
                <Input label="Branch" value={quoteDetails.company.bankDetails.branch} onChange={e => handleBankDetailsChange('branch', e.target.value)} />
                <Input label="IFSC Code" value={quoteDetails.company.bankDetails.ifsc} onChange={e => handleBankDetailsChange('ifsc', e.target.value)} />
            </Section>
            <Section title="Customer Details">
                <Input label="Customer Name" value={quoteDetails.customer.name} onChange={e => handleDetailsChange('customer', 'name', e.target.value)} />
                <Textarea label="Project Address" value={quoteDetails.customer.address} onChange={e => handleDetailsChange('customer', 'address', e.target.value)} />
            </Section>
            <Section title="Quotation Info">
                <Textarea label="Description / Notes" value={quoteDetails.meta.description} onChange={e => handleDetailsChange('meta', 'description', e.target.value)} rows={4} />
                <Textarea label="Terms & Conditions" value={quoteDetails.meta.terms} onChange={e => handleDetailsChange('meta', 'terms', e.target.value)} rows={5} />
            </Section>
             <Section title="Additional Charges">
                <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-3">Hardware Items</h4>
                <div className="space-y-3">
                    {quoteDetails.hardware.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-800/50 rounded-md border border-gray-700">
                            <div className="col-span-5"><Input label="Item Name" value={item.name} onChange={e => handleHardwareChange(index, 'name', e.target.value)} /></div>
                            <div className="col-span-2"><Input label="Qty" type="number" min="0" value={item.quantity || ''} onChange={e => handleHardwareChange(index, 'quantity', e.target.value)} /></div>
                            <div className="col-span-2"><Input label="Unit" value={item.unit} onChange={e => handleHardwareChange(index, 'unit', e.target.value)} placeholder="pcs"/></div>
                            <div className="col-span-2"><Input label="Rate" type="number" min="0" value={item.rate || ''} onChange={e => handleHardwareChange(index, 'rate', e.target.value)} /></div>
                            <div className="col-span-1"><button onClick={() => handleRemoveHardware(index)} className="p-2 h-10 w-full bg-red-600/80 rounded-md hover:bg-red-500 transition-colors flex items-center justify-center"><TrashIcon className="w-5 h-5" /></button></div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddHardware} className="w-full mt-3 px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">+ Add Hardware Item</button>

                <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2 mt-6">Installation Charge</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Rate" type="number" value={quoteDetails.installation.rate || ''} onChange={e => handleInstallationChange('rate', e.target.value)} />
                    <Select label="Unit" value={quoteDetails.installation.unit} onChange={e => handleInstallationChange('unit', e.target.value)} options={INSTALLATION_UNITS} />
                </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfiguratorPanel;