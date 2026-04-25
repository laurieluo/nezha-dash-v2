import type {
	LoginUserResponse,
	MetricPeriod,
	MetricType,
	MonitorResponse,
	NezhaServer,
	NezhaWebsocketResponse,
	ServerGroupResponse,
	ServerMetricsResponse,
	ServiceResponse,
	SettingResponse,
} from "@/types/nezha-api";

const MOCK_STORAGE_KEY = "monitoring-preview-mock";
type MockMonitorPeriod = "1d" | "7d" | "30d";

export function initMockModeFromUrl() {
	const params = new URLSearchParams(window.location.search);
	const mock = params.get("mock");

	if (mock === "1" || mock === "true") {
		localStorage.setItem(MOCK_STORAGE_KEY, "1");
		return;
	}

	if (mock === "0" || mock === "false") {
		localStorage.removeItem(MOCK_STORAGE_KEY);
	}
}

export function isMockMode() {
	return localStorage.getItem(MOCK_STORAGE_KEY) === "1";
}

const gib = 1024 ** 3;
const mib = 1024 ** 2;

const publicNote = JSON.stringify({
	billingDataMod: {
		startDate: "2026-04-01",
		endDate: "2026-12-31",
		autoRenewal: "1",
		cycle: "月",
		amount: "$9.90",
	},
	planDataMod: {
		bandwidth: "1Gbps",
		trafficVol: "2TB",
		trafficType: "monthly",
		IPv4: "1",
		IPv6: "1",
		networkRoute: "CN2,GIA",
		extra: "SSD,Backup",
	},
});

function wave(seed: number, min: number, max: number) {
	const t = Date.now() / 1000;
	const ratio = (Math.sin(t / 17 + seed) + Math.sin(t / 7 + seed * 2) + 2) / 4;
	return min + ratio * (max - min);
}

function isoNow(offsetMs = 0) {
	return new Date(Date.now() + offsetMs).toISOString();
}

function makeServer(
	id: number,
	name: string,
	country_code: string,
	platform: string,
	seed: number,
	offline = false,
): NezhaServer {
	const memTotal = (8 + id * 8) * gib;
	const diskTotal = (80 + id * 120) * gib;
	const cpu = wave(seed, 8, id === 3 ? 92 : 58);
	const memUsed = memTotal * (wave(seed + 1, 20, 76) / 100);
	const diskUsed = diskTotal * (wave(seed + 2, 24, 88) / 100);

	return {
		id,
		name,
		country_code,
		public_note: id === 1 ? publicNote : "",
		last_active: offline ? isoNow(-1000 * 60 * 8) : isoNow(),
		host: {
			platform,
			platform_version:
				platform === "darwin"
					? "15.4"
					: platform === "windows"
						? "Server 2022"
						: "24.04 LTS",
			cpu: [`${id + 2} vCPU Mock Processor`],
			gpu: id === 3 ? ["NVIDIA L4"] : [],
			mem_total: memTotal,
			disk_total: diskTotal,
			swap_total: 2 * gib,
			arch: id === 2 ? "arm64" : "amd64",
			boot_time: Math.floor((Date.now() - (7 + id * 3) * 86400 * 1000) / 1000),
			version: "v1.13.0-mock",
		},
		state: {
			cpu: offline ? 0 : cpu,
			mem_used: offline ? 0 : memUsed,
			swap_used: offline ? 0 : wave(seed + 3, 0.1, 1.2) * gib,
			disk_used: diskUsed,
			net_in_transfer: (id * 256 + wave(seed + 4, 20, 120)) * gib,
			net_out_transfer: (id * 96 + wave(seed + 5, 8, 80)) * gib,
			net_in_speed: offline ? 0 : wave(seed + 6, 1, 80) * mib,
			net_out_speed: offline ? 0 : wave(seed + 7, 0.5, 45) * mib,
			uptime: offline
				? 0
				: (7 + id * 3) * 86400 + Math.floor(wave(seed, 0, 3600)),
			load_1: offline ? 0 : wave(seed + 8, 0.1, 2.5),
			load_5: offline ? 0 : wave(seed + 9, 0.1, 2),
			load_15: offline ? 0 : wave(seed + 10, 0.1, 1.5),
			tcp_conn_count: offline ? 0 : Math.floor(wave(seed + 11, 40, 600)),
			udp_conn_count: offline ? 0 : Math.floor(wave(seed + 12, 10, 120)),
			process_count: offline ? 0 : Math.floor(wave(seed + 13, 80, 220)),
			temperatures: [
				{ Name: "CPU", Temperature: offline ? 0 : wave(seed + 14, 38, 76) },
			],
			gpu: id === 3 && !offline ? [wave(seed + 15, 12, 68)] : [],
		},
	};
}

export function getMockWebsocketData(): NezhaWebsocketResponse & {
	online: number;
} {
	const servers = [
		makeServer(1, "Tokyo Edge", "JP", "linux", 1),
		makeServer(2, "San Jose Core", "US", "linux", 2),
		makeServer(3, "Frankfurt GPU", "DE", "linux", 3),
		makeServer(4, "Singapore Backup", "SG", "darwin", 4),
		makeServer(5, "Offline Archive", "GB", "windows", 5, true),
	];

	return {
		now: Date.now(),
		online: servers.filter(
			(server) => Date.now() - new Date(server.last_active).getTime() <= 30000,
		).length,
		servers,
	};
}

