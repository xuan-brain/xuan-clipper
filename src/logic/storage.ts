import type { DetectionConfig, ManualMark } from "./page-detector";
import { useWebExtensionStorage } from "~/composables/useWebExtensionStorage";
import { DEFAULT_DETECTION_CONFIG } from "./page-detector";

export const { data: storageDemo, dataReady: storageDemoReady } =
  useWebExtensionStorage("webext-demo", "Storage Demo");

export const { data: detectionConfig, dataReady: detectionConfigReady } =
  useWebExtensionStorage<DetectionConfig>(
    "detection-config",
    DEFAULT_DETECTION_CONFIG,
  );

export const { data: manualMarks, dataReady: manualMarksReady } =
  useWebExtensionStorage<ManualMark[]>("manual-marks", []);

/**
 * API 配置
 */
export interface ApiConfig {
  enabled: boolean;
  endpoint: string;
  timeout: number;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  enabled: true,
  endpoint: "http://127.0.0.1:3030/api/papers/import-html",
  timeout: 30000, // 30 seconds
};

export const { data: apiConfig } = useWebExtensionStorage<ApiConfig>(
  "api-config",
  DEFAULT_API_CONFIG,
);

/**
 * Clips API 配置
 */
export interface ClipsApiConfig {
  enabled: boolean;
  endpoint: string;
  timeout: number;
}

export const DEFAULT_CLIPS_API_CONFIG: ClipsApiConfig = {
  enabled: true,
  endpoint: "http://127.0.0.1:3030/api/clips",
  timeout: 30000, // 30 seconds
};

export const { data: clipsApiConfig } = useWebExtensionStorage<ClipsApiConfig>(
  "clips-api-config",
  DEFAULT_CLIPS_API_CONFIG,
);

/**
 * 语言设置
 */
export type LocaleCode = "zh" | "en";

export const DEFAULT_LOCALE: LocaleCode = "zh";

export const { data: appLocale } = useWebExtensionStorage<LocaleCode>(
  "app-locale",
  DEFAULT_LOCALE,
);
