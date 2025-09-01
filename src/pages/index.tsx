import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Dashboard from "../../components/dashboard";
import Settings from "../../components/settings/Settings";
import {
  saveNavigationState,
  loadNavigationState,
} from "../../utils/navigationState";

type MainView = "dashboard" | "settings";

const MainPage = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<MainView>("dashboard");

  // Load view from URL params or saved state on mount
  useEffect(() => {
    const { view, tgWebAppStartParam } = router.query;

    // Check Telegram start parameter first
    if (
      tgWebAppStartParam === "settings" ||
      tgWebAppStartParam === "dashboard"
    ) {
      setCurrentView(tgWebAppStartParam as MainView);
    } else if (view === "settings" || view === "dashboard") {
      setCurrentView(view);
    } else {
      // Fallback to saved state if no URL param
      const savedState = loadNavigationState();
      if (savedState?.currentView) {
        setCurrentView(savedState.currentView);
      }
    }
  }, [router.query]);

  const handleViewChange = (view: MainView) => {
    setCurrentView(view);

    // Save current view to localStorage
    const existingState = loadNavigationState();
    saveNavigationState({
      selectedGroupId: existingState?.selectedGroupId || null,
      isGroupView: existingState?.isGroupView || false,
      currentView: view,
    });
  };

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard onViewChange={handleViewChange} />
      )}
      {currentView === "settings" && (
        <Settings onViewChange={handleViewChange} />
      )}
    </>
  );
};

export default MainPage;