export function getMockSetting(): SettingResponse {
	return {
		success: true,
		data: {
			config: {
				debug: true,
				language: "zh-CN",
				site_name: "Monitoring Preview",
				user_template: "",
				admin_template: "",
				custom_code: "",
			},
			version: "mock-preview",
			tsdb_enabled: true,
		},
	};
}

export function getMockServerGroup(): ServerGroupResponse {
	return {
		success: true,
		data: [
			{
				group: {
					id: 1,
					created_at: isoNow(-86400 * 1000),
					updated_at: isoNow(),
					name: "Production",
				},
				servers: [1, 2, 3],
			},
			{
				group: {
					id: 2,
					created_at: isoNow(-86400 * 1000),
					updated_at: isoNow(),
					name: "Archive",
				},
				servers: [4, 5],
			},
		],
	};
}

export function getMockLoginUser(): LoginUserResponse {
	return {
		success: true,
		data: {
			id: 1,
			username: "mock",
			password: "",
			created_at: isoNow(-86400 * 1000),
			updated_at: isoNow(),
		},
	};
}

export function getMockService(): ServiceResponse {
	const up: number[] = Array.from(
		{ length: 30 },
		(_, index) => 280 + (index % 6) * 3,
	);
	const down: number[] = Array.from({ length: 30 }, (_, index) =>
		index === 22 ? 18 : index % 11 === 0 ? 5 : 0,
	);
	const delay = Array.from({ length: 30 }, (_, index) =>
		Math.round(42 + wave(index, 0, 90)),
	);

	return {
		success: true,
		data: {
			services: {
				homepage: {
					service_name: "Homepage",
					current_up: 1,
					current_down: 0,
					total_up: up.reduce((a, b) => a + b, 0),
					total_down: down.reduce((a, b) => a + b, 0),
					delay,
					up,
					down,
				},
				api: {
					service_name: "API Gateway",
					current_up: 1,
					current_down: 0,
					total_up: up.reduce((a, b) => a + b, 0) - 20,
					total_down: down.reduce((a, b) => a + b, 0) + 20,
					delay: delay.map((value, index) => value + (index % 4) * 12),
					up: up.map((value, index) => value - (index % 7)),
					down: down.map((value, index) => value + (index % 9 === 0 ? 8 : 0)),
				},
			},
			cycle_transfer_stats: {
				monthly: {
					name: "Monthly Transfer",
					from: "2026-04-01",
					to: "2026-04-30",
					max: 2 * 1024 * gib,
					min: 0,
					server_name: {
						"1": "Tokyo Edge",
						"2": "San Jose Core",
					},
					transfer: {
						"1": 0.84 * 1024 * gib,
						"2": 1.22 * 1024 * gib,
					},
					next_update: {
						"1": isoNow(3600 * 1000),
						"2": isoNow(7200 * 1000),
					},
				},
			},
		},
	};
}

function periodPoints(period?: MetricPeriod | MockMonitorPeriod) {
	if (period === "30d") return { count: 90, step: 8 * 60 * 60 * 1000 };
	if (period === "7d") return { count: 84, step: 2 * 60 * 60 * 1000 };
	return { count: 72, step: 20 * 60 * 1000 };
}

export function getMockMonitor(
	serverId: number,
	period?: MockMonitorPeriod,
): MonitorResponse {
	const { count, step } = periodPoints(period);
	const end = Date.now();
	const created_at = Array.from(
		{ length: count },
		(_, index) => end - (count - index - 1) * step,
	);

	return {
		success: true,
		data: ["Tokyo", "San Jose", "Frankfurt"].map((name, index) => ({
			monitor_id: index + 1,
			monitor_name: name,
			display_index: 10 - index,
			server_id: serverId,
			server_name:
				getMockWebsocketData().servers.find((server) => server.id === serverId)
					?.name || "Mock Server",
			created_at,
			avg_delay: created_at.map((_, pointIndex) =>
				Math.round(wave(serverId + index + pointIndex / 8, 20, 180)),
			),
			packet_loss: created_at.map((_, pointIndex) =>
				Number(wave(serverId + index + pointIndex / 11, 0, 3).toFixed(2)),
			),
		})),
	};
}

export function getMockServerMetrics(
	serverId: number,
	metric: MetricType,
	period?: MetricPeriod,
): ServerMetricsResponse {
	const { count, step } = periodPoints(period);
	const end = Date.now();

	const ranges: Record<string, [number, number]> = {
		cpu: [8, 72],
		memory: [20, 78],
		swap: [0, 35],
		disk: [24, 88],
		net_in_speed: [1 * mib, 90 * mib],
		net_out_speed: [0.5 * mib, 50 * mib],
		net_in_transfer: [100 * gib, 900 * gib],
		net_out_transfer: [40 * gib, 420 * gib],
		load1: [0.1, 2.6],
		load5: [0.1, 2.1],
		load15: [0.1, 1.6],
		tcp_conn: [40, 640],
		udp_conn: [10, 160],
		process_count: [80, 240],
		temperature: [38, 78],
		uptime: [86400, 86400 * 22],
		gpu: [8, 74],
	};
	const [min, max] = ranges[metric] || [0, 100];

	return {
		success: true,
		data: {
			server_id: serverId,
			server_name:
				getMockWebsocketData().servers.find((server) => server.id === serverId)
					?.name || "Mock Server",
			metric,
			data_points: Array.from({ length: count }, (_, index) => ({
				ts: end - (count - index - 1) * step,
				value: wave(serverId + index / 6, min, max),
			})),
		},
	};
}
