import { markdownBlocksToExportHtml } from '@/utils/exportMarkdownHtml';

export type ExportFormat = 'txt' | 'doc' | 'pdf';

export interface ExportBlock {
  /** 块标题（可选） */
  title?: string;
  /** 正文行，空行会保留段落间距 */
  body: string;
}

function safeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'export';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 延迟释放，避免部分浏览器在大文件导出时下载被中断
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function blocksToPlainText(blocks: ExportBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.title) parts.push(block.title, '='.repeat(Math.min(block.title.length, 40)), '');
    parts.push(block.body.trimEnd());
    parts.push('');
  }
  return parts.join('\n').trimEnd() + '\n';
}

/** 导出为 TXT */
export async function exportAsTxt(blocks: ExportBlock[], baseName: string): Promise<void> {
  const text = blocksToPlainText(blocks);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${safeFilename(baseName)}.txt`);
}

/** 导出为 Word (.docx)，识别 Markdown 标题与 base64 图片 */
export async function exportAsDoc(blocks: ExportBlock[], baseName: string): Promise<void> {
  const { Document, Packer } = await import('docx');
  const { markdownBlocksToDocxChildren } = await import('@/utils/exportDocxMarkdown');

  const children = await markdownBlocksToDocxChildren(blocks);
  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeFilename(baseName)}.docx`);
}

/** 导出为 PDF（渲染 Markdown 排版，接近在线编辑器导出效果） */
export async function exportAsPdf(blocks: ExportBlock[], baseName: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const host = document.createElement('div');
  host.innerHTML = markdownBlocksToExportHtml(blocks);
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(`${safeFilename(baseName)}.pdf`);
  } finally {
    host.remove();
  }
}

/** 按格式导出 */
export async function exportRecord(
  format: ExportFormat,
  blocks: ExportBlock[],
  baseName: string
): Promise<void> {
  switch (format) {
    case 'txt':
      await exportAsTxt(blocks, baseName);
      break;
    case 'doc':
      await exportAsDoc(blocks, baseName);
      break;
    case 'pdf':
      await exportAsPdf(blocks, baseName);
      break;
  }
}
