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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
      init();

      setTimeout(() => {
        try {
          backButton.mount();
          backButton.show();
          backButton.onClick(() => {
            router.push("/settings");
          });

          mainButton.mount();
          setMainButtonParams({
            isVisible: false,
          });

          loadCategories();
        } catch (err) {
          console.error("Error setting up page:", err);
        }
      }, 0);
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
      <Box
        sx={{
          px: 1.5,
          pb: 1,
          minHeight: "100vh",
          background: colors.background,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: colors.text,
            mb: 1.5,
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            py: 0.5,
          }}
        >
          Categories
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              sx={{ height: 50, borderRadius: 2, bgcolor: colors.surface }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{ px: 1.5, pb: 1, minHeight: "100vh", background: colors.background }}
    >
      <Typography
        variant="h3"
        sx={{
          color: colors.text,
          mb: 1.5,
          fontWeight: 600,
          fontSize: "1.1rem",
          textAlign: "center",
          py: 0.5,
        }}
      >
        Categories
      </Typography>

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

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() =>
          setEditDialog({ open: false, category: null, newName: "" })
        }
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text }}>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={editDialog.newName}
            onChange={(e) =>
              setEditDialog((prev) => ({ ...prev, newName: e.target.value }))
            }
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: colors.inputBg,
                color: colors.text,
              },
              "& .MuiInputLabel-root": {
                color: colors.textSecondary,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setEditDialog({ open: false, category: null, newName: "" })
            }
            sx={{ color: colors.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmEdit}
            disabled={!editDialog.newName.trim()}
            sx={{ color: colors.primary }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text }}>Delete Category</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.text }}>
            Are you sure you want to delete &quot;{deleteDialog.category?.name}
            &quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, category: null })}
            sx={{ color: colors.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            sx={{ color: colors.error || "#ff4444" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: "" })}
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            borderRadius: 2,
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: colors.error || "#ff4444",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "1.2rem" }}>⚠️</Typography>
          Error
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.text, lineHeight: 1.5 }}>
            {errorDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setErrorDialog({ open: false, message: "" })}
            sx={{ color: colors.primary }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesSettings;
