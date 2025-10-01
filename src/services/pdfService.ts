import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteDetails, QuotationItem, DesignConfig, WindowConfig, IronProfile } from '../types';
import { INITIAL_GATE_PROFILES } from '../constants'; // To resolve profile names

type jsPDFWithAutoTable = jsPDF & {
    lastAutoTable: { finalY: number };
};

interface PdfData {
    quoteDetails: QuoteDetails;
    totalStructureCost: number;
    totalHardwareCost: number;
    totalInstallationCost: number;
    grandTotal: number;
}

const FONT_REGULAR = 'helvetica';
const FONT_BOLD = 'helvetica';
const PRIMARY_COLOR = '#1E293B'; // Slate 800
const SECONDARY_COLOR = '#475569'; // Slate 600
const TEXT_COLOR_DARK = '#0F172A'; // Slate 900
const TEXT_COLOR_LIGHT = '#F8FAFC'; // Slate 50

const drawHeader = (doc: jsPDF, data: PdfData) => {
    const { company } = data.quoteDetails;
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 10;
    
    // Background
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(0, 0, pageW, 28, 'F');

    // Logo
    if (company.logo) {
        try {
            const imgProps = doc.getImageProperties(company.logo);
            const ratio = imgProps.width / imgProps.height;
            const logoHeight = 18;
            const logoWidth = logoHeight * ratio;
            doc.addImage(company.logo, 'PNG', margin, 5, logoWidth, logoHeight);
        } catch(e) { console.error("Could not add logo to PDF:", e); }
    }

    // Company Name
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text(company.name, pageW / 2, 17, { align: 'center' });

    // Quotation Title
    doc.setFont(FONT_REGULAR, 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#D1D5DB'); // Gray 300
    doc.text("QUOTATION", pageW - margin, 18, { align: 'right' });
};

// FIX: Changed function to accept page number directly to resolve issue with `doc.internal.getCurrentPageInfo()`.
const drawFooter = (doc: jsPDF, data: PdfData, pageNum: number) => {
    const pageCount = doc.getNumberOfPages();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const { company } = data.quoteDetails;

    doc.setFontSize(8);
    doc.setTextColor(SECONDARY_COLOR);
    const footerText = `Page ${pageNum} of ${pageCount} | ${company.website} | ${company.email}`;
    doc.text(footerText, pageW / 2, pageH - 8, { align: 'center' });
};


// FIX: Changed doc type to jsPDFWithAutoTable to access lastAutoTable property.
const drawGateSpecPage = (doc: jsPDFWithAutoTable, item: QuotationItem, itemIndex: number, gateProfiles: IronProfile[]) => {
    const config = item.config as DesignConfig;
    const calcs = item.calculations;
    doc.addPage();
    let y = 35;
    
    doc.setFontSize(14);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.text(`SPECIFICATION SHEET - ITEM #${itemIndex + 1}: ${item.description}`, 10, y);
    y+= 10;

    if (item.previewImage) {
        try {
            const imgProps = doc.getImageProperties(item.previewImage);
            const imgRatio = imgProps.height / imgProps.width;
            const imgWidth = doc.internal.pageSize.getWidth() - 20;
            const imgHeight = imgWidth * imgRatio;
            const finalHeight = Math.min(imgHeight, 100);
            const finalWidth = finalHeight / imgRatio;
            doc.addImage(item.previewImage, 'PNG', 10, y, finalWidth, finalHeight);
            y += finalHeight + 10;
        } catch(e) { console.error("Could not add item preview to PDF:", e)}
    }

    const mainBody = [
        ['Overall Size (WxH)', `${config.width} x ${config.height} ${config.unit}`],
        ['Gate Type', `${config.gateType}`],
        ['Frame Profile', `${gateProfiles.find(p => p.id === config.frameProfileId)?.name || 'N/A'}`],
        ['Frame Color', `${config.frameColor}`],
        ['Estimated Area', `${calcs.areaSqFt.toFixed(2)} sq ft`],
        ['Estimated Weight', `${calcs.totalWeightKg.toFixed(2)} kg`],
    ];

    autoTable(doc, {
        startY: y, theme: 'grid',
        head: [['Specification', 'Details']],
        body: mainBody,
        headStyles: { fillColor: PRIMARY_COLOR },
        styles: { cellPadding: 2.5, fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    y = doc.lastAutoTable.finalY + 8;

    const sequence = config.leftDoorDesign.innerDesignSequence;
    if (sequence && sequence.length > 0) {
        const innerBody = sequence.map((step, i) => [
            `Step ${i + 1}`,
            gateProfiles.find(p => p.id === step.profileId)?.name || 'N/A',
            `${step.gap} ${config.unit}`
        ]);
        autoTable(doc, {
            startY: y, theme: 'grid',
            head: [['Inner Design', 'Profile', 'Gap After']],
            body: [[config.leftDoorDesign.innerDesign, '', ''], ...innerBody],
            headStyles: { fillColor: PRIMARY_COLOR },
            styles: { cellPadding: 2.5, fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });
    }
}


// FIX: Changed doc type to jsPDFWithAutoTable to access lastAutoTable property.
const drawWindowSpecPage = (doc: jsPDFWithAutoTable, item: QuotationItem, itemIndex: number) => {
    const config = item.config as WindowConfig;
    const calcs = item.calculations;
    doc.addPage();
    let y = 35;

    doc.setFontSize(14);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.text(`SPECIFICATION SHEET - ITEM #${itemIndex + 1}: ${item.description.replace(' with Security Grill', '')}`, 10, y);
    y+= 10;

    if (item.previewImage) {
        try {
            const imgProps = doc.getImageProperties(item.previewImage);
            const imgRatio = imgProps.height / imgProps.width;
            let imgWidth = 80;
            let imgHeight = imgWidth * imgRatio;
            if (imgHeight > 60) {
                imgHeight = 60;
                imgWidth = imgHeight / imgRatio;
            }
            doc.addImage(item.previewImage, 'PNG', 10, y, imgWidth, imgHeight);
        } catch(e) { console.error("Could not add item preview to PDF:", e)}
    }

    const mainBody = [
        ['Overall Size (WxH)', `${config.width} x ${config.height} ${config.unit}`],
        ['Grid Layout', `${config.rowSizes.length} Rows x ${config.colSizes.length} Cols`],
        ['Color/Finish', `${config.color}`],
        ['Glass Thickness', `${config.glassThicknessMm} mm`],
        ['Est. Aluminium Weight', `${calcs.totalWeightKg.toFixed(2)} kg`],
        ['Est. Area', `${calcs.areaSqFt.toFixed(2)} sq ft`],
    ];
     autoTable(doc, {
        startY: y, theme: 'grid',
        head: [['Specification', 'Details']],
        body: mainBody,
        headStyles: { fillColor: PRIMARY_COLOR },
        styles: { cellPadding: 2.5, fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: 100 }
    });
    y = doc.lastAutoTable.finalY + 8;

    const panelBody = config.grid.flat().map(cell => [
        `Panel (${cell.id})`, cell.type, cell.hasMesh ? 'Yes' : 'No'
    ]);
     autoTable(doc, {
        startY: y, theme: 'grid',
        head: [['Panel ID', 'Type', 'Insect Mesh']],
        body: panelBody,
        headStyles: { fillColor: SECONDARY_COLOR },
        styles: { cellPadding: 2.5, fontSize: 10 },
    });
    y = doc.lastAutoTable.finalY + 8;
    
    if (config.grillConfig && item.grillCalculations) {
        doc.setFontSize(12);
        doc.setFont(FONT_BOLD, 'bold');
        doc.text('Attached Iron Security Grill Details', 10, y);
        y += 6;

        const grillBody = [
            ['Grill Frame Profile', INITIAL_GATE_PROFILES.find(p => p.id === config.grillConfig!.frameProfileId)?.name || 'N/A'],
            ['Grill Inner Design', config.grillConfig.leftDoorDesign.innerDesign],
            ['Grill Inner Profile', INITIAL_GATE_PROFILES.find(p => p.id === config.grillConfig!.leftDoorDesign.innerDesignSequence[0].profileId)?.name || 'N/A'],
            ['Est. Grill Weight', `${item.grillCalculations.totalWeightKg.toFixed(2)} kg`],
        ];
        autoTable(doc, {
            startY: y, theme: 'grid',
            head: [['Grill Specification', 'Details']],
            body: grillBody,
            headStyles: { fillColor: PRIMARY_COLOR },
            styles: { cellPadding: 2.5, fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });
        y = doc.lastAutoTable.finalY + 8;
    }
}


export async function generatePdf(data: PdfData): Promise<void> {
    const { 
        quoteDetails, totalStructureCost, totalHardwareCost, 
        totalInstallationCost, grandTotal 
    } = data;
    const { company, customer, meta, items, hardware, installation } = quoteDetails;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }) as jsPDFWithAutoTable;
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = 40;

    // --- Customer Details & Quote Info ---
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.setFont(FONT_BOLD, 'bold');
    doc.text("BILLED TO", margin, y);
    doc.setFont(FONT_REGULAR, 'normal');
    const customerAddress = `${customer.name}\n${customer.address}`;
    doc.text(customerAddress, margin, y + 5);

    const rightColX = pageW / 2 + 30;
    doc.setFont(FONT_BOLD, 'bold');
    doc.text("QUOTATION #", rightColX, y);
    doc.text("DATE", rightColX, y + 5);
    doc.setFont(FONT_REGULAR, 'normal');
    doc.text(`Q-${Date.now().toString().slice(-6)}`, pageW - margin, y, { align: 'right'});
    doc.text(new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, y + 5, { align: 'right'});
    y += 20;
    
    // --- Main Items Table ---
    const itemsBody = items.map((item, index) => {
        const size = `${item.config.width}x${item.config.height} ${item.config.unit}`;
        let desc = `${item.description}\n(Size: ${size})`;
        let rate = `₹${item.rate.toFixed(2)} / ${item.rateUnit}`;
        if (item.productType === 'window' && item.grillRate) {
            desc += `\n+ Iron Security Grill`;
            rate += ` (Window)\n₹${item.grillRate.toFixed(2)} / ${item.grillRateUnit} (Grill)`;
        }
        return [
            index + 1,
            desc,
            item.quantity,
            rate,
            `₹${item.structureCost.toFixed(2)}`
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['#', 'ITEM DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
        body: itemsBody,
        theme: 'striped',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: TEXT_COLOR_LIGHT, fontStyle: 'bold' },
        styles: { font: FONT_REGULAR, fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 75 },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 40, halign: 'right' },
            4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        didDrawPage: (hookData) => {
            drawHeader(doc, data);
            // FIX: Pass current page number to drawFooter
            drawFooter(doc, data, hookData.pageNumber);
            // Reset Y position for content after header
            y = 35; 
            doc.setPage(hookData.pageNumber);
        }
    });
    y = doc.lastAutoTable.finalY;

    // --- Hardware Table ---
    if (hardware && hardware.length > 0) {
        y += 5;
        const hardwareBody = hardware.map(item => [item.name, item.quantity, item.unit, `₹${item.rate.toFixed(2)}`, `₹${(item.quantity * item.rate).toFixed(2)}`]);
        autoTable(doc, {
            startY: y,
            head: [['HARDWARE & ACCESSORIES', 'QTY', 'UNIT', 'RATE', 'AMOUNT']],
            body: hardwareBody,
            theme: 'striped',
            headStyles: { fillColor: SECONDARY_COLOR, textColor: TEXT_COLOR_LIGHT, fontStyle: 'bold', fontSize: 9 },
            styles: { font: FONT_REGULAR, fontSize: 9, cellPadding: 3 },
             columnStyles: {
                0: { cellWidth: 75 },
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            },
        });
        y = doc.lastAutoTable.finalY;
    }
    
    // --- Summary & Totals ---
    const summaryX = pageW / 2;
    const summaryY = y + 10;
    const finalY = summaryY > 210 ? 297 - 80 : summaryY; // Move to next page if too low
    if (finalY < y) { doc.addPage(); }
    y = finalY < y ? 35 : finalY;
    
    const totals = [
        ['Structure Subtotal', `₹${totalStructureCost.toFixed(2)}`],
        ['Hardware Subtotal', `₹${totalHardwareCost.toFixed(2)}`],
        ['Installation Charges', `₹${totalInstallationCost.toFixed(2)}`],
    ];
    autoTable(doc, {
        startY: y, body: totals, theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } },
        margin: { left: summaryX }
    });
    y = doc.lastAutoTable.finalY;
    doc.setDrawColor(SECONDARY_COLOR);
    doc.line(summaryX, y + 1, pageW - margin, y + 1);
    
    doc.setFontSize(14);
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFillColor(PRIMARY_COLOR);
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.roundedRect(summaryX, y + 3, pageW - margin - summaryX, 12, 2, 2, 'F');
    doc.text('GRAND TOTAL', summaryX + 5, y + 10);
    doc.text(`₹${grandTotal.toFixed(2)}`, pageW - margin, y + 10, { align: 'right' });
    y += 20;

    // --- Bank Details & Terms ---
    const bankDetailsText = `Bank: ${company.bankDetails.bank}, ${company.bankDetails.branch}\nA/C Name: ${company.bankDetails.name}\nA/C No: ${company.bankDetails.account}\nIFSC: ${company.bankDetails.ifsc}`;
    
    autoTable(doc, {
        startY: y,
        body: [
            [{ content: 'BANK DETAILS', styles: { fontStyle: 'bold' } }, { content: 'TERMS & CONDITIONS', styles: { fontStyle: 'bold' } }] ,
            [bankDetailsText, meta.terms],
        ],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 0 },
        columnStyles: {
            0: { cellWidth: (pageW - margin * 2) * 0.45 },
            1: { cellWidth: (pageW - margin * 2) * 0.55 },
        }
    });


    // --- Specification Pages ---
    items.forEach((item, index) => {
        if(item.productType === 'gate') {
            drawGateSpecPage(doc, item, index, INITIAL_GATE_PROFILES);
        } else if (item.productType === 'window') {
            drawWindowSpecPage(doc, item, index);
        }
    });


    // Re-draw footers on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // FIX: Pass current page number to drawFooter
        drawFooter(doc, data, i);
    }

    doc.save(`${meta.title.replace(/\s/g, '_')}_Quotation.pdf`);
}