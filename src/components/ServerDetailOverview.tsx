import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/Icon";
import { ServerDetailLoading } from "@/components/loading/ServerDetailLoading";
import ServerFlag from "@/components/ServerFlag";
import { Card } from "@/components/ui/card";
import { useWebSocketContext } from "@/hooks/use-websocket-context";
import { formatBytes } from "@/lib/format";
import { cn, formatNezhaInfo, getCpuCoreCount } from "@/lib/utils";
import type { NezhaWebsocketResponse } from "@/types/nezha-api";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

type DetailFieldProps = {
	label: string;
	value: React.ReactNode;
	className?: string;
	valueClassName?: string;
};

function MetadataItem({
	label,
	value,
	className,
	valueClassName,
}: DetailFieldProps) {
	return (
		<div className={cn("min-w-0", className)}>
			<p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
				{label}
			</p>
			<div
				className={cn(
					"mt-1 min-w-0 text-[13px] font-medium leading-snug text-foreground",
					valueClassName,
				)}
			>
				{value}
			</div>
		</div>
	);
}

function DashboardCard({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("min-w-0 p-4 md:p-5", className)}>
			<h2 className="font-serif text-[1.3rem] font-medium leading-tight tracking-normal">
				{title}
			</h2>
			{children}
		</Card>
	);
}

function HeroMetric({
	label,
	value,
	children,
	className,
}: {
	label: string;
	value: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-w-0", className)}>
			<p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="mt-1 min-w-0 text-lg font-semibold leading-tight text-foreground">
				{value}
			</div>
			{children}
		</div>
	);
}

function HardwareSpecRow({
	label,
	value,
	detail,
}: {
	label: string;
	value: React.ReactNode;
	detail?: React.ReactNode;
}) {
	return (
		<div className="min-w-0 py-2">
			<p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="mt-0.5 min-w-0">
				<p className="break-words text-[13px] font-semibold leading-snug text-foreground">
					{value}
				</p>
				{detail && (
					<p className="mt-0.5 break-words text-[11px] leading-snug text-muted-foreground">
						{detail}
					</p>
				)}
			</div>
		</div>
	);
}

function summarizeHardwareItems(items: string[], showCount = true) {
	const counts = new Map<string, number>();

	for (const item of items) {
		const name = item.trim();
		if (!name) continue;
		counts.set(name, (counts.get(name) || 0) + 1);
	}

	return Array.from(counts, ([name, count]) =>
		showCount && count > 1 ? `${count} x ${name}` : name,
	);
}

function getDetailCpuSpec(cpuInfo: string[]) {
	const physicalCore = cpuInfo
		.map((info) => info.match(/\b(\d+)\s*physical\s+cores?\b/i))
		.find((match) => match);
	const virtualCore = cpuInfo
		.map((info) => info.match(/\b(\d+)\s*virtual\s+cores?\b/i))
		.find((match) => match);

	if (physicalCore?.[1]) return `${physicalCore[1]} Physical Core`;
	if (virtualCore?.[1]) return `${virtualCore[1]} Virtual Core`;

	return `${getCpuCoreCount(cpuInfo)} vCPU`;
}

function formatCpuDetail(cpuInfo: string[]) {
	return summarizeHardwareItems(
		cpuInfo.map((info) =>
			info
				.trim()
				.replace(/\b\d+\s*(?:physical|virtual)\s+cores?\b/gi, "")
				.replace(
					/^\d+\s*(?:v\s*cpus?|cores?|threads?|processors?|logical processors?|virtual cores?)\b\s*/i,
					"",
				)
				.replace(/\s{2,}/g, " ")
				.trim(),
		),
	).join(", ");
}

function compactUptime(uptime: number) {
	const days = Math.floor(uptime / 86400);
	const hours = Math.floor((uptime % 86400) / 3600);
	if (days > 0) return `${days}d ${hours}h`;
	return `${hours}h`;
}

function normalizeOs(platform: string, version: string) {
	const cleanedPlatform = platform.trim();
	const cleanedVersion = version.trim();
	if (!cleanedPlatform && !cleanedVersion) return "N/A";

	const lower = cleanedPlatform.toLowerCase();
	const label =
		lower === "linux"
			? "Linux"
			: cleanedPlatform
				? cleanedPlatform.charAt(0).toUpperCase() + cleanedPlatform.slice(1)
				: "";

	return [label, cleanedVersion].filter(Boolean).join(" ");
}

function formatShortDate(value: string) {
	if (!value) return "N/A";
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed.format("MMM D, HH:mm") : value;
}

