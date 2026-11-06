import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ImageRun,
  PageOrientation,
  ShadingType,
  UnderlineType,
  VerticalAlign,
} from 'docx';
import {
  Printer,
  Download,
  X,
  Award,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
  Palette,
  FileCheck,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Certificate } from '../types';

interface Props {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
}

import {
  COURSE_SUBJECT_THEMES,
  CourseSubjectTheme,
  getCourseTheme,
} from '../data/courseThemes';
import { ThemeEmblem, getEmblemPngBuffer } from './ThemeEmblems';
import { TunisianWatermark, WatermarkVariant } from './TunisianWatermark';

// 10 Distinct Visual Themes & Presentations for the 10 Courses
export type CourseThemeDesign = CourseSubjectTheme;
export const COURSE_THEME_DESIGNS = COURSE_SUBJECT_THEMES;
export type CourseThemeConfig = CourseSubjectTheme;
export const COURSE_THEMES = COURSE_SUBJECT_THEMES;


// Helper to detect course number from certificate
function detectCourseNumber(cert: Certificate): number {
  if (cert.numeroSeance && COURSE_THEME_DESIGNS[cert.numeroSeance]) {
    return cert.numeroSeance;
  }
  const themeLower = (cert.themeFormation || '').toLowerCase();
  if (themeLower.includes('trousse') || themeLower.includes('urgences critiques')) return 1;
  if (themeLower.includes('arrêt') || themeLower.includes('dae') || themeLower.includes('cardiorespiratoire')) return 2;
  if (themeLower.includes('choc') || themeLower.includes('vagal') || themeLower.includes('anaphylactique')) return 3;
  if (themeLower.includes('ecg') || themeLower.includes('électrocardiogramme')) return 4;
  if (themeLower.includes('pansement') || themeLower.includes('plaie')) return 5;
  if (themeLower.includes('perte de connaissance') || themeLower.includes('glasgow') || themeLower.includes('rôle propre')) return 6;
  if (themeLower.includes('éducation pour la santé') || themeLower.includes('éducation thérapeutique')) return 7;
  if (themeLower.includes('aes') || themeLower.includes('accidents d\'exposition') || themeLower.includes('barrières')) return 8;
  if (themeLower.includes('agressifs') || themeLower.includes('communication') || themeLower.includes('conflictuelle')) return 9;
  if (themeLower.includes('éthique') || themeLower.includes('secret') || themeLower.includes('déontologie')) return 10;
  return 2;
}

