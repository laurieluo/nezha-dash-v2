import type {
	LoginUserResponse,
	MetricPeriod,
	MetricType,
	MonitorResponse,
	ServerGroupResponse,
	ServerMetricsResponse,
	ServiceResponse,
	SettingResponse,
} from "@/types/nezha-api";
import {
	getMockLoginUser,
	getMockMonitor,
	getMockServerGroup,
	getMockServerMetrics,
	getMockService,
	getMockSetting,
	isMockMode,
} from "./mock-data";

let lastestRefreshTokenAt = 0;

export const fetchServerGroup = async (): Promise<ServerGroupResponse> => {
	if (isMockMode()) return getMockServerGroup();

	const response = await fetch("/api/v1/server-group");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchLoginUser = async (): Promise<LoginUserResponse> => {
	if (isMockMode()) return getMockLoginUser();

	const response = await fetch("/api/v1/profile");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}

	// auto refresh token
	if (
		document.cookie &&
		(!lastestRefreshTokenAt ||
			Date.now() - lastestRefreshTokenAt > 1000 * 60 * 60)
	) {
		lastestRefreshTokenAt = Date.now();
		fetch("/api/v1/refresh-token");
	}

	return data;
};

export type MonitorPeriod = "1d" | "7d" | "30d";

export const fetchMonitor = async (
	server_id: number,
	period?: MonitorPeriod,
): Promise<MonitorResponse> => {
	if (isMockMode()) return getMockMonitor(server_id, period);

	const query = period ? `?period=${period}` : "";
	const response = await fetch(`/api/v1/server/${server_id}/service${query}`);
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchService = async (): Promise<ServiceResponse> => {
	if (isMockMode()) return getMockService();

	const response = await fetch("/api/v1/service");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchSetting = async (): Promise<SettingResponse> => {
	if (isMockMode()) return getMockSetting();

	const response = await fetch("/api/v1/setting");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchServerMetrics = async (
	server_id: number,
	metric: MetricType,
	period?: MetricPeriod,
): Promise<ServerMetricsResponse> => {
	if (isMockMode()) return getMockServerMetrics(server_id, metric, period);

	const query = period
		? `?metric=${metric}&period=${period}`
		: `?metric=${metric}`;
	const response = await fetch(`/api/v1/server/${server_id}/metrics${query}`);
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};
