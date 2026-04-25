import {
	ArrowDownCircleIcon,
	ArrowUpCircleIcon,
} from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { useStatus } from "@/hooks/use-status";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type ServerOverviewProps = {
	online: number;
	offline: number;
	total: number;
	up: number;
	down: number;
	upSpeed: number;
	downSpeed: number;
};

export default function ServerOverview({
	online,
	offline,
	total,
	up,
	down,
	upSpeed,
	downSpeed,
}: ServerOverviewProps) {
	const { t } = useTranslation();
	const { status, setStatus } = useStatus();

	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	return (
		<section className="grid grid-cols-2 gap-4 lg:grid-cols-4 server-overview">
			<Card
				onClick={() => {
					setStatus("all");
				}}
				className={cn("cursor-pointer transition-all hover:border-primary", {
					"bg-card/70": customBackgroundImage,
				})}
			>
				<CardContent className="flex h-full items-center px-6 py-3">
					<section className="flex flex-col gap-1">
						<p className="font-serif text-[1.05rem] font-medium leading-tight tracking-normal">
							{t("serverOverview.totalServers")}
						</p>
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="relative inline-flex h-2 w-2 rounded-full bg-status-info"></span>
							</span>
							<div className="text-lg font-medium tabular-nums">{total}</div>
						</div>
					</section>
				</CardContent>
			</Card>
			<Card
				onClick={() => {
					setStatus("online");
				}}
				className={cn(
					"cursor-pointer ring-1 ring-transparent transition-all hover:ring-status-online",
					{
						"bg-card/70": customBackgroundImage,
					},
					{
						"ring-status-online ring-2 border-transparent": status === "online",
					},
				)}
			>
				<CardContent className="flex h-full items-center px-6 py-3">
					<section className="flex flex-col gap-1">
						<p className="font-serif text-[1.05rem] font-medium leading-tight tracking-normal">
							{t("serverOverview.onlineServers")}
						</p>
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-status-online"></span>
							</span>

							<div className="text-lg font-medium tabular-nums">{online}</div>
						</div>
					</section>
				</CardContent>
			</Card>
			<Card
				onClick={() => {
					setStatus("offline");
				}}
				className={cn(
					"cursor-pointer ring-1 ring-transparent transition-all hover:ring-status-offline",
					{
						"bg-card/70": customBackgroundImage,
					},
					{
						"ring-status-offline ring-2 border-transparent":
							status === "offline",
					},
				)}
			>
				<CardContent className="flex h-full items-center px-6 py-3">
					<section className="flex flex-col gap-1">
						<p className="font-serif text-[1.05rem] font-medium leading-tight tracking-normal">
							{t("serverOverview.offlineServers")}
						</p>
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-offline opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-status-offline"></span>
							</span>
							<div className="text-lg font-medium tabular-nums">{offline}</div>
						</div>
					</section>
				</CardContent>
			</Card>
			<Card
				className={cn(
					"ring-1 ring-transparent transition-all hover:ring-primary",
					{
						"bg-card/70": customBackgroundImage,
					},
				)}
			>
				<CardContent className="flex h-full items-center relative px-6 py-3">
					<section className="flex flex-col gap-1 w-full">
						<div className="flex items-center w-full justify-between">
							<p className="font-serif text-[1.05rem] font-medium leading-tight tracking-normal">
								{t("serverOverview.network")}
							</p>
						</div>
						<section className="flex items-start flex-row z-10 pr-0 gap-1">
							<p className="sm:text-[12px] text-[10px] text-metric-upload text-nowrap font-medium">
								↑{formatBytes(up)}
							</p>
							<p className="sm:text-[12px] text-[10px] text-metric-download text-nowrap font-medium">
								↓{formatBytes(down)}
							</p>
						</section>
						<section className="flex flex-col sm:flex-row -mr-1 sm:items-center items-start gap-1">
							<p className="text-[11px] flex items-center text-nowrap font-medium tabular-nums">
								<ArrowUpCircleIcon className="size-3 mr-0.5 sm:mb-px" />
								{formatBytes(upSpeed)}/s
							</p>
							<p className="text-[11px] flex items-center  text-nowrap font-medium tabular-nums">
								<ArrowDownCircleIcon className="size-3 mr-0.5" />
								{formatBytes(downSpeed)}/s
							</p>
						</section>
					</section>
				</CardContent>
			</Card>
		</section>
	);
}