export const CertificateTemplate: React.FC<Props> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  const detectedNum = detectCourseNumber(certificate);
  const [selectedCourseThemeNum, setSelectedCourseThemeNum] = useState<number>(detectedNum);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [watermarkVariant, setWatermarkVariant] = useState<WatermarkVariant>('flag_official');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.11);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const certContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCourseThemeNum(detectCourseNumber(certificate));
  }, [certificate]);

  const activeTheme = COURSE_THEME_DESIGNS[selectedCourseThemeNum] || COURSE_THEME_DESIGNS[2];

  // Active theme title to be displayed (only title varies according to the 10 themes)
  const currentThemeTitle =
    selectedCourseThemeNum === detectedNum
      ? certificate.themeFormation || activeTheme.themeTitle
      : activeTheme.themeTitle;

  // Real participant name without any mock defaults
  const participantFullName = `${certificate.prenom || ''} ${certificate.nom || ''}`.trim();

  // QR Code generation with reliable fallback
  useEffect(() => {
    if (!isOpen || !certificate) return;
    const verifyData = `VERIF_OFFICIELLE_FMC:ATT-2026-SIJ:S${activeTheme.seanceNumber}:${certificate.numeroReference || 'CERT'}`;
    QRCode.toDataURL(verifyData, {
      width: 160,
      margin: 1,
      color: { dark: activeTheme.borderColor, light: '#FFFFFF' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch(() => {
        QRCode.toDataURL(`https://santetunis.gov.tn/verif/ATT-2026-SIJ-S${activeTheme.seanceNumber}`, {
          width: 160,
          margin: 1,
        }).then(setQrCodeUrl).catch(console.error);
      });
  }, [isOpen, certificate, activeTheme]);

  if (!isOpen || !certificate) return null;

  // Format date in exact official PDF style: "___ 31 _ / __ 10 __ / 2026"
  const formatDateParts = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return { day, month, year };
    } catch {
      return { day: '31', month: '10', year: '2026' };
    }
  };

  const dateParts = formatDateParts(certificate.dateFormation);

  // 1. Direct PDF Download (High Definition 300 DPI A4 Landscape)
  const handleDownloadPdf = async () => {
    const certElement = document.getElementById('printable-certificate');
    if (!certElement) return;

    setIsGeneratingPdf(true);
    setStatusMessage('Génération du PDF HD en cours...');

    try {
      const imgData = await toPng(certElement, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: activeTheme.bgTint,
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      const cleanNom = (participantFullName || 'Vierge').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Attestation_FMC_S${activeTheme.seanceNumber}_${cleanNom}.pdf`;
      pdf.save(filename);
      setStatusMessage('PDF téléchargé avec succès !');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      setStatusMessage('Erreur PDF. Tentative via impression...');
      setTimeout(() => setStatusMessage(null), 3000);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Robust image loader with multi-tier fallback (fetch arrayBuffer -> image element canvas -> generated badge)
  const loadLogoBytes = async (path: string, fallbackText: string, fallbackSub: string, colorHex: string): Promise<Uint8Array> => {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf && buf.byteLength > 200) {
          return new Uint8Array(buf);
        }
      }
    } catch {
      // Continue to canvas fallback
    }

    // Tier 2: Canvas image loader
    const canvasBytes = await new Promise<Uint8Array | null>((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 200;
            canvas.height = img.naturalHeight || 200;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            resolve(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = path;
      } catch {
        resolve(null);
      }
    });

    if (canvasBytes) return canvasBytes;

    // Tier 3: Guaranteed fallback badge so Word NEVER displays a broken image
    const c = document.createElement('canvas');
    c.width = 180;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 180, 160);
    ctx.strokeStyle = `#${colorHex}`;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 172, 152);
    ctx.fillStyle = `#${colorHex}`;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(fallbackText, 90, 70);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(fallbackSub, 90, 95);
    const dataUrl = c.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  };

  // 2. Native Word Document Export (.docx) with fully embedded logos, QR code, and exact A4 Landscape layout
  const handleDownloadWordDocx = async () => {
    setIsGeneratingWord(true);
    setStatusMessage('Génération du document Word (.docx) avec logos, emblème et QR code...');

    try {
      const primaryHex = activeTheme.primaryColor.replace('#', '');
      const borderHex = activeTheme.borderColor.replace('#', '');
      const badgeBgHex = activeTheme.badgeBg.replace('#', '');

      // 1. Fetch official logo buffers with bulletproof fallbacks
      const gsbBuf = await loadLogoBytes(
        '/assets/logo_gsb_tunis_sud.png',
        'GSB TUNIS SUD',
        'Santé de Base',
        primaryHex
      );

      const aliBuf = await loadLogoBytes(
        '/assets/logo_ali_trad.png',
        'CENTRE ALI TRAD',
        'Circonscription Sijoumi',
        primaryHex
      );

      // 2. Generate QR code binary buffer
      const verifyData = `VERIF_OFFICIELLE_FMC:ATT-2026-SIJ:S${activeTheme.seanceNumber}:${certificate.numeroReference || 'CERT-2026'}`;
      const qrDataUrl = await QRCode.toDataURL(verifyData, {
        width: 220,
        margin: 1,
        color: { dark: activeTheme.borderColor, light: '#FFFFFF' },
      });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));

      // 3. Generate theme emblem PNG buffer (e.g., Seringue, Tracé ECG, Ambulance SAMU, etc.)
      const emblemBytes = await getEmblemPngBuffer(
        activeTheme.emblemType || 'seringue',
        activeTheme.primaryColor,
        140
      );

      // 4. Construct complete Word Document (docx) in exact A4 Landscape
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
                width: 16838, // 297mm in twips
                height: 11906, // 210mm in twips
              },
              margin: { top: 400, right: 480, bottom: 400, left: 480 },
              borders: {
                pageBorderTop: { style: BorderStyle.DOUBLE, size: 24, color: borderHex },
                pageBorderBottom: { style: BorderStyle.DOUBLE, size: 24, color: borderHex },
                pageBorderLeft: { style: BorderStyle.DOUBLE, size: 24, color: borderHex },
                pageBorderRight: { style: BorderStyle.DOUBLE, size: 24, color: borderHex },
              },
            },
          },
          children: [
            // Top Header Table: GSB Logo Left (18%), Institutional Center (64%), Ali Trad Logo Right (18%)
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: borderHex },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 18, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.LEFT,
                          children: [new ImageRun({ data: gsbBuf, transformation: { width: 85, height: 80 }, type: 'png' })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 64, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'RÉPUBLIQUE TUNISIENNE', bold: true, size: 22, font: 'Times New Roman' })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'MINISTÈRE DE LA SANTÉ', bold: true, size: 22, font: 'Times New Roman' })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Direction régionale de la Santé de Tunis', size: 18, color: '333333', font: 'Times New Roman' })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Groupement de Santé de Base de Tunis Sud •', size: 18, color: '333333', font: 'Times New Roman' })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Circonscription Sanitaire de Sijoumi', size: 18, color: '333333', font: 'Times New Roman' })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Centre Intermédiaire Ali Trad', bold: true, size: 20, color: '111111', font: 'Times New Roman' })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 18, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new ImageRun({ data: aliBuf, transformation: { width: 100, height: 75 }, type: 'png' })],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Unit Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 160, after: 70 },
              children: [
                new TextRun({
                  text: 'UNITE DE FORMATION PARAMÉDICALE CONTINUE',
                  bold: true,
                  size: 20,
                  color: primaryHex,
                  characterSpacing: 25,
                  font: 'Arial',
                }),
              ],
            }),

            // Main Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 100 },
              children: [
                new TextRun({
                  text: 'ATTESTATION DE PARTICIPATION',
                  bold: true,
                  size: 36,
                  color: primaryHex,
                  font: 'Times New Roman',
                }),
              ],
            }),

            // Intro Sentence
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 80 },
              children: [
                new TextRun({
                  text: 'Il est attesté que :',
                  italics: true,
                  size: 20,
                  color: '444444',
                  font: 'Times New Roman',
                }),
              ],
            }),

            // Participant Line (Exact official PDF style, no fake data)
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 100 },
              children: [
                new TextRun({
                  text: 'Mme /:   ',
                  bold: true,
                  size: 22,
                  color: '111111',
                  font: 'Times New Roman',
                }),
                new TextRun({
                  text: participantFullName || '___________________________________________',
                  bold: !!participantFullName,
                  underline: participantFullName ? { type: UnderlineType.SINGLE, color: borderHex } : undefined,
                  size: 22,
                  color: participantFullName ? primaryHex : '888888',
                  font: 'Times New Roman',
                }),
              ],
            }),

            // Sentence
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 100 },
              children: [
                new TextRun({
                  text: 'A participé avec assiduité à la session de formation continue consacrée au thème :',
                  size: 20,
                  color: '333333',
                  font: 'Times New Roman',
                }),
              ],
            }),

            // Theme Box (Full-width styled box in theme colors + Theme Emblem + Official Title)
            new Table({
              width: { size: 94, type: WidthType.PERCENTAGE },
              alignment: AlignmentType.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: borderHex },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: borderHex },
                left: { style: BorderStyle.SINGLE, size: 8, color: borderHex },
                right: { style: BorderStyle.SINGLE, size: 8, color: borderHex },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { type: ShadingType.CLEAR, fill: badgeBgHex },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 80, after: 40 },
                          children: [
                            ...(emblemBytes
                              ? [
                                  new ImageRun({
                                    data: emblemBytes,
                                    transformation: { width: 34, height: 34 },
                                    type: 'png',
                                  }),
                                  new TextRun({ text: '   ' }),
                                ]
                              : []),
                            new TextRun({
                              text: `Thème : ${activeTheme.emblemLabel || 'Urgences'} • ${activeTheme.themeTagline || ''}`,
                              bold: true,
                              size: 17,
                              color: primaryHex,
                              font: 'Arial',
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 40, after: 80 },
                          children: [
                            new TextRun({
                              text: `« ${currentThemeTitle} »`,
                              bold: true,
                              size: 22,
                              color: primaryHex,
                              font: 'Times New Roman',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Spacing
            new Paragraph({ spacing: { before: 140 } }),

            // Meta Table: Date, Lieu, Unité (Evaluated cleanly, no raw templates)
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.LEFT,
                          children: [
                            new TextRun({ text: 'Date: ', bold: true, size: 18 }),
                            new TextRun({
                              text: `___ ${dateParts.day} _ / __ ${dateParts.month} __ / ${dateParts.year}`,
                              bold: true,
                              color: primaryHex,
                              size: 18,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 34, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({ text: 'Lieu : ', bold: true, size: 18 }),
                            new TextRun({ text: 'Centre Intermédiaire Ali Trad', size: 18 }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: 'Unité de ', bold: true, size: 18 }),
                            new TextRun({ text: 'Formation Paramédicale Continue', size: 18 }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Spacing
            new Paragraph({ spacing: { before: 120 } }),

            // Bottom Row: Embedded Verification QR Code + Doctor Signature
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.BOTTOM,
                      children: [
                        new Paragraph({
                          children: [new ImageRun({ data: qrBytes, transformation: { width: 75, height: 75 }, type: 'png' })],
                        }),
                        new Paragraph({
                          spacing: { before: 30 },
                          children: [
                            new TextRun({ text: 'Réf. Officielle : ', bold: true, size: 18 }),
                            new TextRun({ text: 'ATT-2026-SIJ', bold: true, color: primaryHex, size: 18 }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: `Séance #${activeTheme.seanceNumber} • Authenticité Certifiée GSB Tunis Sud`, size: 15, color: '666666' }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.BOTTOM,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: 'LE MÉDECIN CHEFFE DE CIRCONSCRIPTION', bold: true, size: 18 }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: 'SANITAIRE PAR INTÉRIM', bold: true, size: 17 }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 60 },
                          children: [
                            new TextRun({ text: 'Docteur Houidi Yosra Ghorbel', bold: true, size: 23, color: primaryHex }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const cleanNom = (participantFullName || 'Vierge').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Attestation_FMC_S${activeTheme.seanceNumber}_${cleanNom}.docx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage('Document Word (.docx) téléchargé avec logos, emblème et QR code !');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Erreur génération Word .docx:', err);
      setStatusMessage('Erreur lors de la création Word. Veuillez réessayer.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // 3. Direct PNG Image Download (Full HD)
  const handleDownloadImage = async () => {
    const certElement = document.getElementById('printable-certificate');
    if (!certElement) return;

    setIsGeneratingImage(true);
    setStatusMessage('Génération de l’image HD...');

    try {
      const imgData = await toPng(certElement, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: activeTheme.bgTint,
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const link = document.createElement('a');
      const cleanNom = (participantFullName || 'Vierge').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Attestation_FMC_S${activeTheme.seanceNumber}_${cleanNom}.png`;
      link.href = imgData;
      link.click();
      setStatusMessage('Image HD téléchargée avec succès !');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors du téléchargement image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 4. Robust Print Method using Hidden Isolated Iframe + Fallback
  const handlePrint = () => {
    const certElement = document.getElementById('printable-certificate');
    if (!certElement) {
      window.print();
      return;
    }

    try {
      const oldFrame = document.getElementById('certificate-print-frame');
      if (oldFrame) oldFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'certificate-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.visibility = 'hidden';

      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n');

      const certClone = certElement.cloneNode(true) as HTMLElement;
      certClone.style.maxWidth = 'none';
      certClone.style.width = '297mm';
      certClone.style.height = '210mm';
      certClone.style.aspectRatio = 'auto';
      certClone.style.margin = '0 auto';
      certClone.style.boxShadow = 'none';

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <title>Attestation_${participantFullName || 'Formation'}</title>
            ${styleTags}
            <style>
              @page {
                size: A4 landscape;
                margin: 0;
              }
              *, *:before, *:after {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: ${activeTheme.bgTint} !important;
              }
              .print-wrapper {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
              }
            </style>
          </head>
          <body>
            <div class="print-wrapper">
              ${certClone.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            printIframe.remove();
          }, 3000);
        }
      }, 500);
    } catch {
      window.print();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      certContainerRef.current?.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={certContainerRef}
      className="certificate-modal-wrapper fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto text-slate-900"
    >
      <div className="certificate-card-wrapper relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col my-auto border border-white/20">
        {/* Top Control Toolbar (hidden during print) */}
        <div className="print:hidden print-hidden bg-[#0A2540] text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-400/40">
              HD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                  Attestation Officielle de Participation
                </span>
                <span className="hidden md:inline px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                  Réf. Officielle : ATT-2026-SIJ
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Logos et texte conformes au document officiel • 10 Thèmes
              </div>
            </div>
          </div>

          {/* Theme / Course Selector & Direct Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-white/15">
              <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-slate-300 hidden lg:inline">Thème :</span>
              <select
                value={selectedCourseThemeNum}
                onChange={(e) => setSelectedCourseThemeNum(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-amber-300 focus:outline-hidden cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {Object.values(COURSE_THEME_DESIGNS).map((th) => (
                  <option key={th.seanceNumber} value={th.seanceNumber} className="bg-slate-900 text-white">
                    {th.watermarkSymbol} Séance #{th.seanceNumber} • {th.emblemLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Filigrane (Drapeau Tunisien) Selector & Opacity */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-red-500/30">
              <span className="text-xs">🇹🇳</span>
              <span className="text-[11px] text-slate-300 hidden sm:inline">Filigrane :</span>
              <select
                value={showWatermark ? watermarkVariant : 'none'}
                onChange={(e) => {
                  if (e.target.value === 'none') {
                    setShowWatermark(false);
                  } else {
                    setShowWatermark(true);
                    setWatermarkVariant(e.target.value as WatermarkVariant);
                  }
                }}
                className="bg-transparent text-xs font-bold text-red-300 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
                title="Style du filigrane"
              >
                <option value="flag_official" className="bg-slate-900 text-white">🇹🇳 Drapeau Tunisien</option>
                <option value="flag_seal" className="bg-slate-900 text-white">★ Sceau & Drapeau</option>
                <option value="flag_waving" className="bg-slate-900 text-white">🇹🇳 Drapeau Flottant</option>
                <option value="arms_tunisia" className="bg-slate-900 text-white">⚖️ Armoiries Tunisie</option>
                <option value="none" className="bg-slate-900 text-white">Sans filigrane</option>
              </select>

              {showWatermark && (
                <select
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="bg-slate-800 text-[10px] font-semibold text-slate-200 px-1 py-0.5 rounded border border-white/10 focus:outline-hidden cursor-pointer"
                  title="Intensité du filigrane"
                >
                  <option value={0.07} className="bg-slate-900">7% (Discret)</option>
                  <option value={0.11} className="bg-slate-900">11% (Optimal)</option>
                  <option value={0.16} className="bg-slate-900">16% (Accentue)</option>
                  <option value={0.22} className="bg-slate-900">22% (Prononcé)</option>
                </select>
              )}
            </div>

            {/* Télécharger Word (.docx) Button */}
            <button
              onClick={handleDownloadWordDocx}
              disabled={isGeneratingWord}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              title="Télécharger l'attestation en format Word (.docx natif avec logos et QR code)"
            >
              {isGeneratingWord ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-200" />
              )}
              <span>{isGeneratingWord ? 'Création...' : 'Word (.docx)'}</span>
            </button>

            {/* Télécharger PDF A4 HD Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              title="Télécharger directement en PDF A4 Paysage Haute Définition"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Génération...' : 'PDF HD'}</span>
            </button>

            {/* Imprimer Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              title="Imprimer directement en A4 Paysage"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            {/* Télécharger Image PNG */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/10 hidden sm:flex items-center justify-center"
              title="Télécharger l'attestation en image PNG"
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/10"
              title={isFullscreen ? 'Quitter plein écran' : 'Plein Écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Notification Banner */}
        {statusMessage && (
          <div className="print:hidden bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in shadow-inner">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* The Printable A4 Landscape Certificate */}
        <div className="p-2 sm:p-5 bg-slate-100 flex justify-center print:p-0 print:bg-transparent overflow-x-auto">
          <div
            id="printable-certificate"
            className="w-full max-w-[1000px] min-h-[500px] sm:min-h-[540px] p-5 sm:p-7 relative flex flex-col justify-between shadow-2xl text-slate-900 font-serif select-none"
            style={{
              backgroundColor: activeTheme.bgTint,
              border: `5px double ${activeTheme.borderColor}`,
              boxShadow: `0 15px 35px -10px ${activeTheme.borderColor}30`,
            }}
          >
            {/* ========================================================================= */}
            {/* FILIGRANE DU DRAPEAU TUNISIEN (OFFICIAL WATERMARK RÉPUBLIQUE TUNISIENNE)   */}
            {/* ========================================================================= */}
            {showWatermark && (
              <TunisianWatermark
                opacity={watermarkOpacity}
                variant={watermarkVariant}
                size={500}
              />
            )}

            {/* Inner decorative fine frames */}
            <div
              className="absolute inset-2 sm:inset-3 border pointer-events-none"
              style={{ borderColor: `${activeTheme.borderColor}35` }}
            />
            <div
              className="absolute inset-3.5 sm:inset-4.5 border pointer-events-none"
              style={{ borderColor: `${activeTheme.accentColor}25` }}
            />

            {/* ========================================================================= */}
            {/* 1. INSTITUTIONAL HEADER WITH EXACT OFFICIAL LOGOS FROM USER PDF           */}
            {/* ========================================================================= */}
            <div
              className="relative z-10 flex items-start justify-between gap-2 border-b pb-2"
              style={{ borderColor: `${activeTheme.borderColor}30` }}
            >
              {/* Top Left: GSB Tunis Sud circular logo */}
              <div className="flex flex-col items-center justify-center shrink-0 w-16 sm:w-20">
                <img
                  src="/assets/logo_gsb_tunis_sud.png"
                  alt="Groupement de Santé de Base de Tunis Sud"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-xs"
                />
              </div>

              {/* Top Center: Official Text from Republic of Tunisia & Ministry */}
              <div className="text-center space-y-0.5 flex-1 px-2">
                <div className="text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                  RÉPUBLIQUE TUNISIENNE
                </div>
                <div className="text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                  MINISTÈRE DE LA SANTÉ
                </div>
                <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-700 leading-tight">
                  Direction régionale de la Santé de Tunis
                </div>
                <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-700 leading-tight">
                  Groupement de Santé de Base de Tunis Sud •
                </div>
                <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-700 leading-tight">
                  Circonscription Sanitaire de Sijoumi
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-800 leading-tight">
                  Centre Intermédiaire Ali Trad
                </div>
              </div>

              {/* Top Right: Centre Intermédiaire Ali Trad official Arabic logo */}
              <div className="flex flex-col items-center justify-center shrink-0 w-18 sm:w-22">
                <img
                  src="/assets/logo_ali_trad.png"
                  alt="Centre Intermédiaire Ali Trad"
                  className="w-18 h-14 sm:w-20 sm:h-16 object-contain drop-shadow-xs"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. UNITE DE FORMATION PARAMEDICALE CONTINUE & ATTESTATION DE PARTICIPATION*/}
            {/* ========================================================================= */}
            <div className="relative z-10 text-center py-1 space-y-1">
              <div
                className="text-[9.5px] sm:text-[11px] font-extrabold tracking-widest uppercase font-sans"
                style={{ color: activeTheme.primaryColor }}
              >
                UNITE DE FORMATION PARAMÉDICALE CONTINUE
              </div>

              <h1
                className="text-lg sm:text-2xl md:text-[25px] font-black uppercase tracking-wide font-serif py-0.5"
                style={{ color: activeTheme.primaryColor }}
              >
                ATTESTATION DE PARTICIPATION
              </h1>

              <div className="text-[10.5px] sm:text-xs italic font-serif text-slate-600">
                Il est attesté que :
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. PARTICIPANT IDENTITY: EXACT 'Mme /: ______' FORMAT (NO FAKE DATA)       */}
            {/* ========================================================================= */}
            <div className="relative z-10 text-center my-auto py-1 space-y-2 px-3 sm:px-8">
              <div className="text-xs sm:text-sm md:text-base font-serif">
                <span className="font-bold text-slate-800">Mme /: </span>
                {participantFullName ? (
                  <span
                    className="font-extrabold px-3 py-0.5 border-b-2 text-sm sm:text-base md:text-lg tracking-wide uppercase inline-block min-w-[240px] text-center"
                    style={{
                      color: activeTheme.primaryColor,
                      borderColor: activeTheme.borderColor,
                    }}
                  >
                    {participantFullName}
                  </span>
                ) : (
                  <span className="tracking-widest text-slate-400 font-serif select-all">
                    ___________________________________________
                  </span>
                )}
              </div>

              {/* Exact General sentence from official PDF verbatim */}
              <p className="text-[11px] sm:text-xs md:text-[13px] text-slate-700 font-serif leading-relaxed max-w-2xl mx-auto">
                A participé avec assiduité à la session de formation continue consacrée au thème :
              </p>

              {/* ========================================================================= */}
              {/* 4. THEME DE FORMATION MODIFIABLE SELON LES 10 THEMES ABORDES              */}
              {/* ========================================================================= */}
              <div
                className="rounded-xl py-2 px-4 max-w-2xl mx-auto shadow-2xs border transition-all"
                style={{
                  backgroundColor: activeTheme.badgeBg,
                  borderColor: `${activeTheme.borderColor}40`,
                }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ThemeEmblem
                    type={activeTheme.emblemType || 'ambulance_samu'}
                    size={16}
                    color={activeTheme.primaryColor}
                  />
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: activeTheme.primaryColor }}
                  >
                    Thème : {activeTheme.emblemLabel}
                  </span>
                </div>
                <div
                  className="text-xs sm:text-sm md:text-base font-extrabold font-serif leading-snug tracking-tight text-center"
                  style={{ color: activeTheme.primaryColor }}
                >
                  « {currentThemeTitle} »
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. META ROW: DATE, LIEU, ET UNITE DE FORMATION                            */}
            {/* ========================================================================= */}
            <div
              className="relative z-10 grid grid-cols-3 items-center text-center text-[10px] sm:text-xs font-serif border-t pt-2"
              style={{ borderColor: `${activeTheme.borderColor}25` }}
            >
              {/* Date */}
              <div className="text-left font-sans">
                <span className="font-bold text-slate-800">Date: </span>
                <span className="font-mono font-bold tracking-wider" style={{ color: activeTheme.primaryColor }}>
                  ___{dateParts.day}_ / __{dateParts.month}__ / {dateParts.year}
                </span>
              </div>

              {/* Lieu */}
              <div className="text-center font-sans">
                <span className="font-bold text-slate-800">Lieu : </span>
                <span className="font-semibold text-slate-700">Centre Intermédiaire Ali Trad</span>
              </div>

              {/* Unité */}
              <div className="text-right font-sans font-bold text-slate-700 text-[9.5px] sm:text-[11px] leading-tight">
                Unité de<br />Formation Paramédicale Continue
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. BOTTOM ROW: QR CODE & MÉDECIN CHEFFE DE CIRCONSCRIPTION                */}
            {/* ========================================================================= */}
            <div className="relative z-10 pt-2 flex items-end justify-between gap-4 border-t border-slate-200/50">
              {/* Left: Official Reference + QR Code */}
              <div className="flex items-center gap-2.5">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Authentification"
                    className="w-14 h-14 sm:w-16 sm:h-16 border rounded-lg bg-white p-0.5 shadow-xs shrink-0"
                    style={{ borderColor: `${activeTheme.borderColor}40` }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 border rounded-lg bg-white p-1 shadow-xs shrink-0 flex items-center justify-center font-mono text-[9px] text-center"
                    style={{ borderColor: `${activeTheme.borderColor}40`, color: activeTheme.primaryColor }}
                  >
                    QR CODE<br />OFFICIEL
                  </div>
                )}
                <div className="space-y-0.5">
                  <div className="text-[10px] sm:text-[11.5px] font-mono font-bold text-slate-900">
                    Réf. Officielle : <span style={{ color: activeTheme.primaryColor }}>ATT-2026-SIJ</span>
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-slate-500 font-sans">
                    Séance #{activeTheme.seanceNumber} • {activeTheme.shortLabel}
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-emerald-700 font-semibold font-sans flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Authenticité Certifiée GSB Tunis Sud
                  </div>
                </div>
              </div>

              {/* Right: LE MÉDECIN CHEFFE DE CIRCONSCRIPTION SANITAIRE PAR INTÉRIM */}
              <div className="text-right space-y-0.5 font-sans">
                <div className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                  LE MÉDECIN CHEFFE DE CIRCONSCRIPTION
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-800 leading-tight">
                  SANITAIRE PAR INTÉRIM
                </div>
                <div
                  className="text-xs sm:text-sm font-extrabold font-serif pt-0.5 tracking-wide"
                  style={{ color: activeTheme.primaryColor }}
                >
                  Docteur Houidi Yosra Ghorbel
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Helper Bar with Action Buttons */}
        <div className="print:hidden p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Format officiel A4 Paysage (297×210 mm) • Conforme avec QR Code et signature du médecin cheffe.</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Word button */}
            <button
              onClick={handleDownloadWordDocx}
              disabled={isGeneratingWord}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {isGeneratingWord ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-blue-200" />
              )}
              <span>{isGeneratingWord ? 'Création Word...' : 'Télécharger Word (.docx)'}</span>
            </button>

            {/* PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Télécharger PDF (A4 HD)</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'attestation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
