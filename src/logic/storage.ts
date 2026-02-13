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
