import { geoEquirectangular, geoPath } from "d3-geo";
import { useTranslation } from "react-i18next";
import useTooltip from "@/hooks/use-tooltip";
import { geoJsonString } from "@/lib/geo-json-string";
import { countryCoordinates } from "@/lib/geo-limit";
import { cn, formatNezhaInfo } from "@/lib/utils";
import type { NezhaServer } from "@/types/nezha-api";

import MapTooltip from "./MapTooltip";

export default function GlobalMap({
	serverList,
	now,
	compact = false,
}: {
	serverList: NezhaServer[];
	now: number;
	compact?: boolean;
}) {
	const { t } = useTranslation();
	const countryList: string[] = [];
	const serverCounts: { [key: string]: number } = {};

	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	serverList.forEach((server) => {
		if (server.country_code) {
			const countryCode = server.country_code.toUpperCase();
			if (!countryList.includes(countryCode)) {
				countryList.push(countryCode);
			}
			serverCounts[countryCode] = (serverCounts[countryCode] || 0) + 1;
		}
	});

	const width = compact ? 720 : 900;
	const height = compact ? 260 : 500;

	const geoJson = JSON.parse(geoJsonString);
	const filteredFeatures = geoJson.features.filter(
		(feature: { properties: { iso_a3_eh: string } }) =>
			feature.properties.iso_a3_eh !== "",
	);

	return (
		<section
			className={cn(
				"flex flex-col gap-2 mt-6",
				compact && "mx-auto max-w-2xl opacity-85",
				{
					"bg-card/70 rounded-lg p-4": customBackgroundImage,
				},
			)}
		>
			<p className="text-center text-xs font-medium text-muted-foreground opacity-60">
				{t("map.Distributions")} {countryList.length} {t("map.Regions")}
			</p>
			<div className="w-full overflow-visible">
				<InteractiveMap
					countries={countryList}
					serverCounts={serverCounts}
					width={width}
					height={height}
					filteredFeatures={filteredFeatures}
					nezhaServerList={serverList}
					now={now}
				/>
			</div>
		</section>
	);
}

interface InteractiveMapProps {
	countries: string[];
	serverCounts: { [key: string]: number };
	width: number;
	height: number;
	filteredFeatures: {
		type: "Feature";
		properties: {
			iso_a2_eh: string;
			[key: string]: string;
		};
		geometry: never;
	}[];
	nezhaServerList: NezhaServer[];
	now: number;
}

export function InteractiveMap({
	countries,
	serverCounts,
	width,
	height,
	filteredFeatures,
	nezhaServerList,
	now,
}: InteractiveMapProps) {
	const { setTooltipData } = useTooltip();

	const projection = geoEquirectangular()
		.scale(width * (height < 320 ? 0.13 : 0.155))
		.translate([width / 2, height / 2])
		.rotate([-12, 0, 0]);

	const path = geoPath().projection(projection);

	return (
		<div
			className="relative w-full"
			style={{ aspectRatio: `${width} / ${height}` }}
			onMouseLeave={() => setTooltipData(null)}
		>
			<svg
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-auto"
			>
				<defs>
					<pattern id="dots" width="2" height="2" patternUnits="userSpaceOnUse">
						<circle cx="1" cy="1" r="0.5" fill="currentColor" />
					</pattern>
				</defs>
				<g>
					{/* Background rect to handle mouse events in empty areas */}
					<rect
						x="0"
						y="0"
						width={width}
						height={height}
						fill="transparent"
						onMouseEnter={() => setTooltipData(null)}
					/>
					{filteredFeatures.map((feature, index) => {
						const isHighlighted = countries.includes(
							feature.properties.iso_a2_eh,
						);

						const serverCount = serverCounts[feature.properties.iso_a2_eh] || 0;

						return (
							<path
								key={index}
								d={path(feature) || ""}
								className={
									isHighlighted
										? "fill-status-online/45 hover:fill-status-online/65 transition-all cursor-pointer stroke-status-online/20 stroke-[0.35]"
										: "fill-secondary/25 stroke-border/25 stroke-[0.35]"
								}
								onMouseEnter={() => {
									if (!isHighlighted) {
										setTooltipData(null);
										return;
									}
									if (path.centroid(feature)) {
										const countryCode = feature.properties.iso_a2_eh;
										const countryServers = nezhaServerList
											.filter(
												(server: NezhaServer) =>
													server.country_code?.toUpperCase() === countryCode,
											)
											.map((server: NezhaServer) => ({
												id: server.id,
												name: server.name,
												status: formatNezhaInfo(now, server).online,
											}));
										setTooltipData({
											centroid: path.centroid(feature),
											mapSize: { width, height },
											country: feature.properties.name,
											count: serverCount,
											servers: countryServers,
										});
									}
								}}
							/>
						);
					})}

					{/* 渲染不在 filteredFeatures 中的国家标记点 */}
					{countries.map((countryCode) => {
						// 检查该国家是否已经在 filteredFeatures 中
						const isInFilteredFeatures = filteredFeatures.some(
							(feature) => feature.properties.iso_a2_eh === countryCode,
						);

						// 如果已经在 filteredFeatures 中，跳过
						if (isInFilteredFeatures) return null;

						// 获取国家的经纬度
						const coords = countryCoordinates[countryCode];
						if (!coords) return null;

						// 使用投影函数将经纬度转换为 SVG 坐标
						const [x, y] = projection([coords.lng, coords.lat]) || [0, 0];
						const serverCount = serverCounts[countryCode] || 0;

						return (
							<g
								key={countryCode}
								onMouseEnter={() => {
									const countryServers = nezhaServerList
										.filter(
											(server: NezhaServer) =>
												server.country_code?.toUpperCase() ===
												countryCode.toUpperCase(),
										)
										.map((server: NezhaServer) => ({
											id: server.id,
											name: server.name,
											status: formatNezhaInfo(now, server).online,
										}));
									setTooltipData({
										centroid: [x, y],
										mapSize: { width, height },
										country: coords.name,
										count: serverCount,
										servers: countryServers,
									});
								}}
								className="cursor-pointer"
							>
								<circle
									cx={x}
									cy={y}
									r={3}
									className="fill-status-online/70 stroke-card/70 stroke-[1.5] transition-all hover:fill-status-online"
								/>
							</g>
						);
					})}
				</g>
			</svg>
			<MapTooltip />
		</div>
	);
}
