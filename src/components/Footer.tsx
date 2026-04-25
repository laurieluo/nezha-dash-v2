import type React from "react";

const Footer: React.FC = () => {
	const isMac = /macintosh|mac os x/i.test(navigator.userAgent);

	return (
		<footer className="mx-auto w-full max-w-5xl px-4 lg:px-0 pb-4 server-footer">
			<section className="flex flex-col">
				<section className="mt-1 flex items-center sm:flex-row flex-col justify-between gap-2 text-[13px] font-light tracking-tight text-muted-foreground/50 server-footer-name">
					<div className="flex items-center gap-1">
						Laurie's Server Sashboard @{new Date().getFullYear()}
					</div>
					<div className="server-footer-theme flex flex-col items-center sm:items-end">
						<p className="mt-1 text-[13px] font-light tracking-tight text-muted-foreground/50">
							<kbd className="pointer-events-none mx-1 inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
								{isMac ? <span className="text-xs">⌘</span> : "Ctrl "}K
							</kbd>
						</p>
					</div>
				</section>
			</section>
		</footer>
	);
};

export default Footer;
