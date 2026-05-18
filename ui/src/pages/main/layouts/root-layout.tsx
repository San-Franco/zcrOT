import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { authApi } from "@/api";
import { detectionDeviceMappingsQuery } from "@/api/queries/detection-engine-queries";
import { notificationsQuery } from "@/api/queries/notification-queries";
import { otSecurityExposureFiltersQuery } from "@/api/queries/security-exposure-queries";
import { cn, getDashboardTimeRangeQueryParams } from "@/lib/utils";
import Navbar from "@/components/shared/navbar";
import Sidebar from "@/components/shared/sidebar";
import ScrollTopBtn from "@/components/btn/scroll-top-btn";
import { useMediaQuery } from "@uidotdev/usehooks";
import useClickOutside from "@/hooks/system/use-click-outside";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import useDeviceMappingsStore from "@/stores/device-mappings-store";
import useFiltersStore from "@/stores/filters-store";
import useNotiStore from "@/stores/noti-store";
import useUserStore from "@/stores/user-store";
import Loader from "@/components/shared/loader";

export default function RootLayout() {
  const location = useLocation()
  const navigation = useNavigation()
  const setDeviceMappings = useDeviceMappingsStore((state) => state.setMappings);
  const setFilters = useFiltersStore((state) => state.setFilters);
  const setNotis = useNotiStore((state) => state.setNotis);
  const setAuth = useUserStore((state) => state.setAuth);
  const clearAuth = useUserStore((state) => state.clearAuth);
  const { timeRange, customStart, customEnd } = useMemo(
    () => getDashboardTimeRangeQueryParams(new URLSearchParams(location.search)),
    [location.search],
  );
  const { data: securityExposureFilters } = useSuspenseQuery(
    otSecurityExposureFiltersQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );
  const { data: deviceMappings } = useSuspenseQuery(detectionDeviceMappingsQuery());
  const { data: notifications } = useQuery(notificationsQuery());
  const mainRef = useRef<HTMLDivElement>(null!);
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);

  useClickOutside(sidebarRef, () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useEffect(() => {
    setFilters({
      protocols: securityExposureFilters.protocols,
      severity: securityExposureFilters.severity,
      verdict: securityExposureFilters.verdict,
      identity: securityExposureFilters.identity,
    });
  }, [securityExposureFilters, setFilters]);

  useEffect(() => {
    setDeviceMappings(deviceMappings);
  }, [deviceMappings, setDeviceMappings]);

  useEffect(() => {
    setNotis(notifications ?? []);
  }, [notifications, setNotis]);

  useEffect(() => {
    let isMounted = true;

    const syncCurrentSession = async () => {
      try {
        const res = await authApi.get<AuthSessionResponse>("auth/me");
        if (isMounted && res.status === 200 && res.data?.user) {
          setAuth(res.data.user);
        }
      } catch {
        if (isMounted) {
          clearAuth();
        }
      }
    };

    void syncCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setAuth]);

  const shouldShowGlobalLoader = navigation.state === 'loading'
    && (!navigation.location || navigation.location.pathname !== location.pathname)

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity md:hidden",
          !collapsed && "pointer-events-auto bg-black opacity-30",
        )}
        onClick={() => setCollapsed(true)}
      />
      {shouldShowGlobalLoader && <Loader />}
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => {
          if (!isDesktopDevice) {
            setCollapsed(true);
          }
        }}
      />
      <div
        className={cn(
          "flex h-screen flex-col transition-[margin] duration-300",
          collapsed ? "md:ml-17.5" : "md:ml-85",
        )}
      >
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main id="app-main-scroll-container" ref={mainRef} className="relative flex-1 overflow-x-hidden overflow-y-auto no-scrollbar">
          <div className="p-3 sm:p-4 lg:p-6">
            <Outlet />
            <ScrollTopBtn scrollContainerRef={mainRef} />
          </div>
        </main>
      </div>
    </>
  );
}
