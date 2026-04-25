import { cn, type PublicNoteData } from "@/lib/utils";

export default function PlanInfo({
	parsedData,
}: {
	parsedData: PublicNoteData;
}) {
	if (!parsedData || !parsedData.planDataMod) {
		return null;
	}

	const extraList =
		parsedData.planDataMod.extra.split(",").length > 1
			? parsedData.planDataMod.extra.split(",")
			: parsedData.planDataMod.extra.split(",")[0] === ""
				? []
				: [parsedData.planDataMod.extra];
	const networkRoutes = parsedData.planDataMod.networkRoute
		? parsedData.planDataMod.networkRoute.split(",")
		: [];

	return (
		<section className="flex gap-1 items-center flex-wrap mt-0.5">
			{parsedData.planDataMod.bandwidth !== "" && (
				<p
					className={cn(
						"text-[9px] bg-primary text-primary-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
					)}
				>
					{parsedData.planDataMod.bandwidth}
				</p>
			)}
			{parsedData.planDataMod.trafficVol !== "" && (
				<p
					className={cn(
						"text-[9px] bg-status-online text-status-online-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
					)}
				>
					{parsedData.planDataMod.trafficVol}
				</p>
			)}
			{parsedData.planDataMod.IPv4 === "1" && (
				<p
					className={cn(
						"text-[9px] bg-accent text-accent-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
					)}
				>
					IPv4
				</p>
			)}
			{parsedData.planDataMod.IPv6 === "1" && (
				<p
					className={cn(
						"text-[9px] bg-status-warning text-status-warning-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
					)}
				>
					IPv6
				</p>
			)}
			{parsedData.planDataMod.networkRoute && (
				<p
					className={cn(
						"text-[9px] bg-primary text-primary-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
					)}
				>
					{networkRoutes.map((route, index) => {
						return route + (index === networkRoutes.length - 1 ? "" : "｜");
					})}
				</p>
			)}
			{extraList.map((extra, index) => {
				return (
					<p
						key={index}
						className={cn(
							"text-[9px] bg-muted text-muted-foreground w-fit rounded-[5px] px-[3px] py-[1.5px]",
						)}
					>
						{extra}
					</p>
				);
			})}
		</section>
	);
}
