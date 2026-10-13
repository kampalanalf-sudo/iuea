import { jsPDF } from 'jspdf';
import { PROFILE_NAVIGATION_MANUALS } from '../data/userProfiles';
import { ProfileCategory, ProfileNavigationManual } from '../types/distribution';

function renderManualToDoc(
  doc: jsPDF,
  manual: ProfileNavigationManual,
  startOnNewPage: boolean
) {
  if (startOnNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const drawHeaderBar = (pageTitle: string) => {
    doc.setFillColor(10, 11, 14);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(212, 255, 0);
    doc.rect(0, 26, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(212, 255, 0);
    doc.text('TANK DISTRIBUTION // OFFICIAL NAVIGATION MANUAL', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 205, 215);
    doc.text(pageTitle, margin, 18.5);
  };

  const drawFooter = () => {
    doc.setDrawColor(210, 215, 225);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 118, 135);
    doc.text(
      `Tank Distribution Platform • ${manual.roleTitle}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Page ${doc.getNumberOfPages()}`,
      pageWidth - margin - 14,
      pageHeight - 8
    );
  };

  drawHeaderBar(manual.roleTitle);

  let y = 36;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 20, 30);
  const titleLines = doc.splitTextToSize(manual.roleTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 105);
  const subLines = doc.splitTextToSize(manual.subtitle, contentWidth);
  doc.text(subLines, margin, y);
  y += subLines.length * 5 + 4;

  // Access Scope Box
  doc.setFillColor(244, 246, 250);
  doc.setDrawColor(210, 218, 230);
  const scopeLines = doc.splitTextToSize(
    `ROLE ACCESS & VISIBILITY SCOPE: ${manual.accessScopeSummary}`,
    contentWidth - 8
  );
  const targetLines = doc.splitTextToSize(
    `TARGET AUDIENCE: ${manual.targetAudience}`,
    contentWidth - 8
  );
  const boxHeight = (scopeLines.length + targetLines.length) * 4.6 + 10;
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 28, 45);
  doc.text(targetLines, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 55, 75);
  doc.text(scopeLines, margin + 4, y + 6 + targetLines.length * 4.8 + 2);
  y += boxHeight + 7;

  // Key Capabilities
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 20, 30);
  doc.text('KEY ROLE CAPABILITIES & PERMISSIONS', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 48, 64);
  manual.keyCapabilities.forEach((cap) => {
    const lines = doc.splitTextToSize(`•  ${cap}`, contentWidth - 4);
    if (y + lines.length * 4.5 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 1.5;
  });

  y += 4;

  // Step-by-Step Navigation Sections
  manual.sections.forEach((sec) => {
    if (y + 38 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }

    // Section Banner
    doc.setFillColor(18, 22, 32);
    doc.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(212, 255, 0);
    doc.text(`${sec.stepNumber}: ${sec.title.toUpperCase()}`, margin + 3, y + 5.7);
    y += 12.5;

    // Navigation Path
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 140, 95);
    doc.text(`SITE NAVIGATION PATH:  ${sec.navigationPath}`, margin, y);
    y += 5;

    // Summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 55, 72);
    const sumLines = doc.splitTextToSize(sec.summary, contentWidth);
    doc.text(sumLines, margin, y);
    y += sumLines.length * 4.5 + 2.5;

    // Action Items
    sec.actionItems.forEach((act, idx) => {
      const actLines = doc.splitTextToSize(
        `${idx + 1}. ${act}`,
        contentWidth - 6
      );
      if (y + actLines.length * 4.5 > pageHeight - 22) {
        drawFooter();
        doc.addPage();
        drawHeaderBar(manual.roleTitle);
        y = 36;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(25, 32, 48);
      doc.text(actLines, margin + 3, y);
      y += actLines.length * 4.5 + 1.5;
    });

    // Pro Tip
    const tipLines = doc.splitTextToSize(
      `PRO TIP: ${sec.proTip}`,
      contentWidth - 6
    );
    if (y + tipLines.length * 4.5 + 6 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 100, 120);
    doc.text(tipLines, margin + 3, y + 1);
    y += tipLines.length * 4.5 + 6;
  });

  // FAQ Block
  if (manual.faq.length > 0) {
    if (y + 28 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 20, 30);
    doc.text('FREQUENTLY ASKED QUESTIONS (FAQ)', margin, y);
    y += 5.5;

    manual.faq.forEach((item) => {
      const qLines = doc.splitTextToSize(`Q: ${item.q}`, contentWidth - 4);
      const aLines = doc.splitTextToSize(`A: ${item.a}`, contentWidth - 4);
      if (y + (qLines.length + aLines.length) * 4.5 + 4 > pageHeight - 22) {
        drawFooter();
        doc.addPage();
        drawHeaderBar(manual.roleTitle);
        y = 36;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(20, 28, 45);
      doc.text(qLines, margin + 2, y);
      y += qLines.length * 4.5 + 1;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor(55, 65, 85);
      doc.text(aLines, margin + 2, y);
      y += aLines.length * 4.5 + 3.5;
    });
  }

  drawFooter();
}

export function downloadProfileManualPdf(category: ProfileCategory): void {
  const manual = PROFILE_NAVIGATION_MANUALS.find((m) => m.category === category);
  if (!manual) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  renderManualToDoc(doc, manual, false);
  doc.save(manual.pdfFileName);
}

export function downloadAllProfileManualsCombinedPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  PROFILE_NAVIGATION_MANUALS.forEach((manual, index) => {
    renderManualToDoc(doc, manual, index > 0);
  });

  doc.save('Tank_Distribution_Complete_User_Manuals.pdf');
}
