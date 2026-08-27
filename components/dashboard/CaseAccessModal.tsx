"use client";

import { useEffect, useState } from "react";
import type { Case } from "@/lib/api/caseTypes";
import { MagicLinkAccessPanel } from "@/components/dashboard/MagicLinkAccessPanel";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  caseData: Case | null;
  onClose: () => void;
  onCaseUpdated?: (patch: Partial<Case>) => void;
};

export function CaseAccessModal({ open, caseData, onClose, onCaseUpdated }: Props) {
  const [clientPhoneInput, setClientPhoneInput] = useState("");

  useEffect(() => {
    if (open && caseData) {
      setClientPhoneInput(caseData.clientPhone?.trim() ?? "");
    }
  }, [open, caseData]);

  if (!caseData) return null;

  const slice = {
    id: caseData.id,
    clientName: caseData.clientName,
    clientEmail: caseData.clientEmail ?? caseData.email ?? "",
    magicToken: caseData.magicToken,
    magicLinkToken: caseData.magicLinkToken,
    magicExpiresAt: caseData.magicExpiresAt,
    clientPhone: caseData.clientPhone,
    magicLinkUrl: caseData.magicLinkUrl,
  };

  return (
    <Modal open={open} onClose={onClose} title="Acceso del cliente" size="lg">
      <MagicLinkAccessPanel
        caseData={slice}
        clientPhoneInput={clientPhoneInput}
        onClientPhoneChange={setClientPhoneInput}
        onCaseUpdated={(patch) => onCaseUpdated?.(patch as Partial<Case>)}
      />
    </Modal>
  );
}
