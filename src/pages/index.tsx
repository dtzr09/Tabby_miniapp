import React, { useState } from "react";
import Dashboard from "../../components/dashboard";
import Settings from "../../components/settings/Settings";

type MainView = "dashboard" | "settings";

const MainPage = () => {
  const [currentView, setCurrentView] = useState<MainView>("dashboard");

  const handleViewChange = (view: MainView) => {
    setCurrentView(view);
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
