import {
	ArrowDown,
	ArrowUp,
	CalendarDays,
	Cpu,
	ExternalLink,
	Gauge,
	HardDrive,
	MemoryStick,
	RotateCw,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ServerFlag from "@/components/ServerFlag";
import { formatBytes } from "@/lib/format";
import { GetOsName } from "@/lib/logo-class";
import {
	cn,
	formatNezhaInfo,
	getCpuCoreCount,
	getDaysBetweenDatesWithAutoRenewal,
	parsePublicNote,
} from "@/lib/utils";
import type { NezhaServer } from "@/types/nezha-api";
import type { ServerCycleTransfer } from "@/pages/Server";
import PlanInfo from "./PlanInfo";
import { Card } from "./ui/card";

type MetricBlockProps = {
	icon: React.ReactNode;
	label: string;
	value?: string;
	detail?: string;
	segmentsValue?: number;
	indicatorClassName?: string;
	toneClassName?: string;
	valueClassName?: string;
	detailClassName?: string;
};

const metricLabelClass =
	"text-[13px] font-medium leading-tight tracking-[0.01em]";
const metricValueClass =
	"text-sm font-semibold leading-tight tabular-nums font-sans";
const metricDetailClass =
	"text-[13px] font-semibold leading-tight tabular-nums font-sans";

function SegmentedMeter({
	value,
	indicatorClassName = "bg-primary",
}: {
	value: number;
	indicatorClassName?: string;
}) {
	const segments = 18;
	const activeSegments = Math.max(
		0,
		Math.min(segments, Math.round((value / 100) * segments)),
	);

	return (
		<div className="mt-2 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
			{Array.from({ length: segments }).map((_, index) => (
				<span
					key={index}
					className={cn(
						"h-2 rounded-[2px] bg-secondary/60",
						index < activeSegments && indicatorClassName,
					)}
				/>
			))}
		</div>
	);
}

function MetricBlock({
	icon,
	label,
	value,
	detail,
	segmentsValue,
	indicatorClassName,
	toneClassName,
	valueClassName,
	detailClassName,
}: MetricBlockProps) {
	return (
		<section className="min-w-0">
			<div className="flex items-center justify-between gap-2">
				<div
					className={cn(
						"flex min-w-0 items-center gap-1.5 text-muted-foreground",
						toneClassName,
					)}
				>
					<span className="[&_svg]:size-3.5">{icon}</span>
					<p className={cn("truncate", metricLabelClass)}>{label}</p>
				</div>
				{value && (
					<p
						className={cn(
							"shrink-0",
							metricValueClass,
							toneClassName,
							valueClassName,
						)}
					>
						{value}
					</p>
				)}
			</div>
			{detail && (
				<p className={cn("mt-1 truncate", metricDetailClass, detailClassName)}>
					{detail}
				</p>
			)}
			{typeof segmentsValue === "number" && (
				<SegmentedMeter
					value={segmentsValue}
					indicatorClassName={indicatorClassName}
				/>
			)}
		</section>
	);
}

function formatSpeed(value: number) {
	if (value >= 1024) return `${(value / 1024).toFixed(1)}Gbps`;
	if (value >= 1) return `${value.toFixed(1)}Mbps`;
	return `${(value * 1024).toFixed(1)}Kbps`;
}

function formatUptime(uptime: number, daysLabel: string, hoursLabel: string) {
	if (uptime / 86400 >= 1) return `${Math.floor(uptime / 86400)} ${daysLabel}`;
	return `${Math.max(0, Math.floor(uptime / 3600))} ${hoursLabel}`;
}

export default function ServerCard({
	now,
	serverInfo,
	cycleTransfer,
}: {
	now: number;
	serverInfo: NezhaServer;
	cycleTransfer?: ServerCycleTransfer;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		name,
		country_code,
		online,
		cpu,
		up,
		down,
		mem,
		stg,
		uptime,
		public_note,
		platform,
		platform_version,
		load_1,
		tcp,
		udp,
	} = formatNezhaInfo(now, serverInfo);

	const parsedData = parsePublicNote(public_note);
	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	const cpuCount = getCpuCoreCount(serverInfo.host.cpu);
	const loadValue = Math.min(
		100,
		(Number(load_1) / Math.max(cpuCount, 1)) * 100,
	);
	const expiresIn = parsedData?.billingDataMod
		? getDaysBetweenDatesWithAutoRenewal(parsedData.billingDataMod).days
		: null;
	const cycleRemaining = cycleTransfer
		? Math.max(0, cycleTransfer.max - cycleTransfer.transfer)
		: null;
	const cycleProgress = cycleTransfer
		? Math.min(100, (cycleTransfer.transfer / cycleTransfer.max) * 100)
		: 0;

	const cardClick = () => {
		sessionStorage.setItem("fromMainPage", "true");
		navigate(`/server/${serverInfo.id}`);
	};

	return (
		<Card
			className={cn(
				"min-h-[348px] cursor-pointer p-4 transition-colors hover:bg-accent/50",
				{
					"bg-card/70": customBackgroundImage,
					"opacity-70": !online,
				},
			)}
			onClick={cardClick}
		>
			<header className="space-y-2">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex min-w-0 items-center gap-2">
							<ServerFlag country_code={country_code} />
							<h3 className="truncate font-serif text-[1.05rem] font-medium leading-tight tracking-normal">
								{name}
							</h3>
						</div>
						<p className="mt-1 truncate text-xs font-medium text-muted-foreground">
							{GetOsName(platform) || platform || "Unknown"}{" "}
							{platform_version ? `· ${platform_version}` : ""} ·{" "}
							{serverInfo.host.arch}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span
							className={cn("size-2.5 rounded-full bg-status-online", {
								"bg-status-offline": !online,
							})}
						/>
						<ExternalLink className="size-4 text-muted-foreground" />
					</div>
				</div>
			</header>

			<section className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
				<MetricBlock
					icon={<Cpu />}
					label="CPU"
					value={`${cpu.toFixed(1)}%`}
					detail={`${cpuCount} ${t("serverCard.cores", "cores")}`}
					segmentsValue={cpu}
					indicatorClassName="bg-ring-subtle"
					toneClassName="text-muted-foreground"
					valueClassName="text-xs text-foreground"
					detailClassName="text-foreground"
				/>
				<MetricBlock
					icon={<Gauge />}
					label="LOAD"
					value={String(load_1)}
					detail={`${tcp + udp} conn`}
					segmentsValue={loadValue}
					indicatorClassName="bg-ring-subtle"
					toneClassName="text-muted-foreground"
					valueClassName="text-xs text-foreground"
					detailClassName="text-foreground"
				/>
				<MetricBlock
					icon={<MemoryStick />}
					label="MEM"
					value={`${mem.toFixed(1)}%`}
					detail={`${formatBytes(serverInfo.state.mem_used)} / ${formatBytes(
						serverInfo.host.mem_total,
					)}`}
					segmentsValue={mem}
					indicatorClassName="bg-ring-subtle"
					toneClassName="text-muted-foreground"
					valueClassName="text-xs text-foreground"
					detailClassName="text-foreground"
				/>
				<MetricBlock
					icon={<HardDrive />}
					label="STG"
					value={`${stg.toFixed(1)}%`}
					detail={`${formatBytes(serverInfo.state.disk_used)} / ${formatBytes(
						serverInfo.host.disk_total,
					)}`}
					segmentsValue={stg}
					indicatorClassName="bg-ring-subtle"
					toneClassName="text-muted-foreground"
					valueClassName="text-xs text-foreground"
					detailClassName="text-foreground"
				/>
			</section>

			<section className="mt-6 grid grid-cols-2 gap-5">
				<MetricBlock
					icon={<ArrowUp />}
					label={t("serverCard.upload").toUpperCase()}
					detail={formatSpeed(up)}
					toneClassName="text-muted-foreground"
					detailClassName="text-primary"
				/>
				<MetricBlock
					icon={<ArrowDown />}
					label={t("serverCard.download").toUpperCase()}
					detail={formatSpeed(down)}
					toneClassName="text-muted-foreground"
					detailClassName="text-status-online"
				/>
			</section>

			<section className="mt-6 grid grid-cols-2 gap-5">
				<MetricBlock
					icon={<CalendarDays />}
					label={t("billingInfo.remaining").toUpperCase()}
					detail={
						typeof expiresIn === "number"
							? `${expiresIn} ${t("billingInfo.days")}`
							: "-"
					}
					toneClassName="text-foreground"
					detailClassName="text-muted-foreground"
				/>
				<MetricBlock
					icon={<RotateCw />}
					label={(online ? t("online") : t("offline")).toUpperCase()}
					detail={
						online
							? formatUptime(
									uptime,
									t("serverCard.days"),
									t("serverCard.hours"),
								)
							: "-"
					}
					toneClassName="text-foreground"
					detailClassName="text-muted-foreground"
				/>
			</section>

			<footer className="mt-5 border-t border-border pt-4">
				{cycleTransfer && (
					<section className="mb-4 space-y-2">
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<p
									className={cn(
										"truncate text-muted-foreground",
										metricLabelClass,
									)}
								>
									{cycleTransfer.name}
								</p>
								<p className={metricDetailClass}>
									{formatBytes(cycleRemaining || 0)} left
								</p>
							</div>
							<div className="text-right">
								<p className={cn("text-muted-foreground", metricLabelClass)}>
									{cycleProgress.toFixed(1)}%
								</p>
								<p className="text-xs leading-tight text-muted-foreground tabular-nums">
									{formatBytes(cycleTransfer.transfer)} /{" "}
									{formatBytes(cycleTransfer.max)}
								</p>
							</div>
						</div>
						<div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${cycleProgress}%` }}
							/>
						</div>
					</section>
				)}
				{parsedData?.planDataMod && (
					<div>
						<PlanInfo parsedData={parsedData} />
					</div>
				)}
			</footer>
		</Card>
	);
}