export default function ServerDetailOverview({
	server_id,
}: {
	server_id: string;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [hasHistory, setHasHistory] = useState(false);

	useEffect(() => {
		const previousPath = sessionStorage.getItem("fromMainPage");
		if (previousPath) {
			setHasHistory(true);
		}
	}, []);

	const { lastMessage, connected } = useWebSocketContext();

	if (!connected && !lastMessage) {
		return <ServerDetailLoading />;
	}

	const linkClick = () => {
		if (hasHistory) {
			navigate(-1);
		} else {
			navigate("/");
		}
	};

	const nezhaWsData = lastMessage
		? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse)
		: null;

	if (!nezhaWsData) {
		return <ServerDetailLoading />;
	}

	const server = nezhaWsData.servers.find((s) => s.id === Number(server_id));

	if (!server) {
		return <ServerDetailLoading />;
	}

	const {
		name,
		online,
		uptime,
		version,
		arch,
		mem_total,
		disk_total,
		country_code,
		platform,
		platform_version,
		cpu_info,
		net_out_transfer,
		net_in_transfer,
		last_active_time_string,
		boot_time_string,
	} = formatNezhaInfo(nezhaWsData.now, server);

	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	countries.registerLocale(enLocale);

	const regionName = country_code
		? countries.getName(country_code.toUpperCase(), "en")
		: undefined;
	const regionDisplayName = regionName || country_code?.toUpperCase() || "N/A";
	const totalTraffic =
		net_out_transfer || net_in_transfer
			? formatBytes((net_out_transfer || 0) + (net_in_transfer || 0))
			: t("serverDetail.unknown");
	const uptimeCompact = compactUptime(uptime);
	const cpuSpec = getDetailCpuSpec(cpu_info);
	const cpuModel = formatCpuDetail(cpu_info);
	const gpuSpecs = summarizeHardwareItems(server.host.gpu || [], false);
	const osName = normalizeOs(platform, platform_version);
	const shortLastActive = formatShortDate(last_active_time_string);
	const shortBootTime = formatShortDate(boot_time_string);

	return (
		<div
			className={cn("space-y-4", {
				"bg-card/70 p-4 rounded-lg": customBackgroundImage,
			})}
		>
			<div
				onClick={linkClick}
				className="flex flex-none cursor-pointer items-center gap-2 break-all font-serif text-[1.6rem] font-medium leading-tight tracking-normal server-name"
			>
				<BackIcon />
				{name}
			</div>

			<section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
				<DashboardCard title="Server Health">
					<div className="mt-4">
						<div
							className={cn(
								"inline-flex max-w-full items-center gap-2 text-lg font-semibold leading-tight",
								online ? "text-status-online" : "text-status-offline",
							)}
						>
							<span
								className={cn("size-2 rounded-full bg-status-online", {
									"bg-status-offline": !online,
								})}
							/>
							<span className="truncate">
								{online ? t("serverDetail.online") : t("serverDetail.offline")}
							</span>
						</div>
						<p className="mt-2 text-[13px] text-muted-foreground">
							{online ? `Running for ${uptimeCompact}` : "No active report"}
						</p>
					</div>
					<div className="mt-5 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-2 xl:grid-cols-1">
						<MetadataItem
							label="Last active"
							value={
								<span title={last_active_time_string || undefined}>
									{shortLastActive}
								</span>
							}
							valueClassName="whitespace-nowrap"
						/>
						<MetadataItem label="Agent" value={version || "N/A"} />
					</div>
				</DashboardCard>

				<DashboardCard title="Hardware">
					<div className="mt-3 divide-y divide-border/70">
							<HardwareSpecRow
								label="CPU"
								value={cpuSpec}
								detail={cpuModel || "N/A"}
							/>
						<HardwareSpecRow
							label="Memory"
							value={mem_total ? formatBytes(mem_total) : "N/A"}
						/>
						<HardwareSpecRow
							label="Disk"
							value={disk_total ? formatBytes(disk_total) : "N/A"}
						/>
						{gpuSpecs.length > 0 && (
							<HardwareSpecRow
								label="GPU"
								value={`${server.host.gpu.length} GPU`}
								detail={gpuSpecs.join(", ")}
							/>
						)}
					</div>
				</DashboardCard>

				<DashboardCard title="Traffic">
					<HeroMetric
						label="Total traffic"
						value={totalTraffic}
						className="mt-4"
					/>
					<div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-2 xl:grid-cols-1">
						<MetadataItem
							label="Upload"
							value={
								net_out_transfer
									? formatBytes(net_out_transfer)
									: t("serverDetail.unknown")
							}
							valueClassName="whitespace-nowrap"
						/>
						<MetadataItem
							label="Download"
							value={
								net_in_transfer
									? formatBytes(net_in_transfer)
									: t("serverDetail.unknown")
							}
							valueClassName="whitespace-nowrap"
						/>
					</div>
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="mt-4">
									<MetadataItem
										label="Region"
										value={
											country_code ? (
												<span className="inline-flex max-w-full items-center gap-2">
													<span className="truncate">
														{regionDisplayName}
													</span>
													<ServerFlag country_code={country_code} />
												</span>
											) : (
												"N/A"
											)
										}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{regionDisplayName}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</DashboardCard>

				<DashboardCard title="Platform">
					<div className="mt-4 min-w-0">
						<p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
							OS
						</p>
						<p
							className="mt-1 text-lg font-semibold leading-tight text-foreground"
							title={osName}
						>
							{osName}
						</p>
					</div>
					<div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-2 xl:grid-cols-1">
						<MetadataItem label="Architecture" value={arch || "N/A"} />
						<MetadataItem
							label="Boot time"
							value={
								<span title={boot_time_string || undefined}>
									{shortBootTime}
								</span>
							}
							valueClassName="whitespace-nowrap"
						/>
					</div>
				</DashboardCard>
			</section>
		</div>
	);
}
