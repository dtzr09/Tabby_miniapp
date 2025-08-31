import React, { useState, useEffect } from "react";
import Dashboard from "../../components/dashboard";
import Settings from "../../components/settings/Settings";
import { saveNavigationState, loadNavigationState } from "../../utils/navigationState";

type MainView = "dashboard" | "settings";

const MainPage = () => {
  const [currentView, setCurrentView] = useState<MainView>("dashboard");

  // Load saved view on mount
  useEffect(() => {
    const savedState = loadNavigationState();
    if (savedState?.currentView) {
      setCurrentView(savedState.currentView);
    }
  }, []);

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
