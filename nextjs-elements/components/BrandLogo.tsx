import Link from "next/link";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Link className={`brand brand-logo-link ${className}`.trim()} href="/" aria-label="Knoplus home">
      KNOPLUS
    </Link>
  );
}
