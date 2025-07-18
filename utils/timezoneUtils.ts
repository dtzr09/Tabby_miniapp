export const formatDate = (date: Date | string, timezone: string = "UTC"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    }).format(dateObj);
  } catch (error) {
    // Fallback to local timezone if the specified timezone is invalid
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  }
};

export const formatDateTime = (date: Date | string, timezone: string = "UTC"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(dateObj);
  } catch (error) {
    // Fallback to local timezone
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }
};

export const formatTime = (date: Date | string, timezone: string = "UTC"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(dateObj);
  } catch (error) {
    // Fallback to local timezone
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }
};

export const formatRelativeTime = (date: Date | string, timezone: string = "UTC"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  try {
    // Convert both dates to the target timezone for comparison
    const targetDate = new Date(dateObj.toLocaleString("en-US", { timeZone: timezone }));
    const targetNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    const diffInMs = targetNow.getTime() - targetDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  } catch (error) {
    // Fallback to simple relative time calculation
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  }
};

export const getCurrentTimeInTimezone = (timezone: string = "UTC"): Date => {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + new Date().toLocaleString("en-US", { timeZone: timezone }));
    return targetTime;
  } catch (error) {
    return new Date();
  }
}; 