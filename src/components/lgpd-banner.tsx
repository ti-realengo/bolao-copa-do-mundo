"use client";

import { useEffect, useState } from "react";

const KEY = "bolao_lgpd_acknowledged_v1";

export function LgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShow(localStorage.getItem(KEY) !== "1");
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-card border-t border-brand-border p-4 shadow-lg">
      <div className="container flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-sm text-brand-text-muted">
          Usamos cookies essenciais (sessão e preferências) e logs com IP em hash para auditoria.
          Ao continuar, você concorda com a{" "}
          <a href="/privacidade" className="underline text-brand-text">política de privacidade</a>{" "}
          e os{" "}
          <a href="/termos" className="underline text-brand-text">termos de uso</a>.
        </p>
        <button
          className="bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-xl shrink-0"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setShow(false);
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
