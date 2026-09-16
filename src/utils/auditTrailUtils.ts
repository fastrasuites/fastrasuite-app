import { AuditTrail } from "@/types/auditTrail";
import {
  History,
  PlusCircle,
  FileEdit,
  XCircle,
  CheckCircle2,
  LogIn,
} from "lucide-react";

export function formatActorDisplay(item: AuditTrail | null | undefined): string {
  if (!item) return "System";
  if (item.actor_details) {
    if (typeof item.actor_details === "string") {
      try {
        const parsed = JSON.parse(item.actor_details);
        if (parsed.first_name || parsed.last_name) {
          return `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim();
        }
        if (parsed.email) return parsed.email;
        if (parsed.username) return parsed.username;
        if (parsed.name) return parsed.name;
      } catch {
        return item.actor_details;
      }
    } else if (typeof item.actor_details === "object") {
      const d = item.actor_details as any;
      return (
        `${d.first_name || ""} ${d.last_name || ""}`.trim() ||
        d.email ||
        d.username ||
        d.name ||
        `User #${d.id || item.actor}`
      );
    }
  }
  return item.actor ? `User #${item.actor}` : "System Automated";
}

export function formatFriendlyDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function getActionBadgeConfig(action?: string) {
  const act = (action || "").toUpperCase();
  if (act.includes("CREATE") || act.includes("NEW") || act.includes("ADD")) {
    return {
      label: "Created",
      icon: PlusCircle,
      bg: "bg-[#E2F2E9]",
      text: "text-[#2BA24D]",
      dot: "bg-[#2BA24D]",
    };
  }
  if (
    act.includes("UPDATE") ||
    act.includes("EDIT") ||
    act.includes("PATCH") ||
    act.includes("CHANGE")
  ) {
    return {
      label: "Updated",
      icon: FileEdit,
      bg: "bg-[#E8F0FE]",
      text: "text-[#1A73E8]",
      dot: "bg-[#1A73E8]",
    };
  }
  if (
    act.includes("DELETE") ||
    act.includes("REMOVE") ||
    act.includes("CANCEL")
  ) {
    return {
      label: "Deleted",
      icon: XCircle,
      bg: "bg-[#FCE8E6]",
      text: "text-[#C5221F]",
      dot: "bg-[#C5221F]",
    };
  }
  if (
    act.includes("APPROVE") ||
    act.includes("VALIDATE") ||
    act.includes("SUBMIT")
  ) {
    return {
      label: "Approved",
      icon: CheckCircle2,
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-700",
    };
  }
  if (act.includes("LOGIN") || act.includes("AUTH")) {
    return {
      label: "Login",
      icon: LogIn,
      bg: "bg-amber-50",
      text: "text-amber-800",
      dot: "bg-amber-600",
    };
  }
  return {
    label: action || "Event",
    icon: History,
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
  };
}
