import { TelegramUser } from "../../dashboard";
import { TelegramWebApp } from "../../../utils/types";
import { showPopup } from "@telegram-apps/sdk";
import BottomSheet, { BottomSheetButton } from "../../common/BottomSheet";
import { invalidateExpenseCache } from "../../../utils/cache";

interface DeleteExpenseDialogProps {
  id: number;
  isIncome: boolean;
  onSuccess: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  tgUser: TelegramUser | null;
  deleteFromCache?: () => void;
  onError?: () => void;
}

export default function DeleteExpenseDialog({
  id,
  isIncome,
  onSuccess,
  showConfirm,
  setShowConfirm,
  deleteFromCache,
  onError,
}: DeleteExpenseDialogProps) {

  const handleDelete = async () => {
    try {
      // Optimistically update cache and UI
      if (deleteFromCache) {
        deleteFromCache();
      }

      // Call onSuccess immediately for better UX
      onSuccess();
      setShowConfirm(false);

      // Make the API call in the background
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        throw new Error("Missing Telegram data");
      }

      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: user.id.toString(),
          initData,
          isIncome,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      // Invalidate expense cache after successful delete
      invalidateExpenseCache(user.id.toString());
      console.log("🗑️ Cache invalidated after expense delete");
    } catch (err) {
      console.error("Delete failed:", err);

      // Call onError to potentially revert optimistic update
      if (onError) {
        onError();
      }

      // Show error message
      showPopup({
        title: "Error",
        message: "Failed to delete. Please try again.",
        buttons: [{ type: "ok" }],
      });
    }
  };

  const buttons: BottomSheetButton[] = [
    {
      text: "Delete",
      onClick: handleDelete,
      variant: "destructive",
    },
    {
      text: "Cancel",
      onClick: () => setShowConfirm(false),
      variant: "secondary",
    },
  ];

  return (
    <BottomSheet
      open={showConfirm}
      onClose={() => setShowConfirm(false)}
      title={`Delete ${isIncome ? "Income" : "Expense"}`}
      description="This action cannot be undone."
      buttons={buttons}
    />
  );
}
