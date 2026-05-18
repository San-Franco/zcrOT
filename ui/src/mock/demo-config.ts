export const DEMO_CUSTOMER_NAME =
  import.meta.env.VITE_DEMO_CUSTOMER_NAME || "ABC Industrial Co., Ltd.";

export const DEMO_SITE_NAME =
  import.meta.env.VITE_DEMO_SITE_NAME || "ABC Smart Energy Factory";

export const DEMO_ENVIRONMENT_NAME =
  import.meta.env.VITE_DEMO_ENVIRONMENT_NAME || "ABC OT Energy Monitoring Site";

export const DEMO_REPORT_TITLE = "zcrOT OT Cybersecurity Visibility Demo Report";

export const DEMO_INDUSTRY = "industrial energy / factory / solar + EV charging OT environment";

export const DEMO_MODE =
  (import.meta.env.VITE_APP_MODE || "demo").toLowerCase() === "demo"
  || (import.meta.env.VITE_USE_MOCKS || "true").toLowerCase() !== "false";

export const DEMO_ASSET_IPS = {
  router: "10.40.20.1",
  coreSwitch: "10.40.20.2",
  otGateway: "10.40.20.10",
  industrialCloudGateway: "10.40.20.20",
  evCharger: "10.40.20.42",
  engineeringWorkstation: "10.40.20.50",
  unknownClient: "10.40.20.199",
  externalCloud: "198.51.100.20",
  remoteMaintenance: "203.0.113.45",
  ntpPrimary: "192.0.2.123",
  ntpSecondary: "198.51.100.123",
} as const;

export const DEMO_ASSET_MACS = {
  router: "02:10:40:20:00:01",
  coreSwitch: "02:10:40:20:00:02",
  otGateway: "02:10:40:20:00:10",
  industrialCloudGateway: "02:10:40:20:00:20",
  evCharger: "02:10:40:20:00:42",
  engineeringWorkstation: "02:10:40:20:00:50",
  unknownClient: "02:10:40:20:01:99",
} as const;

