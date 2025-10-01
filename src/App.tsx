import React, { useState, useRef, useEffect } from 'react';
import { DesignConfig, QuoteDetails, WindowConfig, HardwareItem, IronProfile, WindowProfile } from './types';
import { INITIAL_CONFIG, INITIAL_QUOTE_DETAILS, INITIAL_WINDOW_CONFIG, INITIAL_GATE_PROFILES, INITIAL_WINDOW_PROFILES } from './constants';
import ConfiguratorPanel from './components/ConfiguratorPanel';
import PreviewPanel from './components/PreviewPanel';
import QuotePanel from './components/QuotePanel';
import { SparklesIcon, Bars3Icon } from './components/Icons';
import { calculateWindowQuote } from './utils/calculator';

type ProductType = 'gate' | 'window';

const App: React.FC = () => {
  const [productType, setProductType] = useState<ProductType>('gate');
  const [gateConfig, setGateConfig] = useState<DesignConfig>(INITIAL_CONFIG);
  const [windowConfig, setWindowConfig] = useState<WindowConfig>(INITIAL_WINDOW_CONFIG);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>(INITIAL_QUOTE_DETAILS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [gateProfiles, setGateProfiles] = useState<IronProfile[]>(INITIAL_GATE_PROFILES);
  const [windowProfiles, setWindowProfiles] = useState<WindowProfile[]>(INITIAL_WINDOW_PROFILES);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);


  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        sidebarToggleRef.current &&
        !sidebarToggleRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const newTitle = productType === 'gate' ? 'Custom Iron Gate Quotation' : 'Custom Aluminium Window Quotation';
    if (productType === 'gate') {
        setSelectedCellId(null);
    }
    setQuoteDetails(prev => ({
        ...prev,
        meta: { ...prev.meta, title: newTitle },
    }));
  }, [productType]);


  return (
    <div className="min-h-screen bg-black text-gray-200">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(38,38,38,0.5)_0,_rgba(0,0,0,1)_80%)] -z-10"></div>
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-[radial-gradient(ellipse_at_center,_rgba(192,132,252,0.1)_0,_transparent_60%)] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0,_transparent_70%)] -z-10"></div>
      
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-lg border-b border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button ref={sidebarToggleRef} onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors">
             <Bars3Icon className="w-6 h-6" />
          </button>
          <SparklesIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold font-orbitron tracking-wider text-white">IRON<span className="text-blue-400">FORGE</span></h1>
        </div>
      </header>
      
      <main className="pt-16 flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <aside ref={sidebarRef} className={`fixed top-16 bottom-0 left-0 z-40 w-full max-w-sm lg:w-96 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex-shrink-0 h-full`}>
            <ConfiguratorPanel 
              productType={productType}
              setProductType={setProductType}
              gateConfig={gateConfig}
              setGateConfig={setGateConfig}
              windowConfig={windowConfig}
              setWindowConfig={setWindowConfig}
              quoteDetails={quoteDetails}
              setQuoteDetails={setQuoteDetails}
              gateProfiles={gateProfiles}
              setGateProfiles={setGateProfiles}
              windowProfiles={windowProfiles}
              setWindowProfiles={setWindowProfiles}
              selectedCellId={selectedCellId}
              setSelectedCellId={setSelectedCellId}
            />
        </aside>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 overflow-y-auto xl:items-start">
            <PreviewPanel 
              productType={productType}
              gateConfig={gateConfig}
              windowConfig={windowConfig}
              setWindowConfig={setWindowConfig}
              gateProfiles={gateProfiles}
              windowProfiles={windowProfiles}
              selectedCellId={selectedCellId}
              setSelectedCellId={setSelectedCellId}
            />
            {/* FIX: Removed invalid props 'gateConfig', 'windowConfig', 'gateProfiles', and 'windowProfiles' from QuotePanel. The component now receives all necessary data via the 'quoteDetails' prop. */}
            <QuotePanel 
              productType={productType}
              quoteDetails={quoteDetails} 
              setQuoteDetails={setQuoteDetails}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;