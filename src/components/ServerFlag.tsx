import { cn } from "@/lib/utils";

export default function ServerFlag({
	country_code,
	className,
}: {
	country_code: string;
	className?: string;
}) {
	if (!country_code) return null;

	return (
		<span
			className={cn(
				`fi fi-${country_code.toLowerCase()}`,
				"inline-block shadow-[0_0_0_1px_hsl(var(--border))]",
				className,
			)}
		/>
	);
}
