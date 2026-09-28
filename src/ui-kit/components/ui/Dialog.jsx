import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange && onOpenChange(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ scale: 0.95, opacity: 0, y: 15 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.95, opacity: 0, y: 15 }}
    transition={{ duration: 0.2 }}
    className={cn(
      "relative z-50 w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100 shadow-2xl overflow-hidden my-6",
      className
    )}
    {...props}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-5 top-5 p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {children}
  </motion.div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left pb-4 border-b border-neutral-800", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-base font-bold text-neutral-100 flex items-center gap-2", className)} {...props} />
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = ({ className, ...props }) => (
  <p className={cn("text-xs text-neutral-400 leading-relaxed", className)} {...props} />
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-neutral-800", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
