import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import type { IconType } from "react-icons";
import {
  FiCheck,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiSend,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

export type TableActionVariant =
  | "view"
  | "edit"
  | "delete"
  | "send"
  | "download"
  | "reject"
  | "success"
  | "muted";

interface ActionVisualProps {
  children: ReactNode;
  variant: TableActionVariant;
  className?: string;
  icon?: IconType;
  hideIcon?: boolean;
}

interface TableActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ActionVisualProps {}

interface TableActionLinkProps extends ActionVisualProps {
  href: string;
}

interface TableActionAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">,
    ActionVisualProps {
  href: string;
}

const variantClassMap: Record<TableActionVariant, string> = {
  view: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  edit: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  delete: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  send: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  download: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  reject: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  success: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
  muted: "border-slate-200 bg-slate-50 text-slate-400",
};

const variantIconMap: Record<TableActionVariant, IconType> = {
  view: FiEye,
  edit: FiEdit2,
  delete: FiTrash2,
  send: FiSend,
  download: FiDownload,
  reject: FiXCircle,
  success: FiCheck,
  muted: FiFileText,
};

function ActionContent({ children, variant, icon, hideIcon }: ActionVisualProps) {
  const Icon = icon || variantIconMap[variant];

  return (
    <>
      {!hideIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{children}</span>
    </>
  );
}

function actionClassName(variant: TableActionVariant, className?: string, disabled?: boolean) {
  return cn(
    "inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold leading-none whitespace-nowrap shadow-sm transition-colors duration-150",
    variantClassMap[variant],
    disabled && "cursor-not-allowed opacity-60",
    className
  );
}

export function TableActionGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("inline-flex items-center justify-center gap-1.5 whitespace-nowrap", className)}>{children}</div>;
}

export function TableActionButton({
  children,
  variant,
  className,
  icon,
  hideIcon,
  disabled,
  ...buttonProps
}: TableActionButtonProps) {
  return (
    <button
      {...buttonProps}
      disabled={disabled}
      className={actionClassName(variant, cn("disabled:cursor-not-allowed disabled:opacity-60", className), disabled)}
    >
      <ActionContent variant={variant} icon={icon} hideIcon={hideIcon} className={className}>
        {children}
      </ActionContent>
    </button>
  );
}

export function TableActionLink({ children, variant, href, className, icon, hideIcon }: TableActionLinkProps) {
  return (
    <Link href={href} className={actionClassName(variant, className)}>
      <ActionContent variant={variant} icon={icon} hideIcon={hideIcon} className={className}>
        {children}
      </ActionContent>
    </Link>
  );
}

export function TableActionAnchor({
  children,
  variant,
  href,
  className,
  icon,
  hideIcon,
  ...anchorProps
}: TableActionAnchorProps) {
  return (
    <a href={href} className={actionClassName(variant, className)} {...anchorProps}>
      <ActionContent variant={variant} icon={icon} hideIcon={hideIcon} className={className}>
        {children}
      </ActionContent>
    </a>
  );
}

export function TableActionMuted({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={actionClassName("muted", className)}>
      <ActionContent variant="muted">{children}</ActionContent>
    </span>
  );
}
