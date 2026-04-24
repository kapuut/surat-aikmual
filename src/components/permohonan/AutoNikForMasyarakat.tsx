"use client";

import { useEffect } from "react";

type VerifyResponse = {
  user?: {
    nik?: string;
    role?: string;
  };
};

const ADDRESS_DEFAULTS = {
  desa: "Aikmual",
  kecamatan: "Praya",
  kabupaten: "Lombok Tengah",
  provinsi: "Indonesia",
} as const;

function normalizeNik(nik?: string): string {
  if (!nik) return "";
  return nik.split("_")[0]?.trim() || "";
}

function applyNikAutofill(nik: string) {
  if (!nik) return;

  const nikInputs = document.querySelectorAll<HTMLInputElement>('input[name="nik"]');

  nikInputs.forEach((input) => {
    // Autofill hanya sekali per input agar user tetap bisa mengedit manual.
    if (input.dataset.autoNikFilled === "true") {
      return;
    }

    const currentValue = input.value.trim();
    if (!currentValue) {
      input.value = nik;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    input.dataset.autoNikFilled = "true";
    input.autocomplete = "off";
  });
}

function getAddressDefaultByFieldName(fieldName: string): string {
  const normalized = (fieldName || "").replace(/[^a-zA-Z]/g, "").toLowerCase();

  if (!normalized || normalized.startsWith("dusun")) {
    return "";
  }

  if (normalized.startsWith("desa")) {
    return ADDRESS_DEFAULTS.desa;
  }

  if (normalized.startsWith("kecamatan")) {
    return ADDRESS_DEFAULTS.kecamatan;
  }

  if (normalized.startsWith("kabupaten") || normalized.startsWith("kota")) {
    return ADDRESS_DEFAULTS.kabupaten;
  }

  if (normalized.startsWith("provinsi")) {
    return ADDRESS_DEFAULTS.provinsi;
  }

  return "";
}

function applyAddressAutofill() {
  const addressFields = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input[name], select[name], textarea[name]'
  );

  addressFields.forEach((field) => {
    if (field.dataset.autoAddressFilled === "true") {
      return;
    }

    const defaultValue = getAddressDefaultByFieldName(field.name);
    if (!defaultValue) {
      return;
    }

    const currentValue = (field.value || "").trim();
    if (!currentValue) {
      field.value = defaultValue;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    field.dataset.autoAddressFilled = "true";
  });
}

export default function AutoNikForMasyarakat() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    const bootstrap = async () => {
      try {
        const response = await fetch("/api/auth/verify", { credentials: "include" });
        if (!response.ok) return;

        const data = (await response.json()) as VerifyResponse;
        const role = data?.user?.role || "";
        const nik = normalizeNik(data?.user?.nik);

        if (role !== "masyarakat" || !nik) return;

        applyNikAutofill(nik);
        applyAddressAutofill();

        observer = new MutationObserver(() => {
          applyNikAutofill(nik);
          applyAddressAutofill();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch {
        // Ignore autofill errors for unauthenticated access.
      }
    };

    bootstrap();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return null;
}
