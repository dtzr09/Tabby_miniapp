import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import TimeScrollPicker from "./TimeScrollPicker";
import PeriodScrollPicker from "./PeriodScrollPicker";
import MonthScrollPicker from "./MonthScrollPicker";
import YearScrollPicker from "./YearScrollPicker";

export interface DateTimePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const ExpenseDateTimePicker = ({ date, onDateChange }: DateTimePickerProps) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const hour = date.getHours();
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  });
  const [selectedMinute, setSelectedMinute] = useState(date.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState(
    date.getHours() >= 12 ? "PM" : "AM"
  );
  const { colors } = useTheme();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  const handleTimeChange = () => {
    const newDate = new Date(selectedDate);

    // Convert 12-hour format to 24-hour format
    let hour = selectedHour;
    if (selectedPeriod === "PM" && selectedHour !== 12) {
      hour = selectedHour + 12;
    } else if (selectedPeriod === "AM" && selectedHour === 12) {
      hour = 0;
    }

    newDate.setHours(hour);
    newDate.setMinutes(selectedMinute);

    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  // Update time when hour, minute, or period changes
  useEffect(() => {
    handleTimeChange();
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // Update local state when date prop changes
  useEffect(() => {
    setSelectedDate(date);
    const hour = date.getHours();
    setSelectedHour(hour === 0 ? 12 : hour > 12 ? hour - 12 : hour);
    setSelectedMinute(date.getMinutes());
    setSelectedPeriod(date.getHours() >= 12 ? "PM" : "AM");
  }, [date]);

  const handleContainerClick = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    }
  };

  return (
    <Box
      onClick={handleContainerClick}
      sx={{
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "20rem",
      }}
    >
      {/* Calendar/Time Picker Section */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: "gray.900",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            width: "100%",
            margin: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Month/Year Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <Button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              sx={{
                fontSize: "1rem",
                fontWeight: "medium",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                p: 1,
                color: colors.text,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {months[selectedDate.getMonth()]?.charAt(0).toUpperCase() +
                months[selectedDate.getMonth()]?.slice(1).toLowerCase()}{" "}
              {selectedDate.getFullYear()}
              <ChevronRightOutlined
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  transition: "transform 0.3s",
                  transform: showMonthPicker ? "rotate(90deg)" : "rotate(0deg)",
                }}
              />
            </Button>

            <Box sx={{ display: "flex" }}>
              <Button
                onClick={() => changeMonth(-1)}
                sx={{
                  p: 1,
                  color: colors.text,
                  minWidth: "auto",
                  borderRadius: 2,
                }}
              >
                <ChevronLeftOutlined fontSize="medium" />
              </Button>
              <Button
                onClick={() => changeMonth(1)}
                sx={{
                  p: 1,
                  color: colors.text,
                  minWidth: "auto",
                  borderRadius: 2,
                }}
              >
                <ChevronRightOutlined fontSize="medium" />
              </Button>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "16rem",
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: showMonthPicker ? 3 : 0,
              minHeight: "14rem",
            }}
          >
            {showMonthPicker ? (
              <Box sx={{ position: "relative", width: "100%" }}>
                {/* Single spanning selection overlay - full parent width */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    transform: "translateY(-50%)",
                    height: "2.2rem",
                    backgroundColor: "rgba(75, 85, 99, 0.4)",
                    borderRadius: 2.5,
                    zIndex: 10,
                  }}
                />

                {/* Month/Year Scroll Picker */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "0 auto",
                    alignContent: "center",
                  }}
                >
                  <Box>
                    <MonthScrollPicker
                      value={selectedDate.getMonth()}
                      onChange={(monthIndex) => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(monthIndex);
                        setSelectedDate(newDate);
                        onDateChange(newDate);
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      ml: -4,
                    }}
                  >
                    <YearScrollPicker
                      value={selectedDate.getFullYear()}
                      onChange={(year) => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(year);
                        setSelectedDate(newDate);
                        onDateChange(newDate);
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            ) : (
              /* Calendar Grid */
              <Box
                sx={{
                  width: "100%",
                  margin: "auto",
                  position: "relative",
                  height: "14rem",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "0.125rem",
                    mb: "0.25rem",
                  }}
                >
                  {weekDays.map((day) => (
                    <Box
                      key={day}
                      style={{
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: colors.textSecondary,
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "0.125rem",
                  }}
                >
                  {generateCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      style={{
                        textAlign: "center",
                        width: "100%",
                        height: "2rem",
                        transition: "background-color 0.3s",
                        backgroundColor:
                          day &&
                          day === selectedDate.getDate() &&
                          selectedDate.getMonth() === date.getMonth() &&
                          selectedDate.getFullYear() === date.getFullYear()
                            ? colors.primary
                            : "transparent",
                        border: "none",
                        color:
                          day &&
                          day === selectedDate.getDate() &&
                          selectedDate.getMonth() === date.getMonth() &&
                          selectedDate.getFullYear() === date.getFullYear()
                            ? colors.surface
                            : colors.text,
                        fontSize: "0.875rem",
                        borderRadius: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => {
                        if (day) {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(day);
                          setSelectedDate(newDate);
                          onDateChange(newDate);
                        }
                      }}
                      disabled={!day}
                    >
                      {day || ""}
                    </button>
                  ))}
                </Box>

                {/* Time Picker Overlay */}
                {showTimePicker && (
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      backgroundColor: colors.surface,
                      borderRadius: 2,
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      zIndex: 20,
                      width: "fit-content",
                      p: "0.25rem",
                      mx: 1,
                      boxShadow: "0 0 30px 8px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "0.8rem",
                          right: "0.8rem",
                          transform: "translateY(-50%)",
                          height: "2rem",
                          backgroundColor: "rgba(75, 85, 99,0.4)",
                          borderRadius: 3,
                          zIndex: 1,
                        }}
                      />
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          alignItems: "center",
                          py: 0.8,
                          px: 1,
                        }}
                      >
                        <TimeScrollPicker
                          type="hour"
                          value={selectedHour}
                          onChange={setSelectedHour}
                          max={12}
                        />
                        <TimeScrollPicker
                          type="minute"
                          value={selectedMinute}
                          onChange={setSelectedMinute}
                          max={59}
                        />
                        <PeriodScrollPicker
                          value={selectedPeriod}
                          onChange={setSelectedPeriod}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Time Display */}
          <Box
            sx={{
              width: "100%",
              margin: "auto",
              marginTop: "0.5rem",
              paddingTop: "0.5rem",
              px: "0.5rem",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: colors.text, fontSize: "1rem" }}>Time</span>
              <Button
                variant="text"
                onClick={() => setShowTimePicker(!showTimePicker)}
                sx={{
                  color: colors.text,
                  fontSize: "1rem",
                  letterSpacing: "0.05rem",
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  backgroundColor: colors.card,
                  borderRadius: 3,
                  px: 1,
                  py: 0.5,
                }}
              >
                {selectedHour}:{selectedMinute.toString().padStart(2, "0")} {""}
                {selectedPeriod}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpenseDateTimePicker;
