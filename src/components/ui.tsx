import { clsx } from 'clsx';
import { ReactNode } from 'react';

// Small building blocks mirroring the mobile app widgets (gi_card.dart,
// admin_ui.dart), for pages to compose the same look.

/** An icon from the app's Figma set (public/brand/icons), tinted with currentColor. */
export function AppIcon({ name, className }: { name: string; className?: string }) {
  const url = `url(/brand/icons/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={clsx('inline-block bg-current', className)}
      style={{ WebkitMaskImage: url, maskImage: url, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }}
    />
  );
}

/** GiCard — flat surface, 1px border, radius 16, padding 16. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-2xl border border-gi-card-border bg-gi-card p-4', className)}>{children}</div>;
}

/** AdminPageHeader — title (greeting size when large), subtitle, actions. */
export function PageHeader({
  title,
  subtitle,
  large,
  actions,
}: {
  title: string;
  subtitle?: string;
  large?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <h1 className={clsx('truncate font-semibold leading-tight', large ? 'text-2xl text-brand-navy' : 'text-xl text-gi-body')}>
          {title}
        </h1>
        {subtitle && <p className="mt-[3px] truncate text-[13px] text-gi-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** AdminSectionTitle — 17 SemiBold, optional count pill. */
export function SectionTitle({ title, count, action }: { title: string; count?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="truncate text-[17px] font-semibold text-gi-body">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-gi-field px-2 py-0.5 text-xs font-semibold text-gi-muted">{count}</span>
      )}
      <div className="flex-1" />
      {action}
    </div>
  );
}

/** AdminStatTile — tinted icon chip, big value, label. */
export function StatTile({
  icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  accent: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
      >
        {icon}
      </div>
      <p className="mt-3 truncate text-[26px] font-semibold leading-tight text-gi-body">{value}</p>
      <p className="mt-0.5 truncate text-[13px] text-gi-muted">{label}</p>
      {hint && (
        <p className="mt-1 truncate text-[11px]" style={{ color: accent }}>
          {hint}
        </p>
      )}
    </Card>
  );
}

/** Square header button — AdminSquareButton (40, radius 12). */
export const squareButton =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.02] bg-black/5 text-gi-body transition-transform hover:bg-black/[0.08] active:scale-[0.88]';

/** Primary CTA — GiPrimaryButton: amber pill, black label. */
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand-amber px-5 py-2.5 text-sm font-medium text-black transition-all hover:brightness-95 active:scale-[0.97] disabled:bg-[#dedbd5] disabled:text-[#b2b2b2]';

/** Secondary button — card surface pill. */
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-gi-card-border bg-gi-card px-4 py-2.5 text-sm font-medium text-gi-body transition-all hover:bg-slate-100 active:scale-[0.97]';
