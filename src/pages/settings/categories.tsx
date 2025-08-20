import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  TextField,
} from "@mui/material";
import { useTheme } from "../../contexts/ThemeContext";
import { TelegramWebApp, Category } from "../../../utils/types";
import {
  fetchCategories,
  updateCategory,
  deleteCategory,
} from "../../../services/categories";
import { DeleteOutline, EditOutlined } from "@mui/icons-material";
import BottomSheet from "../../../components/common/BottomSheet";
import { SettingsLayout } from "../../../components/settings/SettingsLayout";

const CategoriesSettings = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [staticCategories, setStaticCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    category: Category | null;
    newName: string;
  }>({
    open: false,
    category: null,
    newName: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: Category | null;
  }>({
    open: false,
    category: null,
  });
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      const response = await fetchCategories(user.id.toString(), initData);
      setUserCategories(response.userCategories || []);
      setStaticCategories(response.staticCategories || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      showPopup({
        title: "Error",
        message: "Failed to load categories",
        buttons: [{ type: "ok" }],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initializeApp = () => {
        try {
          init();
          backButton.mount();
          backButton.show();
          backButton.onClick(() => router.back());

          mainButton.mount();
          setMainButtonParams({
            isVisible: false,
          });

          loadCategories();
        } catch (err) {
          console.error("Error setting up page:", err);
        }
      };

      // Initialize immediately instead of using setTimeout
      initializeApp();
    }
  }, [router, loadCategories]);

  const handleEditCategory = (category: Category) => {
    setEditDialog({
      open: true,
      category,
      newName: category.name,
    });
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteDialog({
      open: true,
      category,
    });
  };

  const confirmEdit = async () => {
    if (!editDialog.category || !editDialog.newName.trim()) return;

    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      await updateCategory(
        editDialog.category.id,
        editDialog.newName.trim(),
        user.id.toString(),
        initData
      );

      // Update the appropriate category list
      const isUserCategory = userCategories.some(
        (cat) => cat.id === editDialog.category!.id
      );
      if (isUserCategory) {
        setUserCategories((prev) =>
          prev.map((cat) =>
            cat.id === editDialog.category!.id
              ? { ...cat, name: editDialog.newName.trim() }
              : cat
          )
        );
      } else {
        setStaticCategories((prev) =>
          prev.map((cat) =>
            cat.id === editDialog.category!.id
              ? { ...cat, name: editDialog.newName.trim() }
              : cat
          )
        );
      }

      setEditDialog({ open: false, category: null, newName: "" });

      showPopup({
        title: "Success",
        message: "Category updated successfully",
        buttons: [{ type: "ok" }],
      });
    } catch (error) {
      console.error("Error updating category:", error);
      showPopup({
        title: "Error",
        message: "Failed to update category",
        buttons: [{ type: "ok" }],
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      await deleteCategory(
        deleteDialog.category.id,
        user.id.toString(),
        initData
      );

      // Remove from the appropriate category list
      const isUserCategory = userCategories.some(
        (cat) => cat.id === deleteDialog.category!.id
      );
      if (isUserCategory) {
        setUserCategories((prev) =>
          prev.filter((cat) => cat.id !== deleteDialog.category!.id)
        );
      } else {
        setStaticCategories((prev) =>
          prev.filter((cat) => cat.id !== deleteDialog.category!.id)
        );
      }

      setDeleteDialog({ open: false, category: null });

      showPopup({
        title: "Success",
        message: "Category deleted successfully",
        buttons: [{ type: "ok" }],
      });
    } catch (error) {
      setDeleteDialog({ open: false, category: null });

      let errorMessage = "Failed to delete category";
      if (error instanceof Error) {
        if (error.message.includes("Cannot delete category that is in use")) {
          errorMessage = "Cannot delete category that is in use";
        }
      }

      setErrorDialog({
        open: true,
        message: errorMessage,
      });
    }
  };

  // Categories are now already segregated from the API

  if (isLoading) {
    return (
      <SettingsLayout title="Categories">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              sx={{ height: 50, borderRadius: 2, bgcolor: colors.surface }}
            />
          ))}
        </Box>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Categories">

      {/* User Categories - Show First */}
      <Box sx={{ mb: userCategories.length > 0 ? 2 : 1.5 }}>
        <Typography
          variant="overline"
          sx={{
            color: colors.primary,
            fontWeight: 600,
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 0.5,
            display: "block",
          }}
        >
          CUSTOM CATEGORIES
        </Typography>
        {userCategories.length > 0 ? (
          <Card sx={{ borderRadius: 2, bgcolor: colors.card, boxShadow: 0 }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              {userCategories.map((category, index) => (
                <Box
                  key={category.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.5,
                    px: 2,
                    borderBottom:
                      index < userCategories.length - 1
                        ? `1px solid ${colors.surface}`
                        : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      sx={{
                        color: colors.text,
                        fontSize: "0.95rem",
                        fontWeight: 500,
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditCategory(category)}
                      sx={{ color: colors.primary }}
                    >
                      <EditOutlined sx={{ fontSize: "1rem" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCategory(category)}
                      sx={{ color: colors.error || "#ff4444" }}
                    >
                      <DeleteOutline sx={{ fontSize: "1rem" }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 2, bgcolor: colors.card, boxShadow: 0 }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ py: 1, px: 2, textAlign: "center" }}>
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: "0.9rem",
                  }}
                >
                  No custom categories yet
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Static Categories - Show Second */}
      {staticCategories.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 0.5,
              display: "block",
            }}
          >
            DEFAULT CATEGORIES
          </Typography>
          <Card sx={{ borderRadius: 2, bgcolor: colors.card, boxShadow: 0 }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              {staticCategories.map((category, index) => (
                <Box
                  key={category.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.5,
                    px: 2,
                    borderBottom:
                      index < staticCategories.length - 1
                        ? `1px solid ${colors.surface}`
                        : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      sx={{
                        color: colors.text,
                        fontSize: "0.95rem",
                        fontWeight: 500,
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: colors.textSecondary,
                      fontSize: "0.8rem",
                    }}
                  >
                    Default
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      )}

      {userCategories.length === 0 && staticCategories.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: "1rem",
            }}
          >
            No categories found
          </Typography>
        </Box>
      )}

      {/* Edit Bottom Sheet */}
      <BottomSheet
        open={editDialog.open}
        onClose={() =>
          setEditDialog({ open: false, category: null, newName: "" })
        }
        title="Edit Category"
        buttons={[
          {
            text: "Save Changes",
            onClick: confirmEdit,
            variant: "primary",
            disabled: !editDialog.newName.trim(),
          },
          {
            text: "Cancel",
            onClick: () =>
              setEditDialog({ open: false, category: null, newName: "" }),
            variant: "secondary",
          },
        ]}
      >
        <TextField
          fullWidth
          value={editDialog.newName}
          onChange={(e) =>
            setEditDialog((prev) => ({ ...prev, newName: e.target.value }))
          }
          placeholder="Enter category name"
          autoFocus
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: colors.inputBg || colors.surface,
              color: colors.text,
              borderRadius: 2,
              fontSize: "1rem",
              minHeight: "auto",
              border: `2px solid transparent`,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#007AFF40",
              },
              "&.Mui-focused": {
                borderColor: "#007AFF",
                boxShadow: "0 0 0 3px rgba(0, 122, 255, 0.1)",
              },
              "& input": {
                py: 1,
                px: 1.75,
                fontWeight: 500,
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiInputBase-input::placeholder": {
              color: colors.textSecondary,
              opacity: 0.6,
              fontWeight: 400,
            },
          }}
        />
      </BottomSheet>

      {/* Delete Bottom Sheet */}
      <BottomSheet
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteDialog.category?.name}"? This action cannot be undone.`}
        buttons={[
          {
            text: "Delete",
            onClick: confirmDelete,
            variant: "destructive",
          },
          {
            text: "Cancel",
            onClick: () => setDeleteDialog({ open: false, category: null }),
            variant: "secondary",
          },
        ]}
      />

      {/* Error Bottom Sheet */}
      <BottomSheet
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: "" })}
        title="Error"
        description={errorDialog.message}
        buttons={[
          {
            text: "OK",
            onClick: () => setErrorDialog({ open: false, message: "" }),
            variant: "primary",
          },
        ]}
      />
    </SettingsLayout>
  );
};

export default CategoriesSettings;
