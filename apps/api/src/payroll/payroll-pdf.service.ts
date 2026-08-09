import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_MARGIN = 40;
const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const DATETIME_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const MXN_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  UNDER_REVIEW: 'En revisión',
  LOCKED: 'Bloqueado',
  APPLIED: 'Aplicado',
  CLOSED: 'Cerrado',
  REOPENED: 'Reabierto',
};

function money(cents: number): string {
  return MXN_FORMATTER.format(cents / 100);
}

interface BatchForPdf {
  id: string;
  status: string;
  totalPlannedCents: number;
  totalAppliedCents: number;
  createdAt: Date;
  appliedAt: Date | null;
  period: { startsAt: Date; endsAt: Date; payDate: Date; frequency: string };
  branch: { name: string } | null;
  items: {
    id: string;
    employeeId: string;
    balanceAtPrepCents: number;
    plannedAmountCents: number;
    appliedAmountCents: number;
    balanceAfterCents: number | null;
    ledgerMovementId: string | null;
    employee: {
      displayName: string;
      employeeNumber: string;
      jobTitle: string | null;
      primaryBranch: { name: string };
    };
  }[];
}

/**
 * Exportación PDF de un lote de nómina (§Fase 5, a petición explícita del
 * usuario). Muestra únicamente lo que el sistema realmente controla: datos
 * de la empresa, identidad del empleado, y el detalle de los cargos que se
 * le están descontando por categoría — nunca sueldo/bonos/ISR/IMSS, que
 * están fuera de alcance del proyecto (§1). El desglose por categoría sale
 * de `SettlementAllocation` cuando el lote ya se aplicó (asignación real);
 * si aún no se aplica, se marca como "vista previa" y sale del saldo
 * pendiente actual por categoría.
 */
