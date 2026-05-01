import {
	ArrowDownIcon,
	ArrowsUpDownIcon,
	ArrowUpIcon,
} from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalMap from "@/components/GlobalMap";
import GroupSwitch from "@/components/GroupSwitch";
import { Loader } from "@/components/loading/Loader";
import ServerCard from "@/components/ServerCard";
import ServerOverview from "@/components/ServerOverview";
import { ServiceTracker } from "@/components/ServiceTracker";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SORT_ORDERS, SORT_TYPES } from "@/context/sort-context";
import { useSort } from "@/hooks/use-sort";
import { useStatus } from "@/hooks/use-status";
import { useWebSocketContext } from "@/hooks/use-websocket-context";
import { fetchServerGroup, fetchService } from "@/lib/nezha-api";
import { cn, formatNezhaInfo } from "@/lib/utils";
import type {
	CycleTransferData,
	CycleTransferStats,
	NezhaWebsocketResponse,
	ServerGroup,
} from "@/types/nezha-api";

export type ServerCycleTransfer = {
	name: string;
	from: string;
	to: string;
	max: number;
	min: number;
	transfer: number;
	nextUpdate: string;
};

function getServerCycleTransfer(
	serverId: number,
	cycleStats?: CycleTransferStats,
): ServerCycleTransfer | undefined {
	if (!cycleStats) return undefined;

	for (const cycleData of Object.values(cycleStats) as CycleTransferData[]) {
		const key = String(serverId);
		const transfer = cycleData.transfer?.[key];
		const nextUpdate = cycleData.next_update?.[key];

		if (transfer === undefined && !nextUpdate) continue;

		return {
			name: cycleData.name,
			from: cycleData.from,
			to: cycleData.to,
			max: cycleData.max,
			min: cycleData.min,
			transfer: transfer || 0,
			nextUpdate: nextUpdate || "",
		};
	}

	return undefined;
}

