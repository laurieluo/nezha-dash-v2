import { m } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function TabSwitch({
	tabs,
	currentTab,
	setCurrentTab,
}: {
	tabs: string[];
	currentTab: string;
	setCurrentTab: (tab: string) => void;
}) {
	const { t } = useTranslation();
	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;
	return (
		<div className="z-50 flex flex-col items-start rounded-[50px] server-info-tab">
			<div
				className={cn(
					"flex items-center gap-1 rounded-[50px] bg-secondary p-[3px]",
					{
						"bg-secondary/70": customBackgroundImage,
					},
				)}
			>
				{tabs.map((tab: string) => (
					<div
						key={tab}
						onClick={() => setCurrentTab(tab)}
						className={cn(
							"relative cursor-pointer rounded-3xl px-2.5 py-[8px] text-[13px] font-semibold transition-all duration-500",
							currentTab === tab ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{currentTab === tab && (
							<m.div
								layoutId="tab-switch-active"
								className="absolute inset-0 z-10 h-full w-full content-center bg-card shadow-[0_0_0_1px_hsl(var(--border)),0_4px_24px_rgb(0_0_0/0.05)]"
								style={{
									originY: "0px",
									borderRadius: 46,
								}}
							/>
						)}
						<div className="relative z-20 flex items-center gap-1">
							<p className="whitespace-nowrap">{t(`tabSwitch.${tab}`)}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
