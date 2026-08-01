/**
 * RewardLoop — Centralized Icon Registry.
 *
 * All icon imports must come through this module.
 * Features must NEVER import directly from `lucide-react`.
 *
 * Source: 10_Project_Design_System.md §6 — Lucide React, stroke-width=2
 */

export {
  /* ─── Navigation ─────────────────────────────────────────────────────────── */
  LayoutDashboard,
  Receipt,
  PlusCircle,
  BarChart3,
  MoreHorizontal,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,

  /* ─── Actions ────────────────────────────────────────────────────────────── */
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  Copy,
  Send,
  Phone,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  HelpCircle,
  Bell,
  ExternalLink,
  Save,
  Banknote,
  Smartphone,
  Maximize,
  Minimize,

  /* ─── Status ─────────────────────────────────────────────────────────────── */
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  CircleDot,

  /* ─── Business ───────────────────────────────────────────────────────────── */
  User,
  UserPlus,
  Users,
  Store,
  CreditCard,
  Wallet,
  Gift,
  Tag,
  Scissors,
  Package,
  IndianRupee,
  Hash,
  Percent,
  Star,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";

/** Default icon sizing classes per context */
export const ICON_SIZES = {
  /** Navigation bar icons */
  nav: "size-5",
  /** Inline with text */
  inline: "size-4",
  /** Large display (empty states, feature icons) */
  display: "size-8",
  /** Small badges/indicators */
  sm: "size-3.5",
} as const;