export default function Servers() {
	const { t } = useTranslation();
	const { sortType, sortOrder, setSortOrder, setSortType } = useSort();
	const { data: groupData } = useQuery({
		queryKey: ["server-group"],
		queryFn: () => fetchServerGroup(),
		refetchOnMount: true,
		refetchOnWindowFocus: true,
	});
	const { data: serviceData } = useQuery({
		queryKey: ["service"],
		queryFn: () => fetchService(),
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchInterval: 10000,
	});
	const { lastMessage, connected } = useWebSocketContext();
	const { status } = useStatus();
	const containerRef = useRef<HTMLDivElement>(null);
	const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
	const [currentGroup, setCurrentGroup] = useState<string>("All");

	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	const restoreScrollPosition = useCallback(() => {
		const savedPosition = sessionStorage.getItem("scrollPosition");
		if (savedPosition && containerRef.current) {
			containerRef.current.scrollTop = Number(savedPosition);
		}
	}, []);

	const handleTagChange = (newGroup: string) => {
		setCurrentGroup(newGroup);
		sessionStorage.setItem("selectedGroup", newGroup);
		sessionStorage.setItem(
			"scrollPosition",
			String(containerRef.current?.scrollTop || 0),
		);
	};

	useEffect(() => {
		const savedGroup = sessionStorage.getItem("selectedGroup") || "All";
		setCurrentGroup(savedGroup);

		restoreScrollPosition();
	}, [restoreScrollPosition]);

	const nezhaWsData = lastMessage
		? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse)
		: null;

	const groupTabs = [
		"All",
		...(groupData?.data
			?.filter((item: ServerGroup) => {
				return (
					Array.isArray(item.servers) &&
					item.servers.some((serverId) =>
						nezhaWsData?.servers?.some((server) => server.id === serverId),
					)
				);
			})
			?.map((item: ServerGroup) => item.group.name) || []),
	];

	if (!connected && !lastMessage) {
		return (
			<div className="flex flex-col items-center min-h-96 justify-center ">
				<div className="font-semibold flex items-center gap-2 text-sm">
					<Loader visible={true} />
					{t("info.websocketConnecting")}
				</div>
			</div>
		);
	}

	if (!nezhaWsData) {
		return (
			<div className="flex flex-col items-center justify-center ">
				<p className="font-semibold text-sm">{t("info.processing")}</p>
			</div>
		);
	}

	let filteredServers =
		nezhaWsData?.servers?.filter((server) => {
			if (currentGroup === "All") return true;
			const group = groupData?.data?.find(
				(g: ServerGroup) =>
					g.group.name === currentGroup &&
					Array.isArray(g.servers) &&
					g.servers.includes(server.id),
			);
			return !!group;
		}) || [];

	const totalServers = filteredServers.length || 0;
	const onlineServers =
		filteredServers.filter(
			(server) => formatNezhaInfo(nezhaWsData.now, server).online,
		)?.length || 0;
	const offlineServers =
		filteredServers.filter(
			(server) => !formatNezhaInfo(nezhaWsData.now, server).online,
		)?.length || 0;
	const up =
		filteredServers.reduce(
			(total, server) =>
				formatNezhaInfo(nezhaWsData.now, server).online
					? total + (server.state?.net_out_transfer ?? 0)
					: total,
			0,
		) || 0;
	const down =
		filteredServers.reduce(
			(total, server) =>
				formatNezhaInfo(nezhaWsData.now, server).online
					? total + (server.state?.net_in_transfer ?? 0)
					: total,
			0,
		) || 0;

	const upSpeed =
		filteredServers.reduce(
			(total, server) =>
				formatNezhaInfo(nezhaWsData.now, server).online
					? total + (server.state?.net_out_speed ?? 0)
					: total,
			0,
		) || 0;
	const downSpeed =
		filteredServers.reduce(
			(total, server) =>
				formatNezhaInfo(nezhaWsData.now, server).online
					? total + (server.state?.net_in_speed ?? 0)
					: total,
			0,
		) || 0;

	filteredServers =
		status === "all"
			? filteredServers
			: filteredServers.filter((server) =>
					[status].includes(
						formatNezhaInfo(nezhaWsData.now, server).online
							? "online"
							: "offline",
					),
				);

	filteredServers = filteredServers.sort((a, b) => {
		const serverAInfo = formatNezhaInfo(nezhaWsData.now, a);
		const serverBInfo = formatNezhaInfo(nezhaWsData.now, b);

		if (sortType !== "name") {
			// 仅在非 "name" 排序时，先按在线状态排序
			if (!serverAInfo.online && serverBInfo.online) return 1;
			if (serverAInfo.online && !serverBInfo.online) return -1;
			if (!serverAInfo.online && !serverBInfo.online) {
				// 如果两者都离线，可以继续按照其他条件排序，或者保持原序
				// 这里选择保持原序
				return 0;
			}
		}

		let comparison = 0;

		switch (sortType) {
			case "name":
				comparison = a.name.localeCompare(b.name);
				break;
			case "uptime":
				comparison = (a.state?.uptime ?? 0) - (b.state?.uptime ?? 0);
				break;
			case "system":
				comparison = a.host.platform.localeCompare(b.host.platform);
				break;
			case "cpu":
				comparison = (a.state?.cpu ?? 0) - (b.state?.cpu ?? 0);
				break;
			case "mem":
				comparison =
					(formatNezhaInfo(nezhaWsData.now, a).mem ?? 0) -
					(formatNezhaInfo(nezhaWsData.now, b).mem ?? 0);
				break;
			case "disk":
				comparison =
					(formatNezhaInfo(nezhaWsData.now, a).disk ?? 0) -
					(formatNezhaInfo(nezhaWsData.now, b).disk ?? 0);
				break;
			case "up":
				comparison =
					(a.state?.net_out_speed ?? 0) - (b.state?.net_out_speed ?? 0);
				break;
			case "down":
				comparison =
					(a.state?.net_in_speed ?? 0) - (b.state?.net_in_speed ?? 0);
				break;
			case "up total":
				comparison =
					(a.state?.net_out_transfer ?? 0) - (b.state?.net_out_transfer ?? 0);
				break;
			case "down total":
				comparison =
					(a.state?.net_in_transfer ?? 0) - (b.state?.net_in_transfer ?? 0);
				break;
			default:
				comparison = 0;
		}

		return sortOrder === "asc" ? comparison : -comparison;
	});

	return (
		<div className="mx-auto w-full max-w-5xl px-0">
			<div className="flex items-center justify-between gap-2 server-overview-controls">
				<section className="flex items-center gap-2 w-full overflow-hidden">
					<GroupSwitch
						tabs={groupTabs}
						currentTab={currentGroup}
						setCurrentTab={handleTagChange}
					/>
				</section>
				<Popover onOpenChange={setSettingsOpen}>
					<PopoverTrigger asChild>
						<button
							className={cn(
								"rounded-full flex items-center gap-1 border border-input bg-card p-[10px] text-foreground cursor-pointer shadow-[0_0_0_1px_hsl(var(--border))] transition-all hover:bg-accent",
								{
									"bg-secondary shadow-[0_0_0_1px_hsl(var(--ring))]":
										settingsOpen,
								},
								{
									"bg-card/70": customBackgroundImage && !settingsOpen,
								},
							)}
						>
							<p className="text-[10px] font-bold whitespace-nowrap">
								{sortType === "default" ? "Sort" : sortType.toUpperCase()}
							</p>
							{sortOrder === "asc" && sortType !== "default" ? (
								<ArrowUpIcon className="size-[13px]" />
							) : sortOrder === "desc" && sortType !== "default" ? (
								<ArrowDownIcon className="size-[13px]" />
							) : (
								<ArrowsUpDownIcon className="size-[13px]" />
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent className="p-4 w-[240px] rounded-lg">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-xs font-medium text-muted-foreground">
									Sort by
								</Label>
								<Select value={sortType} onValueChange={setSortType}>
									<SelectTrigger className="w-full text-xs h-8">
										<SelectValue placeholder="Choose type" />
									</SelectTrigger>
									<SelectContent>
										{SORT_TYPES.map((type) => (
											<SelectItem key={type} value={type} className="text-xs">
												{type.charAt(0).toUpperCase() + type.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium text-muted-foreground">
									Sort order
								</Label>
								<Select
									value={sortOrder}
									onValueChange={setSortOrder}
									disabled={sortType === "default"}
								>
									<SelectTrigger className="w-full text-xs h-8">
										<SelectValue placeholder="Choose order" />
									</SelectTrigger>
									<SelectContent>
										{SORT_ORDERS.map((order) => (
											<SelectItem key={order} value={order} className="text-xs">
												{order.charAt(0).toUpperCase() + order.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>
			<div className="mt-4">
				<ServerOverview
					total={totalServers}
					online={onlineServers}
					offline={offlineServers}
					up={up}
					down={down}
					upSpeed={upSpeed}
					downSpeed={downSpeed}
				/>
			</div>
			<ServiceTracker />
			<section
				ref={containerRef}
				className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 mt-6 server-card-list"
			>
				{filteredServers.map((serverInfo) => (
					<ServerCard
						now={nezhaWsData.now}
						key={serverInfo.id}
						serverInfo={serverInfo}
						cycleTransfer={getServerCycleTransfer(
							serverInfo.id,
							serviceData?.data?.cycle_transfer_stats,
						)}
					/>
				))}
			</section>
			<GlobalMap
				now={nezhaWsData.now}
				serverList={nezhaWsData?.servers || []}
				compact
			/>
		</div>
	);
}
