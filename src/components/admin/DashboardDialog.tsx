"use client";
import { useEffect,useRef } from "react";
import type { ReactNode } from "react";
export default function DashboardDialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}):React.JSX.Element {
 const ref=useRef<HTMLDialogElement>(null); const close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{const dialog=ref.current;const previous=document.activeElement as HTMLElement|null;dialog?.showModal();const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{dialog?.close();document.body.style.overflow=old;previous?.focus();};},[]);
 return <dialog ref={ref} aria-labelledby="dashboard-dialog-title" onCancel={e=>{e.preventDefault();close.current();}} className="fixed inset-0 m-auto max-h-dvh w-full max-w-2xl overflow-y-auto rounded-none border border-charcoal-border bg-charcoal p-5 text-offwhite shadow-floating backdrop:bg-charcoal-darkest/80 sm:max-h-[90dvh] sm:rounded-xl sm:p-8"><header className="mb-6 flex items-center justify-between gap-4"><h2 id="dashboard-dialog-title" className="font-serif text-2xl">{title}</h2><button type="button" onClick={onClose} className="min-h-11 px-3 text-sm text-offwhite-muted">Tutup</button></header>{children}</dialog>;
}
