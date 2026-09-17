import {
  findInvoiceForMutation,
  updateInvoiceById,
  voidInvoiceById,
} from "../repositories/invoice.repository";
import type {
  DeleteInvoiceInput,
  EditInvoiceInput,
} from "../schemas/invoice-mutation.schema";

// ============================================================================
// Guard Invoice
// ============================================================================

async function getEditableInvoice(
  id: number,
) {
  const invoice =
    await findInvoiceForMutation(
      id,
    );

  if (!invoice) {
    throw new Error(
      "Invoice tidak ditemukan.",
    );
  }

  if (
    invoice.status !== "UNPAID"
  ) {
    throw new Error(
      `Invoice ${invoice.status} tidak dapat diubah atau dihapus.`,
    );
  }

  return invoice;
}

// ============================================================================
// Edit Invoice
// ============================================================================

export async function editInvoiceService(
  input: EditInvoiceInput,
) {
  await getEditableInvoice(
    input.id,
  );

  const updated =
    await updateInvoiceById(
      input.id,
      {
        description:
          input.description,
        total:
          input.amount.toFixed(2),
        invoiceDate:
          input.invoiceDate,
        dueDate:
          input.dueDate,
        notes:
          input.notes || null,
      },
    );

  if (!updated) {
    throw new Error(
      "Invoice gagal diperbarui.",
    );
  }

  return updated;
}

// ============================================================================
// Delete Invoice
// ============================================================================

export async function deleteInvoiceService(
  input: DeleteInvoiceInput,
) {
  await getEditableInvoice(
    input.id,
  );

  const deleted =
    await voidInvoiceById(
      input.id,
      input.reason,
    );

  if (!deleted) {
    throw new Error(
      "Invoice gagal dihapus.",
    );
  }

  return deleted;
}