# UI Kit — Universal React Component Library

Extracted from **RentMoto** — a production-grade rental & mobility platform. This UI kit is 100% decoupled from RentMoto's backend and can be dropped into any **React + Vite + TailwindCSS v4** project.

---

## 📦 What's Included

| Category | Components |
|----------|-----------|
| **UI Atoms** | Button, Input, Label, Badge, Card, Avatar, Dialog, Separator, DropdownMenu |
| **Auth** | SignInDrawer (animated bottom drawer with login + signup) |
| **Landing** | HeroSection, FeaturesSection, ProcessSection, RolesSection, CTASection |
| **Shells** | DashboardShell (universal), AdminShell, StaffShell, MechanicShell, OwnerShell, CustomerShell |
| **Pages** | OverviewPage, DataTablePage, ProfilePage |

---

## ⚙️ Installation

### 1. Install NPM dependencies

```bash
npm install lucide-react framer-motion vaul \
  @radix-ui/react-label @radix-ui/react-avatar \
  @radix-ui/react-separator @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs class-variance-authority clsx tailwind-merge \
  react-router-dom
```

### 2. Copy the ui-kit folder

Copy the entire `ui-kit/` folder into your project's `src/` directory:
```
your-project/src/ui-kit/
```

### 3. Set up TailwindCSS v4

In your `src/index.css`:
```css
@import "./ui-kit/styles/globals.css";
```

Or copy the contents of `ui-kit/styles/globals.css` into your existing CSS.

### 4. Add Inter font

In your `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

---

## 🚀 Usage Examples

### Landing Page (full)

```jsx
import { HeroSection, FeaturesSection, ProcessSection, RolesSection, CTASection } from "./ui-kit";
import { SignInDrawer } from "./ui-kit";
import { Building2, Car, Wrench } from "lucide-react";

export default function LandingPage() {
  const handleLogin = async (email, password, role) => {
    const res = await myAuthApi.login({ email, password, role });
    if (res.ok) return { success: true };
    return { success: false, message: res.error };
  };

  const AuthDrawer = (props) => (
    <SignInDrawer
      {...props}
      appName="MyApp"
      roles={[
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
      ]}
      onLogin={handleLogin}
      onSignup={handleSignup}
    />
  );

  return (
    <>
      <HeroSection
        appName="MyApp"
        tagline={["One Platform.", "All Features.", "Zero Friction."]}
        description="Your unified app for everything."
        navLinks={[
          { label: "Features", sectionId: "features" },
          { label: "How It Works", sectionId: "how-it-works" },
        ]}
        SignInComponent={AuthDrawer}
      />
      <FeaturesSection
        features={[
          { icon: <Building2 />, title: "Feature A", desc: "...", colSpan: "col-span-1 md:col-span-2", highlight: true },
          { icon: <Car />, title: "Feature B", desc: "...", colSpan: "col-span-1 md:col-span-1" },
        ]}
      />
      <CTASection appName="MyApp" heading="Ready to start?" SignInComponent={AuthDrawer} />
    </>
  );
}
```

---

### Dashboard Shell (custom nav)

```jsx
import { DashboardShell } from "./ui-kit";
import { LayoutDashboard, Users, Settings } from "lucide-react";

function App() {
  const user = { name: "Swapnil Sen", role: "Admin" };

  const navLinks = [
    {
      section: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
        { icon: Users,           label: "Users",     href: "/app/users" },
        { icon: Settings,        label: "Settings",  href: "/app/settings" },
      ],
    },
  ];

  return (
    <DashboardShell
      profile={user}
      links={navLinks}
      notifications={[]}
      onLogout={() => { localStorage.clear(); window.location.href = "/"; }}
      dashboardLabel="My App"
      accentColor="#d9ff00"
    >
      <div className="p-6 text-white">Hello from inside the shell!</div>
    </DashboardShell>
  );
}
```

---

### Pre-configured Admin Shell

```jsx
import { AdminShell } from "./ui-kit";

function AdminApp() {
  return (
    <AdminShell
      profile={{ name: "Swapnil Sen", role: "Super Admin" }}
      notifications={notifications}
      onLogout={handleLogout}
      onMarkAllRead={markAllRead}
    >
      <YourAdminPageContent />
    </AdminShell>
  );
}
```

---

### Data Table Page

```jsx
import { DataTablePage } from "./ui-kit";
import { Badge } from "./ui-kit";

<DataTablePage
  title="Users"
  columns={[
    { key: "name",   label: "Name" },
    { key: "email",  label: "Email" },
    { key: "status", label: "Status", render: (row) => <Badge variant={row.status === "active" ? "available" : "inactive"}>{row.status}</Badge> },
  ]}
  rows={users}
  filters={[
    { label: "All",    value: "all" },
    { label: "Active", value: "active" },
  ]}
  activeFilter={filter}
  onFilter={setFilter}
  searchQuery={search}
  onSearch={setSearch}
/>
```

---

### Sign-In Drawer standalone

```jsx
import { SignInDrawer } from "./ui-kit";

<SignInDrawer
  appName="MyApp"
  roles={[
    { value: "customer", label: "Customer" },
    { value: "admin",    label: "Admin" },
  ]}
  onLogin={async (email, password, role) => {
    // call your API
    return { success: true };
  }}
  onSignup={async (name, email, password, role) => {
    return { success: true };
  }}
>
  <button className="bg-yellow-400 px-4 py-2 rounded-full font-bold">Sign In</button>
</SignInDrawer>
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| **Accent / Neon** | `#d9ff00` |
| **Dark BG** | `#0a0a0a` / `#0f1115` |
| **Light BG** | `#f5f5f7` |
| **Border** | `neutral-800` |
| **Text Primary** | `white` |
| **Text Muted** | `neutral-400–500` |
| **Font** | Inter |

---

## 📁 Folder Structure

```
ui-kit/
├── index.js                         ← barrel export (import everything from here)
├── lib/
│   └── utils.js                     ← cn() utility
├── styles/
│   └── globals.css                  ← full design system CSS
└── components/
    ├── ui/                          ← Button, Input, Label, Badge, Card, Avatar, Dialog, Separator, DropdownMenu
    ├── auth/                        ← SignInDrawer, Drawer, AnimatedTabs
    ├── landing/                     ← HeroSection, FeaturesSection, ProcessSection, RolesSection, CTASection
    ├── shells/                      ← DashboardShell, AdminShell, StaffShell, MechanicShell, OwnerShell, CustomerShell
    └── pages/                       ← OverviewPage, DataTablePage, ProfilePage
```
