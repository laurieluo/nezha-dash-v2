import { m } from "framer-motion";
import { createRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function GroupSwitch({
	tabs,
	currentTab,
	setCurrentTab,
}: {
	tabs: string[];
	currentTab: string;
	setCurrentTab: (tab: string) => void;
}) {
	const customBackgroundImage =
		(window.CustomBackgroundImage as string) !== ""
			? window.CustomBackgroundImage
			: undefined;

	const scrollRef = useRef<HTMLDivElement>(null);
	const tagRefs = useRef(tabs.map(() => createRef<HTMLDivElement>()));

	useEffect(() => {
		const container = scrollRef.current;
		if (!container) return;

		const isOverflowing = container.scrollWidth > container.clientWidth;
		if (!isOverflowing) return;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			container.scrollLeft += e.deltaY;
		};

		container.addEventListener("wheel", onWheel, { passive: false });

		return () => {
			container.removeEventListener("wheel", onWheel);
		};
	}, []);

	useEffect(() => {
		if (tabs.length === 1 && tabs[0] === "All") {
			setCurrentTab("All");
			return;
		}
		const savedGroup = sessionStorage.getItem("selectedGroup");
		if (savedGroup && tabs.includes(savedGroup)) {
			setCurrentTab(savedGroup);
		}
	}, [tabs, setCurrentTab]);

	useEffect(() => {
		const currentTagRef = tagRefs.current[tabs.indexOf(currentTab)];

		if (currentTagRef?.current) {
			currentTagRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [currentTab, tabs.indexOf]);

	if (tabs.length === 1 && tabs[0] === "All") {
		return null;
	}

	return (
		<div
			ref={scrollRef}
			className="scrollbar-hidden z-50 flex flex-col items-start overflow-x-scroll rounded-[50px]"
		>
			<div
				className={cn(
					"flex items-center gap-1 rounded-[50px] bg-secondary p-[3px]",
					{
						"bg-secondary/70": customBackgroundImage,
					},
				)}
			>
				{tabs.map((tab: string, index: number) => (
					<div
						key={tab}
						ref={tagRefs.current[index]}
						onClick={() => setCurrentTab(tab)}
						className={cn(
							"relative cursor-pointer rounded-3xl px-2.5 py-[8px] text-[13px] font-semibold transition-all duration-500",
							currentTab === tab ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{currentTab === tab && (
							<m.div
								layoutId="tab-switch"
								className="absolute inset-0 z-10 h-full w-full content-center bg-card shadow-[0_0_0_1px_hsl(var(--border)),0_4px_24px_rgb(0_0_0/0.05)]"
								style={{
									originY: "0px",
									borderRadius: 46,
								}}
							/>
						)}
						<div className="relative z-20 flex items-center gap-1">
							<p className="whitespace-nowrap">{tab}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
