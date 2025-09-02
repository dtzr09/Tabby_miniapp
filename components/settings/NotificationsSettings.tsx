import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "../../src/contexts/ThemeContext";
import CustomToggle from "../common/CustomToggle";
import TimeDisplay from "../datetimepicker/TimeDisplay";
import HourTimePicker from "../common/HourTimePicker";

interface NotificationsSettingsProps {
  notificationsEnabled?: boolean;
  dailyReminderHour?: number;
  onUpdateNotifications: (enabled: boolean, hour?: number) => Promise<boolean>;
}

const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({
  notificationsEnabled,
  dailyReminderHour,
  onUpdateNotifications,
}) => {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(notificationsEnabled ?? true);
  const [reminderHour, setReminderHour] = useState(dailyReminderHour ?? 21);
  const [tempReminderHour, setTempReminderHour] = useState(
    dailyReminderHour ?? 21
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    setEnabled(notificationsEnabled ?? true);
    setReminderHour(dailyReminderHour ?? 21);
    setTempReminderHour(dailyReminderHour ?? 21);
  }, [notificationsEnabled, dailyReminderHour]);

  return (
    <Box>
      {/* Enable Notifications Toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.card,
          px: 1.5,
          py: 1,
          borderRadius: 3,
        }}
      >
        <Typography
          sx={{
            color: colors.text,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Enable Notifications
        </Typography>
        <CustomToggle
          checked={enabled}
          onChange={async (newEnabled) => {
            try {
              // Only update local state after successful API call
              const success = await onUpdateNotifications(newEnabled, reminderHour);
              if (success) {
                setEnabled(newEnabled);
              }
            } catch (error) {
              console.error("Failed to update notifications:", error);
              // Don't update local state on error - keep the original value
            }
          }}
        />
      </Box>

      {/* Time Options - Only show if notifications are enabled */}
      {enabled && (
        <Box
          sx={{
            mt: 3,
            backgroundColor: colors.card,
            px: 1.5,
            py: 1,
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Every evening (9:00 PM) Option */}
          <Box
            onClick={async () => {
              try {
                const success = await onUpdateNotifications(enabled, 21);
                if (success) {
                  setReminderHour(21);
                }
              } catch (error) {
                console.error("Failed to update reminder hour:", error);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.card,
              cursor: "pointer",
            }}
          >
            <Typography
              sx={{
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Every evening (9:00 PM)
            </Typography>
            {reminderHour === 21 && (
              <CheckIcon
                sx={{
                  color: colors.primary,
                  fontSize: "1.2rem",
                }}
              />
            )}
          </Box>

          {/* Custom Time Option */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <Typography
              sx={{
                color: colors.text,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Custom Time
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                position: "relative",
              }}
              id="time-display-container"
            >
              <TimeDisplay
                selectedHour={
                  reminderHour > 12
                    ? reminderHour - 12
                    : reminderHour === 0
                    ? 12
                    : reminderHour
                }
                selectedMinute={0}
                selectedPeriod={reminderHour >= 12 ? "PM" : "AM"}
                showTimePicker={showTimePicker}
                setShowTimePicker={(show) => {
                  setShowTimePicker(show);
                }}
                setShowMonthPicker={() => {}}
                showCaption={false}
                sx={{
                  marginTop: 0,
                  paddingTop: 0,
                  px: 0,
                  borderTop: "none",
                }}
                minified={true}
              />
              {reminderHour !== 21 && (
                <CheckIcon
                  sx={{
                    color: colors.primary,
                    fontSize: "1.2rem",
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Floating Time Picker */}
      {showTimePicker && (
        <HourTimePicker
          selectedHour={
            tempReminderHour > 12
              ? tempReminderHour - 12
              : tempReminderHour === 0
              ? 12
              : tempReminderHour
          }
          selectedPeriod={tempReminderHour >= 12 ? "PM" : "AM"}
          onHourChange={(hour12) => {
            const period = tempReminderHour >= 12 ? "PM" : "AM";
            let newHour24;
            if (period === "AM") {
              newHour24 = hour12 === 12 ? 0 : hour12;
            } else {
              newHour24 = hour12 === 12 ? 12 : hour12 + 12;
            }
            setTempReminderHour(newHour24);
          }}
          onPeriodChange={(period) => {
            const hour12 =
              tempReminderHour > 12
                ? tempReminderHour - 12
                : tempReminderHour === 0
                ? 12
                : tempReminderHour;
            let newHour24;
            if (period === "AM") {
              newHour24 = hour12 === 12 ? 0 : hour12;
            } else {
              newHour24 = hour12 === 12 ? 12 : hour12 + 12;
            }
            setTempReminderHour(newHour24);
          }}
          onClose={async () => {
            setShowTimePicker(false);
            try {
              const success = await onUpdateNotifications(enabled, tempReminderHour);
              if (success) {
                setReminderHour(tempReminderHour);
              } else {
                // Reset temp hour if update failed
                setTempReminderHour(reminderHour);
              }
            } catch (error) {
              console.error("Failed to update reminder hour:", error);
              // Reset temp hour if update failed
              setTempReminderHour(reminderHour);
            }
          }}
          anchorElementId="time-display-container"
        />
      )}
    </Box>
  );
};

export default NotificationsSettings;
