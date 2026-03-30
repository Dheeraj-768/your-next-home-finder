import { useState } from "react";
import { Bell, Check, X, Upload, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Notification } from "@/data/rentData";

const iconMap: Record<Notification["type"], typeof Bell> = {
  payment_uploaded: Upload,
  payment_approved: Check,
  payment_rejected: X,
  rent_reminder: AlertCircle,
};

interface Props {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationBell({ notifications, onMarkRead, onMarkAllRead }: Props) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-display font-semibold text-sm text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
              ) : (
                notifications.map((n) => {
                  const Icon = iconMap[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-0 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.type === "payment_uploaded" ? "bg-accent text-accent-foreground" :
                        n.type === "payment_approved" ? "bg-primary/10 text-primary" :
                        n.type === "payment_rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                    </button>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