@Injectable()
export class PayrollPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(organizationId: string, batch: BatchForPdf): Promise<Buffer> {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        name: true,
        currency: true,
        timezone: true,
        primaryColor: true,
      },
    });

    const breakdowns = new Map<
      string,
      { label: string; amountCents: number }[]
    >();
    for (const item of batch.items) {
      breakdowns.set(
        item.id,
        await this.categoryBreakdownForItem(organizationId, item),
      );
    }

    return new Promise((resolve, reject) => {
      // bufferPages: true es obligatorio para poder recorrer las páginas ya
      // generadas al final (renderFooter con switchToPage) — sin esto,
      // pdfkit "vacía" cada página apenas se crea la siguiente, y volver a
      // ella con switchToPage crea una página nueva en blanco en vez de
      // reutilizarla.
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: PAGE_MARGIN,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderHeader(doc, organization, batch);
      this.renderSummaryTable(doc, batch);
      this.renderPerEmployeeDetail(doc, batch, breakdowns);
      this.renderFooter(doc, organization);

      doc.end();
    });
  }

  private renderHeader(
    doc: PDFKit.PDFDocument,
    organization: {
      name: string;
      currency: string;
      timezone: string;
      primaryColor: string;
    },
    batch: BatchForPdf,
  ) {
    doc.rect(0, 0, doc.page.width, 70).fill(organization.primaryColor);
    doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(organization.name, PAGE_MARGIN, 22);
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Libreta de Nóminas — reporte de lote de nómina', PAGE_MARGIN, 44);

    doc.fillColor('#10203f').fontSize(9).moveDown(3);

    const periodLabel = `${DATE_FORMAT.format(batch.period.startsAt)} – ${DATE_FORMAT.format(batch.period.endsAt)}`;
    const rows: [string, string][] = [
      ['Periodo', periodLabel],
      [
        'Frecuencia',
        batch.period.frequency === 'WEEKLY' ? 'Semanal' : 'Quincenal',
      ],
      ['Fecha de pago', DATE_FORMAT.format(batch.period.payDate)],
      ['Sucursal', batch.branch ? batch.branch.name : 'Todas las sucursales'],
      ['Estado del lote', STATUS_LABELS[batch.status] ?? batch.status],
    ];
    let y = 90;
    for (const [label, value] of rows) {
      doc
        .font('Helvetica-Bold')
        .text(`${label}:`, PAGE_MARGIN, y, { continued: true });
      doc.font('Helvetica').text(` ${value}`);
      y += 14;
    }
    doc.moveDown(1);
  }

  private renderSummaryTable(doc: PDFKit.PDFDocument, batch: BatchForPdf) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).text('Resumen del lote');
    doc.moveDown(0.3);

    const columns = [
      { label: 'Empleado', width: 160 },
      { label: 'Puesto', width: 100 },
      { label: 'Saldo al preparar', width: 85 },
      { label: 'Planeado', width: 75 },
      { label: 'Aplicado', width: 75 },
    ];
    const startX = PAGE_MARGIN;
    let y = doc.y + 4;

    doc.font('Helvetica-Bold').fontSize(8);
    let x = startX;
    for (const col of columns) {
      doc.text(col.label, x, y, { width: col.width });
      x += col.width;
    }
    y += 14;
    doc.moveTo(startX, y).lineTo(x, y).strokeColor('#dce5f3').stroke();
    y += 4;

    doc.font('Helvetica').fontSize(8);
    for (const item of batch.items) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      x = startX;
      const cells = [
        `${item.employee.displayName} (${item.employee.employeeNumber})`,
        item.employee.jobTitle ?? '—',
        money(item.balanceAtPrepCents),
        money(item.plannedAmountCents),
        item.appliedAmountCents > 0 ? money(item.appliedAmountCents) : '—',
      ];
      for (let i = 0; i < cells.length; i++) {
        doc.text(cells[i], x, y, { width: columns[i].width });
        x += columns[i].width;
      }
      y += 16;
    }

    y += 4;
    doc.moveTo(startX, y).lineTo(x, y).strokeColor('#dce5f3').stroke();
    y += 6;
    doc.font('Helvetica-Bold');
    x = startX;
    const totals = [
      'Total',
      '',
      money(batch.items.reduce((s, i) => s + i.balanceAtPrepCents, 0)),
      money(batch.totalPlannedCents),
      money(batch.totalAppliedCents),
    ];
    for (let i = 0; i < totals.length; i++) {
      doc.text(totals[i], x, y, { width: columns[i].width });
      x += columns[i].width;
    }
    doc.y = y + 20;
  }

  private renderPerEmployeeDetail(
    doc: PDFKit.PDFDocument,
    batch: BatchForPdf,
    breakdowns: Map<string, { label: string; amountCents: number }[]>,
  ) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(11).text('Detalle por empleado');
    doc.moveDown(0.5);

    for (const item of batch.items) {
      if (doc.y > doc.page.height - 140) doc.addPage();

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#10203f');
      doc.text(
        `${item.employee.displayName}  ·  ${item.employee.employeeNumber}`,
      );
      doc.font('Helvetica').fontSize(8).fillColor('#66738c');
      doc.text(
        `${item.employee.jobTitle ?? 'Sin puesto'} · ${item.employee.primaryBranch.name}`,
      );
      doc.moveDown(0.2);

      const isApplied = Boolean(item.ledgerMovementId);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(isApplied ? '#0dbd5b' : '#ff8a1f')
        .text(
          isApplied
            ? `Aplicado: ${money(item.appliedAmountCents)} — saldo restante ${money(item.balanceAfterCents ?? 0)}`
            : `Vista previa (aún no aplicado) — planeado: ${money(item.plannedAmountCents)}`,
        );
      doc.fillColor('#10203f').moveDown(0.3);

      const breakdown = breakdowns.get(item.id) ?? [];
      if (breakdown.length === 0) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#66738c')
          .text('Sin cargos registrados.');
      } else {
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('Categoría', PAGE_MARGIN, doc.y, {
          continued: true,
          width: 300,
        });
        doc.text('Monto', { align: 'right' });
        doc.font('Helvetica').fontSize(8);
        for (const row of breakdown) {
          doc.text(row.label, PAGE_MARGIN, doc.y, {
            continued: true,
            width: 300,
          });
          doc.text(money(row.amountCents), { align: 'right' });
        }
      }
      doc.moveDown(1);
      doc
        .moveTo(PAGE_MARGIN, doc.y)
        .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
        .strokeColor('#f3f7fd')
        .stroke();
      doc.moveDown(0.6);
    }
  }

  private renderFooter(
    doc: PDFKit.PDFDocument,
    organization: { timezone: string },
  ) {
    const range = doc.bufferedPageRange();
    const text = (page: number) =>
      `Generado el ${DATETIME_FORMAT.format(new Date())} (${organization.timezone}) — no calcula sueldo, ISR ni IMSS. Página ${page} de ${range.count}.`;

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      // Escribir dentro del margen inferior dispara un salto de página
      // automático en pdfkit (interpreta que el contenido no cupo) — se
      // anula el margen momentáneamente solo para este trazo del pie.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#66738c')
        .text(text(i + 1), PAGE_MARGIN, doc.page.height - 30, {
          width: doc.page.width - PAGE_MARGIN * 2,
          align: 'center',
          lineBreak: false,
        });
      doc.page.margins.bottom = bottomMargin;
    }
  }

  private async categoryBreakdownForItem(
    organizationId: string,
    item: BatchForPdf['items'][number],
  ): Promise<{ label: string; amountCents: number }[]> {
    if (item.ledgerMovementId) {
      const allocations = await this.prisma.settlementAllocation.findMany({
        where: { creditMovementId: item.ledgerMovementId },
        select: {
          allocatedCents: true,
          sourceMovement: { select: { category: { select: { label: true } } } },
        },
      });
      const totals = new Map<string, number>();
      for (const allocation of allocations) {
        const label = allocation.sourceMovement.category.label;
        totals.set(label, (totals.get(label) ?? 0) + allocation.allocatedCents);
      }
      return [...totals.entries()]
        .map(([label, amountCents]) => ({ label, amountCents }))
        .sort((a, b) => b.amountCents - a.amountCents);
    }

    const grouped = await this.prisma.ledgerMovement.groupBy({
      by: ['categoryId'],
      where: {
        organizationId,
        employeeId: item.employeeId,
        direction: 'CHARGE',
        status: 'POSTED',
      },
      _sum: { amountCents: true },
    });
    if (grouped.length === 0) return [];
    const categories = await this.prisma.movementCategory.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
      select: { id: true, label: true },
    });
    return grouped
      .map((g) => ({
        label: categories.find((c) => c.id === g.categoryId)?.label ?? 'Otro',
        amountCents: g._sum.amountCents ?? 0,
      }))
      .sort((a, b) => b.amountCents - a.amountCents);
  }
}
