import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { ExpandMoreOutlined } from "@mui/icons-material";

interface DebugLog {
  timestamp: string;
  event: string;
  data: string;
}

interface CacheDataInfo {
  key: string[];
  hasData: boolean;
  expenseCount?: number;
  incomeCount?: number;
  groupCount?: number;
  categoryCount?: number;
  lastUpdated?: number;
}

interface CacheData {
  allEntries: CacheDataInfo;
  groups: CacheDataInfo;
  categories: CacheDataInfo;
}

export const ExpenseDebugPanel = ({
  selectedGroupId,
}: {
  selectedGroupId?: string;
}) => {
  const { colors } = useTheme();
  const { user: tgUser } = useTelegramWebApp();
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [cacheData, setCacheData] = useState<CacheData>({
    allEntries: { key: [], hasData: false },
    groups: { key: [], hasData: false },
    categories: { key: [], hasData: false },
  });

  const addLog = (event: string, data: unknown) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      data:
        typeof data === "object" ? JSON.stringify(data, null, 2) : String(data),
    };
    setLogs((prev) => [log, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  const refreshCacheData = useCallback(() => {
    if (!tgUser) return;

    const allEntriesKey = [
      "allEntries",
      tgUser.id.toString(),
      selectedGroupId,
    ].filter(Boolean) as string[];
    const groupsKey = ["groupsWithExpenses", tgUser.id.toString()];
    const categoriesKey = ["categories", tgUser.id.toString()];

    const allEntriesData = queryClient.getQueryData(allEntriesKey) as
      | {
          expenses?: { length: number }[];
          income?: { length: number }[];
        }
      | undefined;
    const groupsData = queryClient.getQueryData(groupsKey) as
      | { length: number }[]
      | undefined;
    const categoriesData = queryClient.getQueryData(categoriesKey) as
      | {
          categories?: { length: number }[];
        }
      | undefined;

    setCacheData({
      allEntries: {
        key: allEntriesKey,
        hasData: !!allEntriesData,
        expenseCount: allEntriesData?.expenses?.length || 0,
        incomeCount: allEntriesData?.income?.length || 0,
        lastUpdated: queryClient.getQueryState(allEntriesKey)?.dataUpdatedAt,
      },
      groups: {
        key: groupsKey,
        hasData: !!groupsData,
        groupCount: groupsData?.length || 0,
        lastUpdated: queryClient.getQueryState(groupsKey)?.dataUpdatedAt,
      },
      categories: {
        key: categoriesKey,
        hasData: !!categoriesData,
        categoryCount: categoriesData?.categories?.length || 0,
        lastUpdated: queryClient.getQueryState(categoriesKey)?.dataUpdatedAt,
      },
    });

    addLog("Cache Refresh", "Manual cache data refresh");
  }, [tgUser, selectedGroupId, queryClient]);

  const forceInvalidateAll = async () => {
    if (!tgUser) return;

    addLog(
      "Force Invalidate Started",
      "Starting aggressive cache invalidation"
    );

    try {
      // Invalidate with broader patterns
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key.includes("allEntries") ||
            key.includes("groupsWithExpenses") ||
            key.includes("categories")
          );
        },
      });

      // Force refetch everything
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key.includes("allEntries") ||
            key.includes("groupsWithExpenses") ||
            key.includes("categories")
          );
        },
        type: "active",
      });

      addLog(
        "Force Invalidate Success",
        "All queries invalidated and refetched"
      );
    } catch (error) {
      addLog("Force Invalidate Error", error);
    }
  };

  const clearAllCache = () => {
    queryClient.clear();
    addLog("Cache Cleared", "All cache cleared");
    refreshCacheData();
  };

  useEffect(() => {
    refreshCacheData();
    // Removed constant auto-refresh - only refresh on mount and manual triggers
  }, [refreshCacheData]);

  // Listen to query cache changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" || event.type === "added") {
        addLog(`Query ${event.type}`, {
          queryKey: event.query.queryKey,
          state: event.query.state.status,
        });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  if (!tgUser) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 30,
        maxWidth: 350,
        zIndex: 9999,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        maxHeight: "80vh",
        overflow: "auto",
      }}
    >
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
          <Typography variant="h6" sx={{ color: colors.primary }}>
            🐛 Debug Panel
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ p: 2 }}>
            {/* Controls */}
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <Button
                size="small"
                onClick={refreshCacheData}
                variant="outlined"
              >
                Refresh
              </Button>
              <Button
                size="small"
                onClick={forceInvalidateAll}
                variant="contained"
                color="warning"
              >
                Force Refetch
              </Button>
              <Button
                size="small"
                onClick={clearAllCache}
                variant="contained"
                color="error"
              >
                Clear Cache
              </Button>
            </Box>

            {/* Cache Status */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: colors.text }}>
              Cache Status:
            </Typography>
            <Box
              sx={{ fontSize: "0.75rem", mb: 2, color: colors.textSecondary }}
            >
              {Object.entries(cacheData).map(([key, data]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <strong>{key}:</strong> {data.hasData ? "✅" : "❌"}(
                  {data.expenseCount ||
                    data.groupCount ||
                    data.categoryCount ||
                    0}{" "}
                  items)
                  <br />
                  <span style={{ fontSize: "0.7rem" }}>
                    Updated:{" "}
                    {data.lastUpdated
                      ? new Date(data.lastUpdated).toLocaleTimeString()
                      : "Never"}
                  </span>
                </Box>
              ))}
            </Box>

            {/* Query Keys */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: colors.text }}>
              Active Query Keys:
            </Typography>
            <Box
              sx={{ fontSize: "0.7rem", mb: 2, color: colors.textSecondary }}
            >
              {Object.entries(cacheData).map(([key, data]) => (
                <Box key={key} sx={{ mb: 1, wordBreak: "break-all" }}>
                  <strong>{key}:</strong> {JSON.stringify(data.key)}
                </Box>
              ))}
            </Box>

            {/* Recent Logs */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: colors.text }}>
              Recent Events:
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: "auto", fontSize: "0.7rem" }}>
              {logs.map((log, i) => (
                <Box
                  key={i}
                  sx={{
                    mb: 1,
                    p: 1,
                    backgroundColor: colors.background,
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ color: colors.primary, fontWeight: "bold" }}>
                    [{log.timestamp}] {log.event}
                  </Box>
                  <Box
                    sx={{ color: colors.textSecondary, whiteSpace: "pre-wrap" }}
                  >
                    {log.data}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
