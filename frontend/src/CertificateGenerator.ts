import jsPDF from 'jspdf';

export const generateCertificate = (donorName: string, amount: string, token: string, causeName: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 297, 210, 'F');

  // Border
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);

  // Logo Placeholder / Text
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('AltruBSC', 148, 45, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL CERTIFICATE OF IMPACT', 148, 55, { align: 'center' });

  // Main Content
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(22);
  doc.text('This is to certify that', 148, 85, { align: 'center' });

  doc.setFontSize(32);
  doc.setTextColor(16, 185, 129);
  doc.text(donorName, 148, 105, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(`Has generously donated`, 148, 125, { align: 'center' });

  doc.setFontSize(28);
  doc.text(`${amount} ${token}`, 148, 145, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(100, 116, 139);
  doc.text(`To the cause: ${causeName}`, 148, 165, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.text('Verified by AltruBSC Smart Contracts', 148, 185, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 148, 192, { align: 'center' });

  doc.save(`AltruBSC_Impact_Certificate_${donorName.slice(0, 8)}.pdf`);
};
