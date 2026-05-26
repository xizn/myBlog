import type { ExportBlock } from '@/utils/exportRecord';
import {
  MARKDOWN_IMAGE_INLINE_RE,
  MARKDOWN_IMAGE_LINE_RE,
  exportImageCaption,
  measureDataImageSizeForExport,
  MAX_DOCX_IMAGE_BYTES,
  parseDataImageUrl,
  stripCherryAltLeakFromText,
} from '@/utils/markdownImageData';

type DocxHeadingLevel = (typeof import('docx'))['HeadingLevel'][keyof (typeof import('docx'))['HeadingLevel']];

type DocxParagraph = InstanceType<(typeof import('docx'))['Paragraph']>;

type MarkdownLinePiece =
  | { kind: 'text'; text: string }
  | { kind: 'image'; alt: string; dataUrl: string };

function splitLineIntoPieces(line: string): MarkdownLinePiece[] {
  const imageOnly = line.match(MARKDOWN_IMAGE_LINE_RE);
  if (imageOnly) {
    return [{ kind: 'image', alt: imageOnly[1]!, dataUrl: imageOnly[2]! }];
  }

  const pieces: MarkdownLinePiece[] = [];
  let lastIndex = 0;
  const re = new RegExp(MARKDOWN_IMAGE_INLINE_RE.source, MARKDOWN_IMAGE_INLINE_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      pieces.push({ kind: 'text', text: line.slice(lastIndex, start) });
    }
    pieces.push({ kind: 'image', alt: match[1]!, dataUrl: match[2]! });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < line.length) {
    const tail = stripCherryAltLeakFromText(line.slice(lastIndex));
    if (tail) pieces.push({ kind: 'text', text: tail });
  }
  if (pieces.length === 0) {
    pieces.push({ kind: 'text', text: line });
  }
  return pieces;
}

function headingParagraph(
  Paragraph: typeof import('docx').Paragraph,
  text: string,
  level: DocxHeadingLevel,
  spacingAfter: number
): DocxParagraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { after: spacingAfter },
  });
}

function textParagraph(
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  text: string
): DocxParagraph {
  if (!text) return new Paragraph({ text: '' });
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 120 },
  });
}

async function imageParagraph(
  Paragraph: typeof import('docx').Paragraph,
  ImageRun: typeof import('docx').ImageRun,
  TextRun: typeof import('docx').TextRun,
  alt: string,
  dataUrl: string
): Promise<DocxParagraph | null> {
  const parsed = parseDataImageUrl(dataUrl);
  if (!parsed) return null;
  if (parsed.bytes.byteLength > MAX_DOCX_IMAGE_BYTES) {
    const label = exportImageCaption(alt);
    return new Paragraph({
      children: [
        new TextRun({
          text: label
            ? `（图片过大未嵌入 Word：${label}，请在应用内查看）`
            : '（图片过大未嵌入 Word，请在应用内查看）',
          italics: true,
        }),
      ],
      spacing: { after: 160 },
    });
  }

  const size = await measureDataImageSizeForExport(dataUrl);
  const label = exportImageCaption(alt);
  const children: InstanceType<typeof ImageRun | typeof TextRun>[] = [
    new ImageRun({
      type: parsed.extension,
      data: parsed.bytes,
      transformation: size,
    }),
  ];
  if (label) {
    children.push(new TextRun({ break: 1 }), new TextRun({ text: label, italics: true, size: 20 }));
  }
  return new Paragraph({ children, spacing: { after: 160 } });
}

async function lineToParagraphs(
  line: string,
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  ImageRun: typeof import('docx').ImageRun,
  HeadingLevel: typeof import('docx').HeadingLevel
): Promise<DocxParagraph[]> {
  const h3 = line.match(/^###\s+(.+)/);
  if (h3) {
    return [headingParagraph(Paragraph, h3[1]!, HeadingLevel.HEADING_3, 120)];
  }
  const h2 = line.match(/^##\s+(.+)/);
  if (h2) {
    return [headingParagraph(Paragraph, h2[1]!, HeadingLevel.HEADING_2, 160)];
  }
  const h1 = line.match(/^#\s+(.+)/);
  if (h1) {
    return [headingParagraph(Paragraph, h1[1]!, HeadingLevel.HEADING_1, 200)];
  }
  if (!line.trim()) return [new Paragraph({ text: '' })];

  const pieces = splitLineIntoPieces(line);
  const onlyImage =
    pieces.length === 1 && pieces[0]?.kind === 'image' ? (pieces[0] as Extract<MarkdownLinePiece, { kind: 'image' }>) : null;
  if (onlyImage) {
    const imagePara = await imageParagraph(
      Paragraph,
      ImageRun,
      TextRun,
      onlyImage.alt,
      onlyImage.dataUrl
    );
    return imagePara ? [imagePara] : [textParagraph(Paragraph, TextRun, line)];
  }

  const paragraphs: DocxParagraph[] = [];
  let textBuffer = '';
  for (const piece of pieces) {
    if (piece.kind === 'text') {
      textBuffer += stripCherryAltLeakFromText(piece.text);
      continue;
    }
    if (textBuffer.trim()) {
      paragraphs.push(textParagraph(Paragraph, TextRun, textBuffer));
      textBuffer = '';
    }
    const imagePara = await imageParagraph(Paragraph, ImageRun, TextRun, piece.alt, piece.dataUrl);
    if (imagePara) paragraphs.push(imagePara);
  }
  if (textBuffer.trim() || paragraphs.length === 0) {
    paragraphs.push(textParagraph(Paragraph, TextRun, textBuffer || line));
  }
  return paragraphs;
}

/** 将导出块转为 docx 段落（识别标题与 base64 图片） */
export async function markdownBlocksToDocxChildren(
  blocks: ExportBlock[]
): Promise<DocxParagraph[]> {
  const { HeadingLevel, Paragraph, TextRun, ImageRun } = await import('docx');
  const children: DocxParagraph[] = [];

  for (const block of blocks) {
    if (block.title) {
      children.push(
        new Paragraph({
          text: block.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 240 },
        })
      );
    }
    for (const line of block.body.split(/\r?\n/)) {
      const lineParas = await lineToParagraphs(line, Paragraph, TextRun, ImageRun, HeadingLevel);
      children.push(...lineParas);
    }
    children.push(new Paragraph({ text: '' }));
  }

  return children;
}
