import { AnimatePresence, m } from "framer-motion";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useTooltip from "@/hooks/use-tooltip";

const MapTooltip = memo(function MapTooltip() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { tooltipData } = useTooltip();

	if (!tooltipData) return null;

	const xPercent = (tooltipData.centroid[0] / tooltipData.mapSize.width) * 100;
	const yPercent = (tooltipData.centroid[1] / tooltipData.mapSize.height) * 100;
	const alignLeft = xPercent > 62;

	return (
		<AnimatePresence mode="wait">
			<m.div
				initial={{ opacity: 0, filter: "blur(10px)" }}
				animate={{ opacity: 1, filter: "blur(0px)" }}
				exit={{ opacity: 0, filter: "blur(10px)" }}
				className="absolute hidden lg:block w-max max-w-[220px] bg-card px-2 py-1 rounded border border-border text-sm shadow-[0_0_0_1px_hsl(var(--border)),0_4px_24px_rgb(0_0_0/0.05)] z-50"
				key={tooltipData.country}
				style={{
					left: `${xPercent}%`,
					top: `${yPercent}%`,
					transform: alignLeft
						? "translate(calc(-100% - 12px), -50%)"
						: "translate(12px, -50%)",
				}}
				onMouseEnter={(e) => {
					e.stopPropagation();
				}}
			>
				<div>
					<p className="font-medium">
						{tooltipData.country === "China"
							? "Mainland China"
							: tooltipData.country}
					</p>
					<p className="text-muted-foreground text-xs font-light mb-1">
						{tooltipData.count} {t("map.Servers")}
					</p>
				</div>
				<div
					className="border-t border-border pt-1"
					style={{
						maxHeight: "200px",
						overflowY: "auto",
					}}
				>
					{tooltipData.servers.map((server) => (
						<button
							key={server.id}
							type="button"
							className="flex items-center gap-1.5 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
							onClick={() => {
								sessionStorage.setItem("fromMainPage", "true");
								navigate(`/server/${server.id}`);
							}}
						>
							<span
								className={`h-1.5 w-1.5 shrink-0 rounded-full ${server.status ? "bg-status-online" : "bg-status-offline"}`}
							/>
							<span className="truncate text-xs">{server.name}</span>
						</button>
					))}
				</div>
			</m.div>
		</AnimatePresence>
	);
});

export default MapTooltip;
