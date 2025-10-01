import React, { useState, useMemo } from 'react';
import { QuoteDetails, QuotationItem, WindowConfig } from '../types';
import { generatePdf } from '../services/pdfService';
import { CalculatorIcon, DocumentArrowDownIcon, TrashIcon } from './Icons';

interface QuotePanelProps {
  productType: 'gate' | 'window';
  quoteDetails: QuoteDetails;
  setQuoteDetails: React.Dispatch<React.SetStateAction<QuoteDetails>>;
}

const QuotePanel: React.FC<QuotePanelProps> = ({ quoteDetails, setQuoteDetails }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { items, hardware, installation } = quoteDetails;

  const totalStructureCost = useMemo(() => items.reduce((acc, item) => acc + item.structureCost, 0), [items]);
  const totalHardwareCost = useMemo(() => hardware.reduce((acc, item) => acc + (item.quantity * item.rate), 0), [hardware]);

  const totalWeightKg = useMemo(() => items.reduce((acc, item) => {
    const itemWeight = item.calculations.totalWeightKg + (item.grillCalculations?.totalWeightKg || 0);
    return acc + (itemWeight * item.quantity);
  }, 0), [items]);

  const totalAreaSqFt = useMemo(() => items.reduce((acc, item) => acc + (item.calculations.areaSqFt * item.quantity), 0), [items]);
  const totalAreaSqM = useMemo(() => items.reduce((acc, item) => acc + (item.calculations.areaSqM * item.quantity), 0), [items]);
  
  const totalInstallationCost = useMemo(() => {
    if (!installation || installation.rate <= 0) return 0;
    switch (installation.unit) {
      case 'lumpsum': return installation.rate;
      case 'kg': return totalWeightKg * installation.rate;
      case 'sqft': return totalAreaSqFt * installation.rate;
      case 'sqm': return totalAreaSqM * installation.rate;
      default: return 0;
    }
  }, [installation, totalWeightKg, totalAreaSqFt, totalAreaSqM]);
  
  const grandTotal = totalStructureCost + totalHardwareCost + totalInstallationCost;

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePdf({
        quoteDetails,
        totalStructureCost,
        totalHardwareCost,
        totalInstallationCost,
        grandTotal,
      });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQuoteDetails(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-lg p-6 flex flex-col space-y-4 h-full">
      <div className="flex items-center gap-2 border-b-2 border-gray-700 pb-2">
        <CalculatorIcon className="w-6 h-6 text-blue-300"/>
        <h2 className="text-xl font-bold font-orbitron text-blue-300">Quotation</h2>
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
        {items.length === 0 ? (
           <div className="flex items-center justify-center h-full text-gray-500">
             <p>Configure an item and add it to the quote.</p>
           </div>
        ) : (
          <div className="space-y-3">
             <h3 className="text-lg font-bold text-gray-300">Items</h3>
             {items.map((item, index) => <QuotationItemCard key={item.id} item={item} index={index} onRemove={handleRemoveItem}/>)}
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-gray-700 space-y-2">
        <CostBreakdownRow label="Structure Total" amount={totalStructureCost} />
        <CostBreakdownRow label="Hardware Total" amount={totalHardwareCost} />
        <CostBreakdownRow label="Installation Charge" amount={totalInstallationCost} />
      </div>

      <div className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-700 text-center mt-2">
        <p className="text-lg font-semibold text-gray-300">Grand Total</p>
        <p className="text-4xl font-extrabold text-white">
          ₹{grandTotal.toFixed(2)}
        </p>
      </div>

      <button 
        onClick={handleGeneratePdf}
        disabled={isGeneratingPdf || items.length === 0}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isGeneratingPdf ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating PDF...</>
        ) : (
            <><DocumentArrowDownIcon className="w-6 h-6" />Generate PDF</>
        )}
      </button>
    </div>
  );
};

const QuotationItemCard: React.FC<{item: QuotationItem, index: number, onRemove: (id: string) => void}> = ({ item, index, onRemove }) => {
    const { config, quantity, rate, rateUnit, structureCost, description, grillRate, grillRateUnit, calculations, grillCalculations } = item;
    const isWindowWithGrill = item.productType === 'window' && (item.config as WindowConfig).grillConfig && grillCalculations;

    let windowPartCost = 0;
    if (rate > 0) {
        switch(rateUnit) {
            case 'sqft': windowPartCost = calculations.areaSqFt * rate; break;
            case 'sqm': windowPartCost = calculations.areaSqM * rate; break;
            case 'kg': windowPartCost = calculations.totalWeightKg * rate; break;
        }
    }

    let grillPartCost = 0;
    if (isWindowWithGrill && grillRate && grillRate > 0) {
        switch(grillRateUnit) {
            case 'sqft': grillPartCost = grillCalculations.areaSqFt * grillRate; break;
            case 'sqm': grillPartCost = grillCalculations.areaSqM * grillRate; break;
            case 'kg': grillPartCost = grillCalculations.totalWeightKg * grillRate; break;
        }
    }
    windowPartCost *= quantity;
    grillPartCost *= quantity;

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-base text-gray-200">{index + 1}. {description}</p>
                    <p className="text-xs text-gray-400">
                        Overall Size: {config.width}x{config.height} {config.unit} | Qty: {quantity}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-bold text-lg text-white">₹{structureCost.toFixed(2)}</p>
                    <button onClick={() => onRemove(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
             {isWindowWithGrill && (
                <div className="text-xs text-gray-300 pl-4 border-l-2 border-gray-600 ml-1 mt-2 py-1 space-y-1">
                    <div className="flex justify-between">
                        <span>Window: <span className="text-gray-400">(Rate: ₹{item.rate}/{item.rateUnit})</span></span>
                        <span className="font-semibold">₹{windowPartCost.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Grill: <span className="text-gray-400">(Rate: ₹{item.grillRate}/{item.grillRateUnit})</span></span>
                        <span className="font-semibold">₹{grillPartCost.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};


const CostBreakdownRow: React.FC<{ label: string; amount: number }> = ({ label, amount }) => (
    <div className="flex justify-between items-center text-lg p-2 bg-gray-800/50 rounded-md">
        <span className="text-gray-300">{label}</span>
        <span className="font-semibold text-white">₹{amount.toFixed(2)}</span>
    </div>
);

export default QuotePanel;