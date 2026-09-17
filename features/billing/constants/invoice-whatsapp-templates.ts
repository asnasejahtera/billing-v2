// ============================================================================
// Invoice WhatsApp Templates
// ============================================================================

export const invoiceWhatsAppTemplates = [
  {
    id: "OVERDUE_DEFAULT",
    name: "Tunggakan Pembayaran",
    body: `Yth. Bapak/Ibu {{nama}},

Kami menginformasikan bahwa tagihan {{invoice}} telah melewati tanggal jatuh tempo.

Jatuh tempo: {{jatuh_tempo}}
Sisa tagihan: {{sisa_tagihan}}

Mohon segera melakukan pembayaran.

Terima kasih.`,
  },
  {
    id: "OVERDUE_SHORT",
    name: "Tunggakan Singkat",
    body: `Yth. Bapak/Ibu {{nama}},

Tagihan {{invoice}} sebesar {{sisa_tagihan}} telah melewati jatuh tempo {{jatuh_tempo}}.

Mohon segera melakukan pembayaran. Terima kasih.`,
  },
  {
    id: "OVERDUE_REMINDER",
    name: "Pengingat Pembayaran",
    body: `Halo Bapak/Ibu {{nama}},

Kami mengingatkan bahwa invoice {{invoice}} masih memiliki sisa pembayaran {{sisa_tagihan}} dan telah jatuh tempo pada {{jatuh_tempo}}.

Mohon melakukan pembayaran secepatnya.

Terima kasih.`,
  },
] as const;

export type InvoiceWhatsAppTemplateId =
  (typeof invoiceWhatsAppTemplates)[number]["id"];

export const defaultInvoiceWhatsAppTemplate =
  invoiceWhatsAppTemplates[0];