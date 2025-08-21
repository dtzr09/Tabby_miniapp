import React, { useState } from "react";
import Dashboard from "../../components/dashboard";
import Settings from "../../components/settings/Settings";

type MainView = "dashboard" | "settings";

const MainPage = () => {
  const [currentView, setCurrentView] = useState<MainView>("dashboard");

  const handleViewChange = (view: MainView) => {
    setCurrentView(view);
  };

  switch (currentView) {
    case "settings":
      return <Settings onViewChange={handleViewChange} />;
    case "dashboard":
    default:
      return <Dashboard onViewChange={handleViewChange} />;
  }
};

export default MainPage;
