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
      <div style={{ display: currentView === "dashboard" ? "block" : "none" }}>
        <Dashboard onViewChange={handleViewChange} />
      </div>
      <div style={{ display: currentView === "settings" ? "block" : "none" }}>
        <Settings onViewChange={handleViewChange} />
      </div>
    </>
  );
};

export default MainPage;
