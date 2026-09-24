"use client"

/**
 * SignInDrawer — Universal animated sign-in/sign-up bottom drawer.
 *
 * Props:
 *   children    — custom trigger element (optional, defaults to "Sign In" button)
 *   defaultTab  — "login" | "signup" (default: "login")
 *   appName     — brand name shown in the drawer header (default: "App")
 *   roles       — array of { value, label } objects for the role dropdown (optional)
 *                 If omitted, no role selector is shown.
 *   onLogin     — async (email, password, role?) => { success: bool, message?: string }
 *   onSignup    — async (name, email, password, role?) => { success: bool, message?: string }
 */

import * as React from "react"
import { X, ArrowLeft, FingerprintIcon, UserPlus, LogIn, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Drawer, DrawerTrigger, DrawerClose, DrawerTitle, DrawerDescription, DrawerContent,
} from "./Drawer"
import {
  AnimatedTabs, AnimatedTabsList, AnimatedTabsTrigger, AnimatedTabsContent, useMeasure,
} from "./AnimatedTabs"

export function SignInDrawer({
  children,
  defaultTab = "login",
  appName = "App",
  roles = [],
  onLogin,
  onSignup,
}) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState("default")
  const [ref, bounds] = useMeasure()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState(roles[0]?.value ?? "")
  const [error, setError] = React.useState("")

  const handleAuthSubmit = async (mode) => {
    setError("")
    setStep("passkey")

    let res;
    try {
      if (mode === "login") {
        res = onLogin
          ? await onLogin(email, password, role || undefined)
          : { success: true }
      } else {
        res = onSignup
          ? await onSignup(name || email.split("@")[0], email, password, role || undefined)
          : { success: true }
      }
    } catch {
      res = { success: false, message: "Network error. Please try again." }
    }

    if (!res?.success) {
      setTimeout(() => { setError(res?.message ?? "Something went wrong"); setStep("default") }, 500)
    } else {
      setOpen(false)
    }
  }

  const handleBack = () => setStep("default")

  const handleOpenChange = (v) => {
    if (!v) setTimeout(() => setStep("default"), 300)
    setOpen(v)
  }

  const inputClass =
    "bg-transparent border-white/20 focus-visible:border-white/50 focus-visible:ring-transparent flex h-10 w-full rounded-2xl border px-4 py-1 text-base outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 md:text-sm text-white"

  return (
    <div className="flex items-center justify-center">
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {children || (
            <button type="button" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#145C8C] px-4 text-sm font-bold text-black transition-all active:scale-95">
              Sign In
            </button>
          )}
        </DrawerTrigger>

        <DrawerContent>
          <DrawerClose className="bg-white/10 hover:bg-white/20 text-white absolute right-6 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-75">
            <X className="size-5 opacity-75" />
          </DrawerClose>

          <div className="flex items-center justify-between px-6 py-6 text-center text-xl font-semibold tracking-tight text-white">
            {step === "passkey" && (
              <button onClick={handleBack} type="button" className="bg-white/10 hover:bg-white/20 text-white absolute left-6 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-75">
                <ArrowLeft className="size-5" />
              </button>
            )}
            <span className="flex-1 select-none text-center">
              {step === "default" ? `${appName}®` : "Authenticating"}
            </span>
            {step === "passkey" && <div className="w-8" />}
          </div>

          <DrawerTitle className="sr-only">Sign In</DrawerTitle>
          <DrawerDescription className="sr-only">Sign in to your account</DrawerDescription>

          <motion.div
            animate={{ height: bounds.height > 0 ? bounds.height : step === "default" ? (roles.length ? 500 : 420) : 320 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="overflow-hidden will-change-transform"
          >
            <div ref={ref} className="px-6 pb-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {step === "default" ? (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  >
                    <AnimatedTabs defaultValue={defaultTab}>
                      <AnimatedTabsList className="grid w-full grid-cols-2 bg-white/10 rounded-xl p-1">
                        <AnimatedTabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                          <LogIn className="size-4 mr-1.5" /> Login
                        </AnimatedTabsTrigger>
                        <AnimatedTabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                          <UserPlus className="size-4 mr-1.5" /> Sign Up
                        </AnimatedTabsTrigger>
                      </AnimatedTabsList>

                      {/* ── LOGIN ── */}
                      <AnimatedTabsContent value="login" className="pt-6 pb-2">
                        <div className="space-y-4">
                          {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                              <AlertCircle className="size-4 shrink-0" /> {error}
                            </div>
                          )}
                          <input type="email" placeholder="Email Address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                          <input type="password" placeholder="Password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
                          {roles.length > 0 && (
                            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
                              {roles.map((r) => (
                                <option key={r.value} value={r.value} className="text-black">{r.label}</option>
                              ))}
                            </select>
                          )}
                          <button type="button" onClick={() => handleAuthSubmit("login")} className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#145C8C] px-2.5 text-base font-bold text-white hover:bg-[#0B3D5C] transition-all active:scale-95 shadow-lg">
                            Sign In
                          </button>
                          <button type="button" className="w-full text-sm text-white/60 hover:text-white transition-colors">
                            Forgot password?
                          </button>
                        </div>
                      </AnimatedTabsContent>

                      {/* ── SIGN UP ── */}
                      <AnimatedTabsContent value="signup" className="pt-6 pb-2">
                        <div className="space-y-4">
                          {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                              <AlertCircle className="size-4 shrink-0" /> {error}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Full Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                            <input type="tel" placeholder="Phone" className={inputClass} />
                          </div>
                          <input type="email" placeholder="Email Address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="password" placeholder="Password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
                            <input type="password" placeholder="Confirm" className={inputClass} />
                          </div>
                          {roles.length > 0 && (
                            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
                              {roles.map((r) => (
                                <option key={r.value} value={r.value} className="text-black">{r.label}</option>
                              ))}
                            </select>
                          )}
                          <button type="button" onClick={() => handleAuthSubmit("signup")} className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#145C8C] px-2.5 text-base font-bold text-white hover:bg-[#0B3D5C] transition-all active:scale-95 shadow-lg">
                            Create Account
                          </button>
                        </div>
                      </AnimatedTabsContent>
                    </AnimatedTabs>
                  </motion.div>
                ) : (
                  <motion.div
                    key="passkey"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-center py-8">
                      <div className="relative flex items-center justify-center overflow-hidden rounded-[22px] p-0.5">
                        <motion.div
                          className="absolute left-[-50%] top-[-50%] h-[200%] w-[200%] bg-[conic-gradient(from_0deg,transparent_0%,#145C8C_10%,#145C8C_25%,transparent_35%)]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.25, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                        />
                        <div className="z-1 flex items-center justify-center rounded-[20px] p-1">
                          <div className="flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-1">
                            <div className="flex size-16 items-center justify-center rounded-xl">
                              <FingerprintIcon className="size-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default SignInDrawer
