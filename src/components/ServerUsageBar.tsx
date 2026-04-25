import { Progress } from "@/components/ui/progress";

type ServerUsageBarProps = {
	value: number;
};

export default function ServerUsageBar({ value }: ServerUsageBarProps) {
	return (
		<Progress
			aria-label={"Server Usage Bar"}
			aria-labelledby={"Server Usage Bar"}
			value={value}
			indicatorClassName={
				value > 90
					? "bg-status-offline"
					: value > 70
						? "bg-status-warning"
						: "bg-status-online"
			}
			className={"h-[3px] rounded-sm"}
		/>
	);
}
