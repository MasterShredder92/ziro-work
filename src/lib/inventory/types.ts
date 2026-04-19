import type {
  InventoryItemRow,
  InventoryCategory as DataInventoryCategory,
  InventoryStatus,
  InventoryCondition,
  DepreciationMethod,
} from "@data/inventoryItems";
import type { InventoryStockRow } from "@data/inventoryStock";
import type {
  InventoryCheckoutRow,
  InventoryCheckoutStatus,
} from "@data/inventoryCheckouts";
import type {
  InventoryMaintenanceRow,
  InventoryMaintenanceKind,
  InventoryMaintenanceStatus,
} from "@data/inventoryMaintenance";

export type InventoryItem = InventoryItemRow;
export type InventoryStock = InventoryStockRow;
export type InventoryCheckout = InventoryCheckoutRow;
export type InventoryMaintenance = InventoryMaintenanceRow;

export type InventoryCategory = DataInventoryCategory;

export type {
  InventoryStatus,
  InventoryCondition,
  DepreciationMethod,
  InventoryCheckoutStatus,
  InventoryMaintenanceKind,
  InventoryMaintenanceStatus,
};

export type DepreciationPoint = {
  month: number;
  date: string;
  value: number;
};

export type DepreciationRecord = {
  itemId: string;
  method: DepreciationMethod;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeMonths: number;
  monthsElapsed: number;
  currentValue: number;
  accumulated: number;
  percentRemaining: number;
  curve: DepreciationPoint[];
};

export type InventoryKpis = {
  totalItems: number;
  totalQuantity: number;
  itemsAvailable: number;
  itemsInUse: number;
  itemsMaintenance: number;
  itemsRetired: number;
  activeCheckouts: number;
  overdueCheckouts: number;
  maintenanceDue: number;
  maintenanceInProgress: number;
  lowStockItems: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  depreciationToDate: number;
  byCategory: Array<{ category: InventoryCategory; count: number }>;
};

export type InventoryItemSummary = {
  item: InventoryItem;
  activeCheckouts: number;
  overdueCheckouts: number;
  totalOnHand: number;
  openMaintenance: number;
  lastMaintenanceAt: string | null;
};

export type InventoryDashboardData = {
  tenantId: string;
  generatedAt: string;
  items: InventoryItemSummary[];
  kpis: InventoryKpis;
  overdue: InventoryCheckout[];
  maintenanceDue: InventoryMaintenance[];
};

export type InventoryItemSurface = {
  tenantId: string;
  item: InventoryItem;
  stock: InventoryStock[];
  checkouts: InventoryCheckout[];
  maintenance: InventoryMaintenance[];
  depreciation: DepreciationRecord;
  kpis: {
    totalOnHand: number;
    totalReserved: number;
    activeCheckouts: number;
    overdueCheckouts: number;
    openMaintenance: number;
  };
  generatedAt: string;
};

export type CheckoutInput = {
  itemId: string;
  profileId: string;
  tenantId: string;
  dueDate?: string | null;
  quantity?: number;
  studentId?: string | null;
  teacherId?: string | null;
  locationId?: string | null;
  conditionAtCheckout?: string | null;
  notes?: string | null;
  checkedOutBy?: string | null;
};

export type MaintenanceInput = {
  itemId: string;
  tenantId: string;
  kind?: InventoryMaintenanceKind;
  status?: InventoryMaintenanceStatus;
  summary: string;
  notes?: string | null;
  cost?: number | null;
  vendor?: string | null;
  performedBy?: string | null;
  scheduledFor?: string | null;
  performedAt?: string | null;
  completedAt?: string | null;
  nextDueAt?: string | null;
  createdBy?: string | null;
};
