import { Link } from "@heroui/link";

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

export default function BoutCredits({size = 'md'}: { size?: keyof typeof sizeMap }) {
  return (
    <div className={`${sizeMap[size]} text-foreground opacity-50 space-x-1 shrink-0 flex flex-nowrap text-nowrap`}>
      <span>Creado por</span>

      <Link href='https://bout.sh' isExternal underline='hover' showAnchorIcon color='foreground' className={`${sizeMap[size]}`}>
        Bout
      </Link>
    </div>
  );
}
