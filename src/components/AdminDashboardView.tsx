"use client";

import React, { useState } from "react";
import { Download, ArrowLeft, Plus, X, MoveRight, Search } from "lucide-react";
import { CatalogItem, DatabaseState, MemberPackage } from "@/lib/db";
import { getBatchStatus, maskPhone } from "@/lib/engine";
import SignaturePad from "./SignaturePad";
import MemberSearchSelect from "./MemberSearchSelect";

interface AdminDashboardViewProps {
  db: DatabaseState;
  onRefresh: () => Promise<void>;
  toast: (msg: string, type?: "success" | "warning" | "error") => void;
}

type AdminSection =
  | "DASHBOARD"
  | "CRM"
  | "POS"
  | "SCHEDULE"
  | "INVENTORY"
  | "LINE_ENGINE";

type CrmSubTab = "PACKAGES" | "ORDERS" | "CONSENTS";

export default function AdminDashboardView({
  db,
  onRefresh,
  toast,
}: AdminDashboardViewProps) {
  const [section, setSection] = useState<AdminSection>("CRM");
  const [isStoreManager, setIsStoreManager] = useState<boolean>(false);

  // CRM State
  const [selectedMemberId, setSelectedMemberId] = useState<string>("m-101");
  const [crmTab, setCrmTab] = useState<CrmSubTab>("PACKAGES");
  const [showMemberListMode, setShowMemberListMode] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>("");

  // Package Consumption Modal State
  const [consumeModalPkg, setConsumeModalPkg] = useState<MemberPackage | null>(
    null
  );
  const [consumeOperatorId, setConsumeOperatorId] =
    useState<string>("staff-anna");
  const [consumeSignature, setConsumeSignature] = useState<string>("");
  const [consuming, setConsuming] = useState<boolean>(false);

  // POS Checkout State
  const [posMemberId, setPosMemberId] = useState<string>("m-101");
  const [posCart, setPosCart] = useState<
    { item_id: string; quantity: number; custom_price: number }[]
  >([
    {
      item_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      quantity: 1,
      custom_price: 12000,
    },
    {
      item_id: "prd-mask-box",
      quantity: 2,
      custom_price: 1600,
    },
  ]);
  const [posDiscount, setPosDiscount] = useState<number>(1000);
  const [useWallet, setUseWallet] = useState<boolean>(true);
  const [walletPayAmount, setWalletPayAmount] = useState<number>(5000);
  const [useCreditCard, setUseCreditCard] = useState<boolean>(true);
  const [cardPayAmount, setCardPayAmount] = useState<number>(7600);
  const [useCashOrLine, setUseCashOrLine] = useState<boolean>(false);
  const [cashPayAmount, setCashPayAmount] = useState<number>(0);
  const [consultantStaffId, setConsultantStaffId] =
    useState<string>("staff-vivian");
  const [consultantPct] = useState<number>(50);
  const [operatorStaffId, setOperatorStaffId] = useState<string>("staff-anna");
  const [operatorPct] = useState<number>(50);
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  // Schedule Gantt State
  const [scheduleViewMode, setScheduleViewMode] = useState<
    "ROOM" | "DAY" | "WEEK"
  >("ROOM");
  const [rescheduleModalAptId, setRescheduleModalAptId] = useState<
    string | null
  >(null);
  const [newStartTime, setNewStartTime] = useState<string>("15:00");
  const [newRoomId, setNewRoomId] = useState<string>("room-1");
  const [newStaffId, setNewStaffId] = useState<string>("staff-anna");
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [walkInMemberId, setWalkInMemberId] = useState<string>("m-101");
  const [walkInTreatmentId, setWalkInTreatmentId] = useState<string>(
    "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  );
  const [walkInStaffId, setWalkInStaffId] = useState<string>("staff-anna");
  const [walkInTime, setWalkInTime] = useState<string>("16:30");

  // 新增操作老師 / 診所人員 Modal 狀態
  const [showCreateStaffModal, setShowCreateStaffModal] =
    useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>("");
  const [newStaffTitle, setNewStaffTitle] = useState<string>("皮膚管理師");
  const [newStaffPhone, setNewStaffPhone] = useState<string>("");
  const [newStaffRole, setNewStaffRole] = useState<
    "BEAUTICIAN" | "DOCTOR" | "CONSULTANT"
  >("BEAUTICIAN");

  // 新增獨立包廂 Modal 狀態
  const [showCreateRoomModal, setShowCreateRoomModal] =
    useState<boolean>(false);
  const [newRoomNameInput, setNewRoomNameInput] = useState<string>("");
  const [newRoomCodeInput, setNewRoomCodeInput] = useState<string>("");

  // Inventory State
  const [invStatusFilter, setInvStatusFilter] = useState<string>("ALL");
  const [invSearch, setInvSearch] = useState<string>("");
  const [showStockInModal, setShowStockInModal] = useState<boolean>(false);
  const [stockInItemId, setStockInItemId] = useState<string>("inv-ha");
  const [stockInBatchNo, setStockInBatchNo] =
    useState<string>("HA-202603-08");
  const [stockInExpiry, setStockInExpiry] = useState<string>("2027-09-30");
  const [stockInQty, setStockInQty] = useState<number>(20);
  const [stockInCost] = useState<number>(480);

  // 新增產品 / 耗材 Modal 狀態
  const [showCreateItemModal, setShowCreateItemModal] =
    useState<boolean>(false);
  const [newItemType, setNewItemType] = useState<
    "CONSUMABLE" | "PRODUCT" | "TREATMENT"
  >("CONSUMABLE");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("醫療耗材");
  const [newItemUnit, setNewItemUnit] = useState<string>("瓶");
  const [newItemPrice, setNewItemPrice] = useState<number>(600);
  const [newItemSafetyStock, setNewItemSafetyStock] = useState<number>(10);
  const [newItemDurationMin, setNewItemDurationMin] = useState<number>(60);
  const [newItemSessions, setNewItemSessions] = useState<number>(1);
  const [newItemInitBatchNo, setNewItemInitBatchNo] = useState<string>("");
  const [newItemInitExpiry, setNewItemInitExpiry] =
    useState<string>("2027-12-31");
  const [newItemInitQty, setNewItemInitQty] = useState<number>(10);

  // 新增療程標準耗材配方 (BOM) Modal 狀態
  const [showAddBomModal, setShowAddBomModal] = useState<boolean>(false);
  const [bomTreatmentId, setBomTreatmentId] = useState<string>(
    db.items.find((i) => i.type === "TREATMENT")?.id || ""
  );
  const [bomConsumableId, setBomConsumableId] = useState<string>(
    db.items.find((i) => i.type === "CONSUMABLE")?.id || ""
  );
  const [bomDeductQty, setBomDeductQty] = useState<number>(1);

  // Create Member Modal State
  const [showCreateMemberModal, setShowCreateMemberModal] =
    useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberGender, setNewMemberGender] = useState<string>("女性");
  const [newMemberAge, setNewMemberAge] = useState<number>(28);
  const [newMemberBirthday, setNewMemberBirthday] =
    useState<string>("1998-05-20");
  const [newMemberWallet, setNewMemberWallet] = useState<number>(0);
  const [newMemberStaffId, setNewMemberStaffId] =
    useState<string>("staff-anna");
  const [newMemberTags, setNewMemberTags] = useState<string[]>([
    "初診新客",
    "諮詢評估",
  ]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [newMemberAllergies, setNewMemberAllergies] = useState<string>(
    "無已知藥物或特定成分過敏史"
  );
  const [newMemberLaserExp, setNewMemberLaserExp] =
    useState<string>("曾體驗過淨膚雷射，無反黑現象");
  const [newMemberSpecialNotes, setNewMemberSpecialNotes] = useState<string>(
    "偏好安靜獨立包廂，施作前請詳細說明術後修護防曬指引"
  );
  const [creatingMember, setCreatingMember] = useState<boolean>(false);

  const availableQuickTags = [
    "易反黑",
    "怕痛",
    "主推水光針",
    "敏感肌",
    "乾性缺水",
    "油痘肌",
    "定期保養",
    "雷射術後",
    "初診新客",
    "諮詢評估",
    "VIP高單",
  ];

  const handleToggleTag = (tag: string) => {
    if (newMemberTags.includes(tag)) {
      setNewMemberTags(newMemberTags.filter((t) => t !== tag));
    } else {
      setNewMemberTags([...newMemberTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !newMemberTags.includes(customTagInput.trim())) {
      setNewMemberTags([...newMemberTags, customTagInput.trim()]);
      setCustomTagInput("");
    }
  };

  const handleCreateMemberSubmit = async () => {
    if (!newMemberName.trim()) {
      toast("請填寫會員姓名", "warning");
      return;
    }
    if (!newMemberPhone.trim()) {
      toast("請填寫會員聯絡電話", "warning");
      return;
    }

    setCreatingMember(true);
    try {
      const res = await fetch("/api/v1/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MEMBER",
          full_name: newMemberName.trim(),
          phone: newMemberPhone.trim(),
          gender: newMemberGender,
          age: newMemberAge,
          birthday: newMemberBirthday,
          wallet_balance: newMemberWallet,
          preferred_staff_id: newMemberStaffId,
          tags: newMemberTags,
          allergies: newMemberAllergies,
          laser_experience: newMemberLaserExp,
          special_notes: newMemberSpecialNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.message || "新增會員失敗", "error");
        return;
      }

      toast(data.message, "success");
      setSelectedMemberId(data.member.id);
      setShowCreateMemberModal(false);
      setShowMemberListMode(false);

      // 清空預填資料
      setNewMemberName("");
      setNewMemberPhone("");
      setNewMemberWallet(0);

      await onRefresh();
    } finally {
      setCreatingMember(false);
    }
  };

  const currentMember =
    db.members.find((m) => m.id === selectedMemberId) || db.members[0];
  const memberPackages = db.member_packages.filter(
    (p) => p.member_id === currentMember.id
  );
  const memberOrders = db.orders.filter(
    (o) => o.member_id === currentMember.id
  );

  const handleConfirmConsumption = async () => {
    if (!consumeModalPkg) return;
    setConsuming(true);
    try {
      const relatedApt =
        db.appointments.find(
          (a) =>
            a.member_id === consumeModalPkg.member_id &&
            a.status !== "COMPLETED" &&
            a.status !== "CANCELLED"
        ) || db.appointments[0];

      const res = await fetch(
        `/api/v1/admin/appointments/${relatedApt?.id || "apt-001"}/consume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package_id: consumeModalPkg.id,
            operator_staff_id: consumeOperatorId,
            signature_base64:
              consumeSignature ||
              "data:image/png;base64,SIGNED_BY_CUSTOMER_IN_CLINIC",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.message || "堂數核銷失敗", "error");
        return;
      }

      const fifoSummary =
        data.fifo_deductions
          ?.map(
            (d: { item_name: string; batch_no: string; deducted: number }) =>
              `${d.item_name} (批號 ${d.batch_no}) -${d.deducted}`
          )
          .join("、") || "無";

      toast(
        `已完成堂數核銷（剩餘 ${data.remaining_quota} 堂）｜FIFO 耗材扣減：${fifoSummary}`,
        "success"
      );
      if (data.inventory_warnings?.length > 0) {
        setTimeout(() => {
          toast(data.inventory_warnings[0], "warning");
        }, 600);
      }

      setConsumeModalPkg(null);
      setConsumeSignature("");
      await onRefresh();
    } finally {
      setConsuming(false);
    }
  };

  const posSubtotal = posCart.reduce((s, item) => s + item.custom_price, 0);
  const posTotalPayable = Math.max(0, posSubtotal - posDiscount);
  const posMember =
    db.members.find((m) => m.id === posMemberId) || db.members[0];

  const handleAddPosCartItem = (itemId: string) => {
    const catalog = db.items.find((i) => i.id === itemId);
    if (!catalog) return;
    const nextCart = [
      ...posCart,
      {
        item_id: catalog.id,
        quantity: 1,
        custom_price: catalog.price,
      },
    ];
    setPosCart(nextCart);
    const nextSub = nextCart.reduce((s, i) => s + i.custom_price, 0);
    const nextTot = Math.max(0, nextSub - posDiscount);
    setCardPayAmount(Math.max(0, nextTot - (useWallet ? walletPayAmount : 0)));
  };

  const handleRemovePosCartItem = (idx: number) => {
    const nextCart = posCart.filter((_, i) => i !== idx);
    setPosCart(nextCart);
    const nextSub = nextCart.reduce((s, i) => s + i.custom_price, 0);
    const nextTot = Math.max(0, nextSub - posDiscount);
    setCardPayAmount(Math.max(0, nextTot - (useWallet ? walletPayAmount : 0)));
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) {
      toast("請選擇至少一項療程方案或保養商品", "warning");
      return;
    }

    const payments: { method: string; amount: number }[] = [];
    if (useWallet && walletPayAmount > 0) {
      payments.push({ method: "WALLET", amount: walletPayAmount });
    }
    if (useCreditCard && cardPayAmount > 0) {
      payments.push({ method: "CREDIT_CARD", amount: cardPayAmount });
    }
    if (useCashOrLine && cashPayAmount > 0) {
      payments.push({ method: "LINE_PAY", amount: cashPayAmount });
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/v1/admin/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: posMemberId,
          items: posCart,
          discount: posDiscount,
          payments,
          sales_split: [
            { staff_id: consultantStaffId, percentage: consultantPct },
            { staff_id: operatorStaffId, percentage: operatorPct },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.message || "結帳處理失敗", "error");
        return;
      }

      toast(
        `結帳完成（單號 ${data.order.order_no}）｜已入帳療程堂數並發送 LINE 電子收據`,
        "success"
      );
      await onRefresh();
    } finally {
      setCheckingOut(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModalAptId) return;
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESCHEDULE_APPOINTMENT",
        appointment_id: rescheduleModalAptId,
        new_start_time: newStartTime,
        new_room_id: newRoomId,
        new_staff_id: newStaffId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      toast(data.message || "時段或設備重疊，無法變更", "error");
      return;
    }
    toast(data.message, "success");
    setRescheduleModalAptId(null);
    await onRefresh();
  };

  const handleCancelAppointment = async (aptId: string) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CANCEL_APPOINTMENT",
        appointment_id: aptId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message, "warning");
      await onRefresh();
    }
  };

  const handleQuickWalkInSubmit = async () => {
    const res = await fetch("/api/v1/client/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: walkInMemberId,
        treatment_id: walkInTreatmentId,
        staff_id: walkInStaffId,
        date: db.referenceDate,
        start_time: `${db.referenceDate}T${walkInTime}:00+08:00`,
        notes: "櫃檯代客預約",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      toast(data.message || "預約時段衝突", "error");
      return;
    }
    toast(`預約建立完成（單號 ${data.appointment_no}）`, "success");
    setShowWalkInModal(false);
    await onRefresh();
  };

  const handleAddStockBatch = async () => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_INVENTORY_BATCH",
        item_id: stockInItemId,
        batch_no: stockInBatchNo,
        expiry_date: stockInExpiry,
        stock_quantity: stockInQty,
        cost_price: stockInCost,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`耗材批號 ${stockInBatchNo} 驗收入庫完成`, "success");
      setShowStockInModal(false);
      await onRefresh();
    }
  };

  const handleCreateCatalogItem = async () => {
    if (!newItemName.trim()) {
      toast("請輸入品項名稱", "warning");
      return;
    }
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_CATALOG_ITEM",
        type: newItemType,
        name: newItemName.trim(),
        category: newItemCategory.trim(),
        unit: newItemUnit.trim() || "瓶",
        price: newItemPrice,
        safety_stock: newItemSafetyStock,
        duration_min: newItemDurationMin,
        package_sessions:
          newItemType === "TREATMENT" ? newItemSessions : undefined,
        initial_batch_no:
          newItemType === "CONSUMABLE" && newItemInitBatchNo.trim()
            ? newItemInitBatchNo.trim()
            : undefined,
        initial_expiry_date: newItemInitExpiry,
        initial_quantity:
          newItemType === "CONSUMABLE" && newItemInitBatchNo.trim()
            ? newItemInitQty
            : 0,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已成功新增品項", "success");
      if (newItemType === "CONSUMABLE" && data.item?.id) {
        setStockInItemId(data.item.id);
        setBomConsumableId(data.item.id);
      } else if (newItemType === "TREATMENT" && data.item?.id) {
        setBomTreatmentId(data.item.id);
      }
      setNewItemName("");
      setNewItemInitBatchNo("");
      setShowCreateItemModal(false);
      await onRefresh();
    } else {
      toast(data.message || "新增品項失敗", "error");
    }
  };

  const handleAddTreatmentBom = async () => {
    const targetTreatmentId =
      bomTreatmentId || db.items.find((i) => i.type === "TREATMENT")?.id || "";
    const targetConsumableId =
      bomConsumableId ||
      db.items.find((i) => i.type === "CONSUMABLE")?.id ||
      "";
    if (!targetTreatmentId || !targetConsumableId) {
      toast("請選擇療程項目與耗材品項", "warning");
      return;
    }
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TREATMENT_BOM",
        treatment_id: targetTreatmentId,
        inventory_item_id: targetConsumableId,
        deduct_quantity: bomDeductQty,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已新增療程標準耗材配方", "success");
      setShowAddBomModal(false);
      setBomDeductQty(1);
      await onRefresh();
    } else {
      toast(data.message || "新增配方失敗", "error");
    }
  };

  const handleDeleteTreatmentBom = async (bomId: string) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_TREATMENT_BOM",
        bom_id: bomId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已移除該配方項目", "success");
      await onRefresh();
    } else {
      toast(data.message || "移除配方失敗", "error");
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaffName.trim()) {
      toast("請輸入操作老師姓名", "warning");
      return;
    }
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_STAFF",
        name: newStaffName.trim(),
        title: newStaffTitle.trim() || "皮膚管理師",
        phone: newStaffPhone.trim() || "0900-000-000",
        role: newStaffRole,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已成功新增操作老師", "success");
      if (data.staff?.id && data.staff.role !== "CONSULTANT") {
        setWalkInStaffId(data.staff.id);
      }
      setNewStaffName("");
      setNewStaffPhone("");
      setShowCreateStaffModal(false);
      await onRefresh();
    } else {
      toast(data.message || "新增人員失敗", "error");
    }
  };

  const handleToggleStaffActive = async (staffId: string) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_STAFF_ACTIVE",
        staff_id: staffId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已更新人員排班狀態", "success");
      await onRefresh();
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomNameInput.trim()) {
      toast("請輸入包廂名稱", "warning");
      return;
    }
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_ROOM",
        name: newRoomNameInput.trim(),
        code: newRoomCodeInput.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已成功新增包廂", "success");
      if (data.room?.id) {
        setNewRoomId(data.room.id);
      }
      setNewRoomNameInput("");
      setNewRoomCodeInput("");
      setShowCreateRoomModal(false);
      await onRefresh();
    } else {
      toast(data.message || "新增包廂失敗", "error");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_ROOM",
        room_id: roomId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(data.message || "已刪除包廂", "success");
      await onRefresh();
    } else {
      toast(data.message || "無法刪除此包廂", "warning");
    }
  };

  const handleExportInventoryCsv = () => {
    const headers = [
      "品名規格",
      "批號(Batch)",
      "現有庫存",
      "安全庫存",
      "有效期限",
      "狀態",
    ];
    const rows = db.inventory_batches.map((b) => {
      const st = getBatchStatus(b, db.referenceDate);
      return [
        b.item_name,
        b.batch_no,
        `${b.stock_quantity} ${b.unit}`,
        `${b.safety_stock} ${b.unit}`,
        b.expiry_date.replace(/-/g, "/"),
        st.label,
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `muko-clinic-inventory-${db.referenceDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("庫存盤點報表 (CSV) 已匯出", "success");
  };

  const warningBatches = db.inventory_batches.filter((b) => {
    const st = getBatchStatus(b, db.referenceDate);
    return st.code !== "SUFFICIENT";
  });

  const filteredBatches = db.inventory_batches.filter((b) => {
    const st = getBatchStatus(b, db.referenceDate);
    if (invStatusFilter === "WARNING" && st.code === "SUFFICIENT") return false;
    if (
      invSearch &&
      !b.item_name.toLowerCase().includes(invSearch.toLowerCase()) &&
      !b.batch_no.toLowerCase().includes(invSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const todayRevenue = db.orders.reduce((sum, o) => sum + o.total_amount, 0);
  const activeCallbackAlerts = db.line_jobs.filter(
    (j) => j.status === "ALERT_CALLBACK"
  );

  const navItems: {
    id: AdminSection;
    index: string;
    label: string;
    sub: string;
    badge?: number;
  }[] = [
    {
      id: "DASHBOARD",
      index: "01 / OVERVIEW",
      label: "營運儀表板",
      sub: "今日預約流・營收・耗材預警",
      badge: activeCallbackAlerts.length || undefined,
    },
    {
      id: "CRM",
      index: "02 / MEMBER CRM",
      label: "會員病歷與檔案",
      sub: "堂數核銷・術前術後照・同意書",
    },
    {
      id: "POS",
      index: "03 / ACCOUNTING",
      label: "療程買賣與結帳",
      sub: "複合付款・儲值扣款・業績拆分",
    },
    {
      id: "SCHEDULE",
      index: "04 / SCHEDULE BOARD",
      label: "預約排程看板",
      sub: "三維防呆排程・清消緩衝",
    },
    {
      id: "INVENTORY",
      index: "05 / INVENTORY & LOT",
      label: "耗材庫存與批號",
      sub: "先進先出 (FIFO)・效期預警",
      badge: warningBatches.length || undefined,
    },
    {
      id: "LINE_ENGINE",
      index: "06 / LINE CONCIERGE",
      label: "LINE 自動化排程",
      sub: "行前提醒・術後追蹤關懷",
    },
  ];

  return (
    <div className="min-h-[820px] border border-[#DED7CC] bg-ivory shadow-[0_8px_30px_rgba(44,42,41,0.05)] overflow-hidden flex flex-col lg:flex-row">
      {/* Left Serene Washi Architectural Sidebar */}
      <aside className="w-full lg:w-64 bg-[#F4EFE8] border-b lg:border-b-0 lg:border-r border-[#DED7CC] flex flex-col justify-between shrink-0">
        <div>
          <div className="px-6 py-6 border-b border-[#E2DBD0]">
            <span className="text-[10px] font-display tracking-[0.26em] text-roseGold-dark uppercase block">
              MUKO DERMATOLOGY
            </span>
            <h2 className="text-base font-serif font-medium text-graphite mt-1 tracking-widest">
              沐光美學診所
            </h2>
            <p className="text-[11px] text-graphite/55 mt-0.5 tracking-wider">
              電子病歷與預約營運管理
            </p>
          </div>

          <nav className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex items-center justify-between px-4 py-3 text-left transition border-l-2 ${
                    active
                      ? "border-roseGold bg-white text-graphite shadow-sm"
                      : "border-transparent text-graphite/70 hover:bg-white/60 hover:text-graphite"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-display tracking-[0.2em] text-roseGold-dark uppercase">
                      {item.index}
                    </div>
                    <div className="text-xs font-serif font-medium text-graphite mt-0.5 truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-graphite/50 truncate hidden lg:block mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 bg-status-warning/15 text-status-warning font-display font-semibold border border-status-warning/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Privacy & Data Masking Role Switcher */}
        <div className="p-4 m-3.5 bg-white border border-[#E2DBD0] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display tracking-[0.18em] text-roseGold-dark uppercase">
              PRIVACY CONTROL
            </span>
            <button
              type="button"
              onClick={() => setIsStoreManager(!isStoreManager)}
              className="text-[11px] px-2 py-0.5 border border-[#D8D0C5] text-graphite hover:border-roseGold transition font-serif"
            >
              切換權限
            </button>
          </div>
          <div className="text-xs font-serif text-graphite">
            目前身份：
            <span className="font-medium ml-1">
              {isStoreManager ? "店長（完整顯示）" : "一般人員（個資脫敏）"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-graphite/55">
            電話顯示：{maskPhone("0912-345-678", isStoreManager)}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-7 bg-ivory">
        {/* ==================== 1. 營運儀表板 (DASHBOARD) ==================== */}
        {section === "DASHBOARD" && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2DBD0] pb-4">
              <div>
                <span className="text-[10px] font-display tracking-[0.24em] text-roseGold-dark uppercase block">
                  CLINIC DAILY OVERVIEW
                </span>
                <h1 className="text-xl font-serif font-medium text-graphite mt-0.5">
                  營運儀表板・今日預約與即時動態
                </h1>
                <p className="text-xs text-graphite/60 mt-1">
                  基準日期：{db.referenceDate.replace(/-/g, ".")}（週四）｜
                  獨立包廂・醫療儀器・操作師 三維防衝突機制運作中
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSection("POS")}
                  className="px-4 py-2 border border-graphite bg-white text-graphite text-xs font-serif tracking-widest hover:bg-ivory transition"
                >
                  建立訂單與結帳
                </button>
                <button
                  onClick={() => setSection("SCHEDULE")}
                  className="px-4 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  檢視包廂排程表
                </button>
              </div>
            </div>

            {/* 4 Architectural KPI Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="jp-card p-5 space-y-1.5">
                <span className="text-[10px] font-display tracking-[0.2em] text-graphite/50 uppercase">
                  APPOINTMENTS
                </span>
                <div className="text-xs font-serif text-graphite/70">
                  今日預約總數
                </div>
                <div className="text-2xl font-display font-semibold text-graphite pt-1">
                  {
                    db.appointments.filter((a) => a.status !== "CANCELLED")
                      .length
                  }{" "}
                  <span className="text-xs font-serif font-normal">組貴賓</span>
                </div>
              </div>

              <div className="jp-card p-5 space-y-1.5">
                <span className="text-[10px] font-display tracking-[0.2em] text-graphite/50 uppercase">
                  DAILY REVENUE
                </span>
                <div className="text-xs font-serif text-graphite/70">
                  當日累積營收
                </div>
                <div className="text-2xl font-display font-semibold text-graphite pt-1">
                  NT${todayRevenue.toLocaleString()}
                </div>
              </div>

              <div className="jp-card p-5 space-y-1.5">
                <span className="text-[10px] font-display tracking-[0.2em] text-graphite/50 uppercase">
                  INVENTORY ALERT
                </span>
                <div className="text-xs font-serif text-graphite/70">
                  耗材效期與安全庫存預警
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-display font-semibold text-status-warning">
                    {warningBatches.length}{" "}
                    <span className="text-xs font-serif font-normal">批號</span>
                  </span>
                  <button
                    onClick={() => setSection("INVENTORY")}
                    className="text-[11px] font-serif text-roseGold-dark underline underline-offset-4"
                  >
                    查看明細
                  </button>
                </div>
              </div>

              <div className="jp-card p-5 space-y-1.5">
                <span className="text-[10px] font-display tracking-[0.2em] text-graphite/50 uppercase">
                  FOLLOW-UP CALL
                </span>
                <div className="text-xs font-serif text-graphite/70">
                  術後關懷異常待電訪
                </div>
                <div className="text-2xl font-display font-semibold text-status-error pt-1">
                  {activeCallbackAlerts.length}{" "}
                  <span className="text-xs font-serif font-normal">件</span>
                </div>
              </div>
            </div>

            {/* Today's Flow & Recent FIFO Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="jp-card p-5 space-y-4">
                <div className="border-b border-[#EAE4DA] pb-2.5 flex items-baseline justify-between">
                  <h3 className="text-sm font-serif font-medium text-graphite">
                    今日到診與療程進度
                  </h3>
                  <span className="text-[10px] font-display tracking-widest text-graphite/45">
                    REALTIME FLOW
                  </span>
                </div>
                <div className="divide-y divide-[#EFEAE2]">
                  {db.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-serif text-graphite">
                          <span className="font-display font-semibold mr-2">
                            {apt.start_time} – {apt.end_time}
                          </span>
                          <span className="font-medium">
                            {apt.member_name} 貴賓
                          </span>
                          <span className="text-graphite/55 ml-2">
                            （操作師：{apt.staff_name}）
                          </span>
                        </div>
                        <div className="text-graphite/65">
                          {apt.treatment_name} ｜ {apt.room_name}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-serif px-2.5 py-0.5 border ${
                          apt.status === "COMPLETED"
                            ? "border-status-success/40 text-status-success bg-status-success/5"
                            : apt.status === "IN_PROGRESS"
                            ? "border-roseGold text-roseGold-dark bg-roseGold/10"
                            : apt.status === "CANCELLED"
                            ? "border-status-error/30 text-status-error/70"
                            : "border-[#D8D0C5] text-graphite/75 bg-ivory"
                        }`}
                      >
                        {apt.status === "IN_PROGRESS"
                          ? "施作中"
                          : apt.status === "COMPLETED"
                          ? "已核銷完成"
                          : apt.status === "CANCELLED"
                          ? "已取消"
                          : "已確認預約"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="jp-card p-5 space-y-4">
                <div className="border-b border-[#EAE4DA] pb-2.5 flex items-baseline justify-between">
                  <h3 className="text-sm font-serif font-medium text-graphite">
                    近期堂數核銷與 FIFO 耗材自動扣減紀錄
                  </h3>
                  <span className="text-[10px] font-display tracking-widest text-graphite/45">
                    FIFO AUDIT LOG
                  </span>
                </div>
                <div className="divide-y divide-[#EFEAE2]">
                  {db.package_consumptions.map((con) => (
                    <div key={con.id} className="py-3 text-xs space-y-1.5">
                      <div className="flex justify-between font-serif text-graphite">
                        <span>
                          <b>{con.member_name} 貴賓</b> — {con.treatment_name}（
                          核銷 {con.consumed_quota} 堂）
                        </span>
                        <span className="text-graphite/50 font-display">
                          {con.consumed_at}
                        </span>
                      </div>
                      <div className="text-graphite/65">
                        扣除耗材批號：
                        {con.fifo_deductions
                          .map(
                            (d) =>
                              `${d.item_name} [批號: ${d.batch_no}] ×${d.deducted}（餘${d.remaining_in_batch}）`
                          )
                          .join("、")}
                      </div>
                      <div className="text-[10px] font-mono text-graphite/40 truncate">
                        數位簽章雜湊: {con.sha256_hash}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. 會員病歷與檔案 CRM (Section 3.1) ==================== */}
        {section === "CRM" && (
          <div className="space-y-6">
            {/* Top Member Header */}
            <div className="jp-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowMemberListMode(!showMemberListMode)}
                  className="px-3.5 py-1.5 border border-[#D8D0C5] bg-ivory text-xs font-serif text-graphite hover:border-roseGold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {showMemberListMode ? "返回會員詳情" : "返回會員名單"}
                </button>
                <div>
                  <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                    MEMBER MEDICAL RECORD
                  </span>
                  <h1 className="text-lg font-serif font-medium text-graphite">
                    會員檔案：{currentMember.full_name}
                    <span className="text-xs font-display text-graphite/45 ml-3">
                      ID: {currentMember.member_code}
                    </span>
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-60 sm:w-64">
                  <MemberSearchSelect
                    members={db.members}
                    value={selectedMemberId}
                    onChange={(memberId) => {
                      setSelectedMemberId(memberId);
                      setShowMemberListMode(false);
                    }}
                    isStoreManager={isStoreManager}
                    placeholder="搜尋會員姓名、電話或編號..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateMemberModal(true)}
                  className="px-3.5 py-1.5 border border-roseGold/60 bg-roseGold/10 text-xs font-serif text-graphite hover:bg-roseGold/25 transition flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-roseGold-dark" />
                  新增會員
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPosMemberId(currentMember.id);
                    setSection("POS");
                  }}
                  className="px-3.5 py-1.5 border border-[#D8D0C5] bg-white text-xs font-serif text-graphite hover:border-roseGold transition"
                >
                  儲值與開單
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWalkInMemberId(currentMember.id);
                    setSection("SCHEDULE");
                    setShowWalkInModal(true);
                  }}
                  className="px-4 py-1.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  新增預約
                </button>
              </div>
            </div>

            {showMemberListMode ? (() => {
              const q = memberSearchQuery.trim().toLowerCase();
              const qNoDash = q.replace(/-/g, "");
              const filteredMembers = db.members.filter((m) => {
                if (!q) return true;
                return (
                  m.full_name.toLowerCase().includes(q) ||
                  m.member_code.toLowerCase().includes(q) ||
                  m.phone.toLowerCase().includes(q) ||
                  m.phone.replace(/-/g, "").toLowerCase().includes(qNoDash) ||
                  m.preferred_staff_name.toLowerCase().includes(q) ||
                  m.tags.some((t) => t.toLowerCase().includes(q))
                );
              });

              return (
                <div className="jp-card overflow-hidden">
                  <div className="p-4 border-b border-[#E2DBD0] flex flex-wrap items-center justify-between gap-3 bg-ivory/40">
                    <span className="text-xs font-serif text-graphite">
                      會員名簿總覽（
                      {q
                        ? `符合 ${filteredMembers.length} 位 ／ 共 ${db.members.length} 位貴賓`
                        : `共 ${db.members.length} 位貴賓`}
                      ）
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-initial justify-end">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 text-graphite/45 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="搜尋姓名、電話、編號、標籤或操作師..."
                          className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#D8D0C5] text-xs text-graphite placeholder:text-graphite/40 focus:outline-none focus:border-roseGold"
                        />
                        {memberSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMemberSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-graphite"
                            aria-label="清除搜尋"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreateMemberModal(true)}
                        className="px-3 py-1.5 border border-roseGold/60 bg-roseGold/10 text-xs font-serif text-graphite hover:bg-roseGold/25 transition flex items-center gap-1 font-medium shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-roseGold-dark" />
                        新增會員
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4EFE8] border-b border-[#DED7CC] text-graphite font-serif">
                        <tr>
                          <th className="p-4">會員編號</th>
                          <th className="p-4">姓名與年齡</th>
                          <th className="p-4">聯絡電話</th>
                          <th className="p-4">儲值金餘額</th>
                          <th className="p-4">累積消費額</th>
                          <th className="p-4">膚質標籤與備註</th>
                          <th className="p-4">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE2]">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="p-10 text-center text-graphite/50 font-serif"
                            >
                              查無符合「{memberSearchQuery}」的會員資料
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map((m) => (
                            <tr key={m.id} className="hover:bg-ivory/70">
                              <td className="p-4 font-display tracking-wider">
                                {m.member_code}
                              </td>
                              <td className="p-4 font-serif font-medium text-graphite">
                                {m.full_name}（{m.gender}・{m.age}歲）
                              </td>
                              <td className="p-4 font-mono text-graphite/75">
                                {maskPhone(m.phone, isStoreManager)}
                              </td>
                              <td className="p-4 font-display font-semibold text-graphite">
                                NT${m.wallet_balance.toLocaleString()}
                              </td>
                              <td className="p-4 font-display text-graphite/75">
                                NT${m.total_spent.toLocaleString()}
                              </td>
                              <td className="p-4 space-x-1.5">
                                {m.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 border border-[#DED7CC] bg-ivory text-graphite/80 text-[11px] font-serif"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    setSelectedMemberId(m.id);
                                    setShowMemberListMode(false);
                                  }}
                                  className="px-3 py-1 bg-graphite text-ivory font-serif text-[11px] tracking-wider"
                                >
                                  檢視檔案
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : (
              <>
                {/* 3-Column Member Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="jp-card p-5 space-y-2 text-xs">
                    <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase border-b border-[#EAE4DA] pb-2">
                      MEMBER PROFILE｜基本資料
                    </div>
                    <div className="pt-1">
                      姓名：
                      <b className="font-serif text-graphite">
                        {currentMember.full_name}（{currentMember.gender}，
                        {currentMember.age}歲）
                      </b>
                    </div>
                    <div>
                      電話：
                      <span className="font-mono text-graphite">
                        {maskPhone(currentMember.phone, isStoreManager)}
                      </span>
                      {!isStoreManager && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 border border-[#DED7CC] text-graphite/50">
                          去識別化顯示
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>LINE 綁定：</span>
                      <span className="text-status-success font-serif">
                        ● 已連動官方帳號
                      </span>
                    </div>
                  </div>

                  <div className="jp-card p-5 space-y-2 text-xs">
                    <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase border-b border-[#EAE4DA] pb-2">
                      ACCOUNT ASSETS｜帳戶資產概況
                    </div>
                    <div className="pt-1 flex justify-between">
                      <span className="text-graphite/65">剩餘儲值金：</span>
                      <b className="font-display text-sm text-graphite">
                        NT${currentMember.wallet_balance.toLocaleString()}
                      </b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-graphite/65">剩餘療程堂數：</span>
                      <b className="font-serif text-sm text-roseGold-dark">
                        {memberPackages.reduce(
                          (s, p) => s + p.remaining_quota,
                          0
                        )}{" "}
                        堂
                      </b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-graphite/65">累積消費總額：</span>
                      <span className="font-display text-graphite">
                        NT${currentMember.total_spent.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="jp-card p-5 space-y-2 text-xs">
                    <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase border-b border-[#EAE4DA] pb-2">
                      CLINICAL NOTES｜標籤與備註
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentMember.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 border border-roseGold/50 bg-roseGold/10 text-graphite font-serif text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div>
                      偏好操作師：
                      <b className="font-serif text-graphite">
                        {currentMember.preferred_staff_name}
                      </b>
                    </div>
                    <div className="text-[11px] text-graphite/65 leading-relaxed">
                      醫囑備註：{currentMember.medical_notes.special_notes}
                    </div>
                  </div>
                </div>

                {/* Refined Hairline Tab Bar */}
                <div className="border-b border-[#DED7CC] flex flex-wrap gap-6 px-1">
                  {[
                    { id: "PACKAGES", label: "療程資產與核銷" },
                    { id: "ORDERS", label: "消費紀錄" },
                    { id: "CONSENTS", label: "術前同意書與簽署憑證" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCrmTab(tab.id as CrmSubTab)}
                      className={`pb-3 text-xs font-serif tracking-widest transition border-b-2 -mb-[1px] ${
                        crmTab === tab.id
                          ? "border-graphite text-graphite font-semibold"
                          : "border-transparent text-graphite/50 hover:text-graphite"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Active Packages & Skin Comparison */}
                {crmTab === "PACKAGES" && (
                  <div className="space-y-6">
                    <div className="jp-card p-5 space-y-4">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-sm font-serif font-medium text-graphite">
                          進行中療程卡片
                        </h3>
                        <span className="text-[10px] font-display tracking-widest text-graphite/45">
                          COURSE MANAGEMENT
                        </span>
                      </div>

                      {memberPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="jp-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-display tracking-widest text-roseGold-dark border border-roseGold/40 px-2 py-0.5 bg-white">
                                專案編號 {pkg.package_no}
                              </span>
                              <span className="text-sm font-serif font-medium text-graphite">
                                {pkg.treatment_name}
                              </span>
                            </div>
                            <div className="text-xs text-graphite/75">
                              總堂數：<b>{pkg.total_quota} 堂</b> ｜ 已完成：
                              <b>{pkg.total_quota - pkg.remaining_quota} 堂</b>{" "}
                              ｜ 剩餘：
                              <b className="text-roseGold-dark text-sm font-serif">
                                {pkg.remaining_quota} 堂
                              </b>
                            </div>
                            <div className="text-[11px] text-graphite/50">
                              上次核銷日期：{pkg.last_consumed_at}（操作師：
                              {pkg.last_operator_name}）
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={pkg.remaining_quota <= 0}
                              onClick={() => setConsumeModalPkg(pkg)}
                              className="px-5 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition disabled:opacity-40"
                            >
                              立即核銷 1 堂
                            </button>
                            <button
                              type="button"
                              onClick={() => setCrmTab("CONSENTS")}
                              className="px-5 py-1.5 border border-[#D8D0C5] bg-white text-graphite text-xs font-serif tracking-wider hover:border-roseGold transition"
                            >
                              查看歷次備註
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {crmTab === "ORDERS" && (
                  <div className="jp-card p-5 space-y-3">
                    <h3 className="text-sm font-serif font-medium text-graphite">
                      歷次訂單與業績歸屬紀錄
                    </h3>
                    {memberOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 jp-subcard text-xs space-y-1.5"
                      >
                        <div className="flex justify-between font-serif text-graphite">
                          <span>訂單編號：{ord.order_no}</span>
                          <span className="font-display font-semibold">
                            實付總額：NT${ord.total_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-graphite/75">
                          購買項目：
                          {ord.items
                            .map((i) => `${i.name} ×${i.quantity}`)
                            .join("、")}
                        </div>
                        <div className="text-graphite/55">
                          業績歸屬：
                          {ord.sales_split
                            .map(
                              (s) =>
                                `${s.staff_name}（${s.percentage}% ／ NT$${s.commission_amount.toLocaleString()}）`
                            )
                            .join("、")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {crmTab === "CONSENTS" && (
                  <div className="jp-card p-5 space-y-3">
                    <h3 className="text-sm font-serif font-medium text-graphite">
                      數位同意書與簽署稽核紀錄（SHA-256 防竄改雜湊驗證）
                    </h3>
                    {currentMember.consent_records.map((cs) => (
                      <div
                        key={cs.id}
                        className="p-4 jp-subcard text-xs space-y-1.5"
                      >
                        <div className="flex justify-between font-serif text-graphite">
                          <span>{cs.title}</span>
                          <span className="text-graphite/55">
                            簽署時間：{cs.signed_at}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-status-success">
                          SHA-256 稽核憑證: {cs.sha256_hash}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== 3. 療程買賣與結帳 POS (Section 3.2) ==================== */}
        {section === "POS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 jp-card p-6 space-y-5">
              <div className="flex items-baseline justify-between border-b border-[#EAE4DA] pb-3.5">
                <div>
                  <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                    CLINIC ACCOUNTING & POS
                  </span>
                  <h2 className="text-base font-serif font-medium text-graphite mt-0.5">
                    建立訂單・購買療程方案
                  </h2>
                </div>
                <span className="text-[11px] font-serif text-graphite/50">
                  支援複合式結帳與儲值金扣抵
                </span>
              </div>

              {/* 選擇客戶 */}
              <div className="space-y-1.5">
                <label className="text-xs font-serif text-graphite block">
                  選擇客戶（支援姓名／電話／編號搜尋）
                </label>
                <MemberSearchSelect
                  members={db.members}
                  value={posMemberId}
                  onChange={setPosMemberId}
                  isStoreManager={isStoreManager}
                  showWalletBalance
                />
              </div>

              {/* 購買項目 */}
              <div className="space-y-2.5 border-t border-[#EFEAE2] pt-4">
                <div className="text-xs font-serif text-graphite">
                  購買項目明細
                </div>
                {posCart.map((row, idx) => {
                  const itemObj = db.items.find((i) => i.id === row.item_id);
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 jp-subcard text-xs"
                    >
                      <div className="font-serif text-graphite">
                        0{idx + 1}. {itemObj?.name || "項目"} × {row.quantity}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-graphite/50 font-display">NT$</span>
                        <input
                          type="number"
                          value={row.custom_price}
                          onChange={(e) => {
                            const next = [...posCart];
                            next[idx].custom_price = Number(e.target.value);
                            setPosCart(next);
                          }}
                          className="w-24 border border-[#D8D0C5] bg-white px-2.5 py-1 text-right font-display font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePosCartItem(idx)}
                          className="text-graphite/45 hover:text-status-error text-[11px] font-serif"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap gap-2 pt-1">
                  {db.items
                    .filter((i) => i.type !== "CONSUMABLE")
                    .map((it: CatalogItem) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => handleAddPosCartItem(it.id)}
                        className="px-3 py-1.5 border border-dashed border-[#C7B9A5] text-xs font-serif text-graphite hover:border-roseGold hover:bg-ivory transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-roseGold-dark" />
                        新增 {it.name}（${it.price.toLocaleString()}）
                      </button>
                    ))}
                </div>
              </div>

              {/* 金額試算 */}
              <div className="p-4 jp-subcard space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-graphite/70 font-serif">
                    小計：<b className="font-display">NT${posSubtotal.toLocaleString()}</b>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-graphite/70">會員專屬折扣：-NT$</span>
                    <input
                      type="number"
                      value={posDiscount}
                      onChange={(e) => setPosDiscount(Number(e.target.value))}
                      className="w-20 border border-[#D8D0C5] bg-white px-2 py-0.5 text-right font-display text-status-error"
                    />
                  </div>
                </div>
                <div className="text-sm font-serif text-graphite pt-2 border-t border-[#E2DBD0] flex justify-between items-baseline">
                  <span>應付總額</span>
                  <span className="font-display text-lg font-semibold text-graphite">
                    NT${posTotalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 付款方式 */}
              <div className="space-y-2.5 border-t border-[#EFEAE2] pt-4 text-xs">
                <div className="font-serif text-graphite">
                  付款方式（可複選組合）
                </div>

                <div className="flex items-center justify-between p-3 jp-subcard">
                  <label className="flex items-center gap-2.5 cursor-pointer font-serif text-graphite">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="accent-graphite w-4 h-4"
                    />
                    儲值金扣款（目前餘額: NT$
                    {posMember.wallet_balance.toLocaleString()}）
                  </label>
                  <input
                    type="number"
                    disabled={!useWallet}
                    value={walletPayAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWalletPayAmount(val);
                      setCardPayAmount(Math.max(0, posTotalPayable - val));
                    }}
                    className="w-28 border border-[#D8D0C5] bg-white px-2.5 py-1 text-right font-display font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between p-3 jp-subcard">
                  <label className="flex items-center gap-2.5 cursor-pointer font-serif text-graphite">
                    <input
                      type="checkbox"
                      checked={useCreditCard}
                      onChange={(e) => setUseCreditCard(e.target.checked)}
                      className="accent-graphite w-4 h-4"
                    />
                    信用卡刷卡
                  </label>
                  <input
                    type="number"
                    disabled={!useCreditCard}
                    value={cardPayAmount}
                    onChange={(e) => setCardPayAmount(Number(e.target.value))}
                    className="w-28 border border-[#D8D0C5] bg-white px-2.5 py-1 text-right font-display font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between p-3 jp-subcard">
                  <label className="flex items-center gap-2.5 cursor-pointer font-serif text-graphite">
                    <input
                      type="checkbox"
                      checked={useCashOrLine}
                      onChange={(e) => setUseCashOrLine(e.target.checked)}
                      className="accent-graphite w-4 h-4"
                    />
                    現金 ／ LINE Pay ／ 匯款轉帳
                  </label>
                  <input
                    type="number"
                    disabled={!useCashOrLine}
                    value={cashPayAmount}
                    onChange={(e) => setCashPayAmount(Number(e.target.value))}
                    className="w-28 border border-[#D8D0C5] bg-white px-2.5 py-1 text-right font-display font-semibold"
                  />
                </div>
              </div>

              {/* 業績歸屬 */}
              <div className="space-y-2 border-t border-[#EFEAE2] pt-4 text-xs">
                <div className="font-serif text-graphite">業績歸屬拆分</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 jp-subcard flex items-center justify-between">
                    <span className="text-graphite/70 font-serif">諮詢顧問</span>
                    <select
                      value={consultantStaffId}
                      onChange={(e) => setConsultantStaffId(e.target.value)}
                      className="border border-[#D8D0C5] bg-white px-2 py-1 font-serif"
                    >
                      {db.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="font-display font-semibold text-roseGold-dark">
                      {consultantPct}%
                    </span>
                  </div>

                  <div className="p-3 jp-subcard flex items-center justify-between">
                    <span className="text-graphite/70 font-serif">操作老師</span>
                    <select
                      value={operatorStaffId}
                      onChange={(e) => setOperatorStaffId(e.target.value)}
                      className="border border-[#D8D0C5] bg-white px-2 py-1 font-serif"
                    >
                      {db.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="font-display font-semibold text-roseGold-dark">
                      {operatorPct}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={checkingOut}
                onClick={handlePosCheckout}
                className="w-full py-3.5 bg-graphite text-ivory font-serif text-xs tracking-[0.2em] hover:bg-roseGold-dark transition"
              >
                {checkingOut
                  ? "正在處理結帳與入帳..."
                  : "確認結帳並發送 LINE 電子收據"}
              </button>
            </div>

            {/* Right 5 Cols: Accounting Ledger */}
            <div className="lg:col-span-5 space-y-4">
              <div className="jp-card p-5 space-y-4">
                <div className="border-b border-[#EAE4DA] pb-2.5 flex items-baseline justify-between">
                  <h3 className="text-sm font-serif font-medium text-graphite">
                    近期訂單與業績抽成紀錄
                  </h3>
                  <span className="text-[10px] font-display tracking-widest text-graphite/45">
                    RECEIPT ARCHIVE
                  </span>
                </div>
                <div className="space-y-3">
                  {db.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 jp-subcard text-xs space-y-1.5"
                    >
                      <div className="flex justify-between font-serif text-graphite">
                        <span className="font-mono">{ord.order_no}</span>
                        <span className="font-display font-semibold">
                          NT${ord.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-graphite/80 font-serif">
                        客戶：<b>{ord.member_name}</b> ｜ 時間：{ord.created_at}
                      </div>
                      <div className="text-graphite/65">
                        購買內容：
                        {ord.items
                          .map(
                            (i) =>
                              `${i.name} ×${i.quantity} ($${i.custom_price.toLocaleString()})`
                          )
                          .join("、")}
                      </div>
                      <div className="pt-1.5 border-t border-[#E6E0D6] text-[11px] text-roseGold-dark font-serif">
                        業績歸屬：
                        {ord.sales_split
                          .map(
                            (s) =>
                              `${s.staff_name} ${s.percentage}% (NT$${s.commission_amount.toLocaleString()})`
                          )
                          .join(" ／ ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. 預約排程看板 (Section 3.4) ==================== */}
        {section === "SCHEDULE" && (
          <div className="space-y-5">
            <div className="jp-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                    {scheduleViewMode === "DAY"
                      ? "DAILY TIMELINE SCHEDULE"
                      : scheduleViewMode === "WEEK"
                      ? "WEEKLY CALENDAR OVERVIEW"
                      : "ROOM & DEVICE GANTT SCHEDULE"}
                  </span>
                  <h2 className="text-base font-serif font-medium text-graphite mt-0.5">
                    {scheduleViewMode === "DAY"
                      ? "2026年 3月 12日（週四）每日時間軸與人員排程"
                      : scheduleViewMode === "WEEK"
                      ? "2026年 3月 9日 – 3月 15日 本週預約總覽"
                      : "2026年 3月 12日（週四）獨立包廂與儀器排程看板"}
                  </h2>
                </div>

                <div className="flex border border-[#D8D0C5] bg-ivory text-xs font-serif">
                  {[
                    { id: "DAY", label: "日視圖" },
                    { id: "WEEK", label: "週視圖" },
                    { id: "ROOM", label: "包廂視圖" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setScheduleViewMode(v.id as "ROOM" | "DAY" | "WEEK")
                      }
                      className={`px-3.5 py-1.5 transition ${
                        scheduleViewMode === v.id
                          ? "bg-graphite text-ivory"
                          : "text-graphite/65 hover:text-graphite"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(true)}
                  className="px-4 py-2 border border-graphite bg-white text-graphite text-xs font-serif tracking-widest hover:bg-graphite hover:text-ivory transition"
                >
                  + 新增包廂
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(true)}
                  className="px-4 py-2 border border-graphite bg-white text-graphite text-xs font-serif tracking-widest hover:bg-graphite hover:text-ivory transition"
                >
                  + 新增操作老師
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(true)}
                  className="px-4 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  + 快速代客預約
                </button>
              </div>
            </div>

            {/* 視圖一：日視圖（依時間軸與主責操作師檢視當日預約） */}
            {scheduleViewMode === "DAY" && (() => {
              const dayAppointments = db.appointments
                .filter(
                  (a) =>
                    a.date === db.referenceDate && a.status !== "CANCELLED"
                )
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const inProgressCount = dayAppointments.filter(
                (a) => a.status === "IN_PROGRESS"
              ).length;
              const confirmedCount = dayAppointments.filter(
                (a) => a.status === "CONFIRMED"
              ).length;
              const activeStaffCount = new Set(
                dayAppointments.map((a) => a.staff_id)
              ).size;

              return (
                <div className="space-y-4">
                  {/* 當日摘要指標列 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="jp-card p-4">
                      <div className="text-[10px] font-display tracking-widest text-graphite/50 uppercase">
                        TOTAL TODAY
                      </div>
                      <div className="text-xs font-serif text-graphite/70 mt-0.5">
                        當日有效預約
                      </div>
                      <div className="text-xl font-display font-semibold text-graphite mt-1">
                        {dayAppointments.length} 筆
                      </div>
                    </div>
                    <div className="jp-card p-4">
                      <div className="text-[10px] font-display tracking-widest text-roseGold-dark uppercase">
                        IN PROGRESS
                      </div>
                      <div className="text-xs font-serif text-graphite/70 mt-0.5">
                        目前施作中
                      </div>
                      <div className="text-xl font-display font-semibold text-roseGold-dark mt-1">
                        {inProgressCount} 筆
                      </div>
                    </div>
                    <div className="jp-card p-4">
                      <div className="text-[10px] font-display tracking-widest text-status-success uppercase">
                        CONFIRMED
                      </div>
                      <div className="text-xs font-serif text-graphite/70 mt-0.5">
                        待報到 / 已確認
                      </div>
                      <div className="text-xl font-display font-semibold text-status-success mt-1">
                        {confirmedCount} 筆
                      </div>
                    </div>
                    <div className="jp-card p-4">
                      <div className="text-[10px] font-display tracking-widest text-graphite/50 uppercase">
                        STAFF ON DUTY
                      </div>
                      <div className="text-xs font-serif text-graphite/70 mt-0.5">
                        排班操作人員
                      </div>
                      <div className="text-xl font-display font-semibold text-graphite mt-1">
                        {activeStaffCount} 位
                      </div>
                    </div>
                  </div>

                  {/* 當日時間軸清單 */}
                  <div className="jp-card divide-y divide-[#EFEAE2]">
                    {dayAppointments.length === 0 ? (
                      <div className="p-10 text-center text-xs font-serif text-graphite/45">
                        本日目前尚無有效預約排程
                      </div>
                    ) : (
                      dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-ivory/40 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-36 shrink-0 border-l-2 border-roseGold pl-3">
                              <div className="text-base font-display font-semibold text-graphite">
                                {apt.start_time} – {apt.end_time}
                              </div>
                              <div className="text-[11px] text-graphite/50 font-serif mt-0.5">
                                清消緩衝至 {apt.buffer_end_time}
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-serif font-medium text-graphite">
                                  {apt.member_name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-serif border ${
                                    apt.status === "IN_PROGRESS"
                                      ? "border-roseGold bg-roseGold/10 text-roseGold-dark"
                                      : "border-[#D8D0C5] bg-ivory text-graphite/75"
                                  }`}
                                >
                                  {apt.status === "IN_PROGRESS"
                                    ? "施作中"
                                    : "已確認"}
                                </span>
                                <span className="text-[11px] text-graphite/50 font-display">
                                  {apt.appointment_no}
                                </span>
                              </div>

                              <div className="text-graphite/80 font-serif">
                                療程項目：{apt.treatment_name}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-graphite/65">
                                <span className="px-2 py-0.5 bg-ivory border border-[#E6E0D6]">
                                  主責：{apt.staff_name}
                                </span>
                                <span className="px-2 py-0.5 bg-ivory border border-[#E6E0D6]">
                                  包廂：{apt.room_name}
                                </span>
                                {apt.machine_name && (
                                  <span className="px-2 py-0.5 bg-white border border-roseGold/40 text-roseGold-dark">
                                    設備鎖定：{apt.machine_name}
                                  </span>
                                )}
                              </div>

                              {apt.notes && (
                                <div className="text-[11px] text-graphite/55 pt-0.5">
                                  備註：{apt.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#EFEAE2]">
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleModalAptId(apt.id);
                                setNewStartTime(apt.start_time);
                                setNewRoomId(apt.room_id);
                                setNewStaffId(apt.staff_id);
                              }}
                              className="px-3.5 py-1.5 border border-[#D8D0C5] bg-white text-xs font-serif text-graphite hover:border-roseGold hover:text-roseGold-dark transition flex items-center gap-1"
                            >
                              <MoveRight className="w-3 h-3" />
                              改期或換包廂
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="px-3.5 py-1.5 border border-status-error/30 text-xs font-serif text-status-error/85 hover:bg-status-error hover:text-white transition"
                            >
                              取消並通知候補
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 視圖二：週視圖（本週七日預約行事曆總覽） */}
            {scheduleViewMode === "WEEK" && (() => {
              const weekDays = [
                { date: "2026-03-09", label: "03/09", weekday: "週一" },
                { date: "2026-03-10", label: "03/10", weekday: "週二" },
                { date: "2026-03-11", label: "03/11", weekday: "週三" },
                { date: "2026-03-12", label: "03/12", weekday: "週四" },
                { date: "2026-03-13", label: "03/13", weekday: "週五" },
                { date: "2026-03-14", label: "03/14", weekday: "週六" },
                { date: "2026-03-15", label: "03/15", weekday: "週日" },
              ];

              return (
                <div className="jp-card overflow-x-auto">
                  <div className="grid grid-cols-7 min-w-[960px] divide-x divide-[#E6E0D6]">
                    {weekDays.map((day) => {
                      const isToday = day.date === db.referenceDate;
                      const dayApts = db.appointments
                        .filter(
                          (a) =>
                            a.date === day.date && a.status !== "CANCELLED"
                        )
                        .sort((a, b) =>
                          a.start_time.localeCompare(b.start_time)
                        );

                      return (
                        <div key={day.date} className="flex flex-col min-h-[420px]">
                          {/* 週日標題欄 */}
                          <div
                            className={`p-3.5 border-b border-[#DED7CC] text-center ${
                              isToday
                                ? "bg-graphite text-ivory"
                                : "bg-[#F4EFE8] text-graphite"
                            }`}
                          >
                            <div
                              className={`text-[10px] font-serif tracking-widest ${
                                isToday ? "text-roseGold-light" : "text-graphite/60"
                              }`}
                            >
                              {day.weekday}
                              {isToday ? "・今日" : ""}
                            </div>
                            <div className="text-sm font-display font-semibold mt-0.5">
                              {day.label}
                            </div>
                            <div
                              className={`text-[10px] mt-1 font-serif ${
                                isToday ? "text-ivory/75" : "text-graphite/50"
                              }`}
                            >
                              {dayApts.length} 筆預約
                            </div>
                          </div>

                          {/* 該日預約卡片列表 */}
                          <div
                            className={`p-2.5 space-y-2.5 flex-1 ${
                              isToday ? "bg-roseGold/5" : "bg-white"
                            }`}
                          >
                            {dayApts.length === 0 ? (
                              <div className="h-24 border border-dashed border-[#E6E0D6] flex items-center justify-center text-[11px] font-serif text-graphite/30">
                                尚無排程
                              </div>
                            ) : (
                              dayApts.map((apt) => (
                                <div
                                  key={apt.id}
                                  className="p-2.5 bg-ivory border-l-2 border-roseGold border border-[#E6E0D6] space-y-1.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-display font-semibold text-graphite">
                                      {apt.start_time}
                                    </span>
                                    <span className="text-[10px] font-serif text-roseGold-dark">
                                      {apt.status === "IN_PROGRESS"
                                        ? "施作中"
                                        : "已確認"}
                                    </span>
                                  </div>
                                  <div className="font-serif font-medium text-graphite truncate">
                                    {apt.member_name}
                                  </div>
                                  <div className="text-graphite/70 line-clamp-2 leading-snug">
                                    {apt.treatment_name}
                                  </div>
                                  <div className="text-[10px] text-graphite/55 pt-1 border-t border-[#E6E0D6] space-y-0.5">
                                    <div>{apt.staff_name}</div>
                                    <div className="truncate">{apt.room_name}</div>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRescheduleModalAptId(apt.id);
                                        setNewStartTime(apt.start_time);
                                        setNewRoomId(apt.room_id);
                                        setNewStaffId(apt.staff_id);
                                      }}
                                      className="text-[10px] font-serif text-graphite/80 hover:text-roseGold-dark underline"
                                    >
                                      調整
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCancelAppointment(apt.id)
                                      }
                                      className="text-[10px] font-serif text-status-error/80 hover:text-status-error"
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 視圖三：包廂視圖（獨立包廂與儀器甘特排程表） */}
            {scheduleViewMode === "ROOM" && (
              <div className="jp-card overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4EFE8] border-b border-[#DED7CC] text-graphite font-serif">
                      <th className="p-4 w-28 border-r border-[#E2DBD0]">時間</th>
                      {db.resources
                        .filter((r) => r.type === "ROOM")
                        .map((room) => (
                          <th
                            key={room.id}
                            className="p-4 border-r border-[#E2DBD0] font-medium"
                          >
                            {room.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE2]">
                    {["13:00", "14:30", "15:00", "16:30"].map((timeSlot) => (
                      <tr key={timeSlot} className="align-top">
                        <td className="p-4 font-display text-sm font-semibold text-graphite bg-ivory/60 border-r border-[#EFEAE2]">
                          {timeSlot}
                        </td>
                        {db.resources
                          .filter((r) => r.type === "ROOM")
                          .map((room) => {
                            const apt = db.appointments.find(
                              (a) =>
                                a.room_id === room.id &&
                                a.start_time === timeSlot &&
                                a.status !== "CANCELLED"
                            );

                            const disinfectingApt = db.appointments.find(
                              (a) =>
                                a.room_id === room.id &&
                                a.end_time === timeSlot &&
                                a.status !== "CANCELLED"
                            );

                            return (
                              <td
                                key={room.id}
                                className="p-3.5 border-r border-[#EFEAE2]"
                              >
                                {apt ? (
                                  <div className="bg-ivory border-l-2 border-roseGold p-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-serif font-medium text-graphite">
                                        {apt.member_name}（{apt.staff_name}）
                                      </span>
                                      <span className="text-[10px] font-serif text-roseGold-dark">
                                        {apt.status === "IN_PROGRESS"
                                          ? "施作中"
                                          : "已確認"}
                                      </span>
                                    </div>
                                    <div className="text-graphite/75">
                                      項目：{apt.treatment_name}
                                    </div>
                                    <div className="text-[11px] text-graphite/55 font-display">
                                      {apt.start_time} – {apt.end_time}（清消完成{" "}
                                      {apt.buffer_end_time}）
                                    </div>
                                    {apt.machine_name && (
                                      <div className="inline-block text-[10px] px-2 py-0.5 border border-[#D8D0C5] bg-white text-graphite font-serif">
                                        設備鎖定：{apt.machine_name}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 pt-2 border-t border-[#E6E0D6]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRescheduleModalAptId(apt.id);
                                          setNewStartTime(apt.start_time);
                                          setNewRoomId(apt.room_id);
                                          setNewStaffId(apt.staff_id);
                                        }}
                                        className="text-[11px] font-serif text-graphite hover:text-roseGold-dark flex items-center gap-1"
                                      >
                                        <MoveRight className="w-3 h-3" />
                                        改期或換包廂
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCancelAppointment(apt.id)
                                        }
                                        className="text-[11px] font-serif text-status-error/80 hover:text-status-error"
                                      >
                                        取消並通知候補
                                      </button>
                                    </div>
                                  </div>
                                ) : disinfectingApt ? (
                                  <div className="p-3.5 border border-dashed border-roseGold/50 bg-roseGold/5 text-roseGold-dark font-serif text-center">
                                    清消與準備中（15 分鐘緩衝）
                                  </div>
                                ) : (
                                  <div className="h-20 border border-dashed border-[#E6E0D6] flex items-center justify-center text-graphite/30 font-serif">
                                    空檔可排程
                                  </div>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Waitlist */}
            <div className="jp-card p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-serif font-medium text-graphite">
                  智慧候位清單 — 名額釋出時自動發送限時 15 分鐘優先認領通知
                </h3>
                <span className="text-[10px] font-display tracking-widest text-graphite/45">
                  WAITLIST CONCIERGE
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {db.waitlist.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 jp-subcard flex items-center justify-between"
                  >
                    <div>
                      <div className="font-serif font-medium text-graphite">
                        {w.member_name} — {w.date} {w.slot_time}
                      </div>
                      <div className="text-graphite/60 mt-0.5">
                        {w.treatment_name}（{w.staff_name}）
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 border border-[#D8D0C5] bg-white text-[10px] font-serif text-graphite">
                      {w.status === "NOTIFIED_15M"
                        ? "已發送認領通知"
                        : "候補等待中"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 獨立診療包廂管理 (Room Management) */}
            <div className="jp-card p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                    PRIVATE ROOM MANAGEMENT
                  </span>
                  <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                    獨立診療包廂管理（新增或刪減排程包廂）
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(true)}
                  className="px-3.5 py-1.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  + 新增包廂
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {db.resources
                  .filter((r) => r.type === "ROOM")
                  .map((room) => {
                    const activeCount = db.appointments.filter(
                      (a) => a.room_id === room.id && a.status !== "CANCELLED"
                    ).length;
                    return (
                      <div
                        key={room.id}
                        className="p-3.5 jp-subcard flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-display px-2 py-0.5 border border-[#D8D0C5] bg-white text-roseGold-dark">
                              {room.code}
                            </span>
                            <span className="font-serif font-medium text-graphite">
                              {room.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-graphite/55 font-serif">
                            目前有效預約：{activeCount} 筆
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          className={`px-2.5 py-1 text-[11px] font-serif border transition shrink-0 ${
                            activeCount > 0
                              ? "border-[#E2DBD0] text-graphite/40 hover:border-status-warning hover:text-status-warning"
                              : "border-status-error/35 text-status-error/85 hover:bg-status-error hover:text-white"
                          }`}
                          title={
                            activeCount > 0
                              ? "此包廂尚有有效預約，需先改期換包廂後才可刪除"
                              : "刪除此包廂"
                          }
                        >
                          刪除
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 診所操作師與專業團隊管理 (Staff Roster) */}
            <div className="jp-card p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                    STAFF ROSTER & OPERATORS
                  </span>
                  <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                    診所操作老師與醫師團隊管理（預約與業績歸屬名單）
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(true)}
                  className="px-3.5 py-1.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  + 新增操作老師
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {db.staff.map((st) => {
                  const roleLabel =
                    st.role === "DOCTOR"
                      ? "醫師"
                      : st.role === "BEAUTICIAN"
                      ? "操作老師"
                      : st.role === "CONSULTANT"
                      ? "諮詢顧問"
                      : "管理員";
                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 jp-subcard flex flex-col justify-between gap-2.5 ${
                        !st.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif font-medium text-graphite">
                            {st.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 border border-[#D8D0C5] bg-white font-serif text-roseGold-dark">
                            {roleLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-graphite/65">
                          {st.title}
                        </div>
                        <div className="text-[11px] text-graphite/45 font-display">
                          {st.phone}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#E6E0D6] flex items-center justify-between">
                        <span
                          className={`text-[10px] font-serif ${
                            st.is_active
                              ? "text-status-success"
                              : "text-graphite/45"
                          }`}
                        >
                          {st.is_active ? "● 可排班預約" : "○ 已暫停排班"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffActive(st.id)}
                          className="text-[11px] font-serif text-graphite/70 hover:text-roseGold-dark underline"
                        >
                          {st.is_active ? "暫停" : "啟用"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. 耗材庫存與批號管理 (Section 3.3) ==================== */}
        {section === "INVENTORY" && (
          <div className="space-y-5">
            <div className="jp-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                  INVENTORY & BATCH CONTROL
                </span>
                <h1 className="text-lg font-serif font-medium text-graphite mt-0.5">
                  庫存與進貨管理（FIFO 先進先出與效期預警）
                </h1>
                <p className="text-xs text-graphite/60 mt-0.5">
                  到期前 60 天自動標示效期預警・療程核銷時自動由最早到期批號優先扣減
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateItemModal(true)}
                  className="px-4 py-2 border border-graphite bg-white text-graphite text-xs font-serif tracking-widest hover:bg-graphite hover:text-ivory transition"
                >
                  + 新增產品 / 耗材
                </button>
                <button
                  type="button"
                  onClick={() => setShowStockInModal(true)}
                  className="px-4 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  + 進貨入庫
                </button>
                <button
                  type="button"
                  onClick={handleExportInventoryCsv}
                  className="px-4 py-2 border border-[#D8D0C5] bg-white text-graphite text-xs font-serif tracking-wider hover:border-roseGold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  盤點匯出 CSV
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="jp-card p-4 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-serif text-graphite">狀態篩選：</span>
                <select
                  value={invStatusFilter}
                  onChange={(e) => setInvStatusFilter(e.target.value)}
                  className="border border-[#D8D0C5] bg-ivory px-3 py-1.5 font-serif"
                >
                  <option value="ALL">
                    全部批號（{db.inventory_batches.length}）
                  </option>
                  <option value="WARNING">
                    效期預警與需補貨（{warningBatches.length}）
                  </option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="請輸入品名規格或批號搜尋（例: HA-202511-01）..."
                  className="w-full border border-[#D8D0C5] bg-ivory px-3.5 py-1.5"
                />
              </div>
            </div>

            {/* Batch Table */}
            <div className="jp-card overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4EFE8] border-b border-[#DED7CC] text-graphite font-serif">
                  <tr>
                    <th className="p-4">品名規格</th>
                    <th className="p-4">批號 (Batch)</th>
                    <th className="p-4">現有庫存</th>
                    <th className="p-4">安全庫存</th>
                    <th className="p-4">有效期限</th>
                    <th className="p-4">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE2]">
                  {filteredBatches.map((batch) => {
                    const st = getBatchStatus(batch, db.referenceDate);
                    return (
                      <tr key={batch.id} className="hover:bg-ivory/70">
                        <td className="p-4 font-serif font-medium text-graphite">
                          {batch.item_name}
                        </td>
                        <td className="p-4 font-mono text-graphite/75">
                          {batch.batch_no}
                        </td>
                        <td className="p-4 font-display font-semibold text-graphite">
                          {batch.stock_quantity} {batch.unit}
                        </td>
                        <td className="p-4 font-display text-graphite/55">
                          {batch.safety_stock} {batch.unit}
                        </td>
                        <td className="p-4 font-display">
                          {batch.expiry_date.replace(/-/g, "/")}（剩{" "}
                          {st.daysUntilExpiry} 天）
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 border text-[11px] font-serif ${
                              st.code === "SUFFICIENT"
                                ? "border-status-success/40 text-status-success bg-status-success/5"
                                : st.code === "LOW_STOCK"
                                ? "border-status-error/40 text-status-error bg-status-error/5"
                                : "border-status-warning/50 text-status-warning bg-status-warning/10"
                            }`}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BOM Recipe */}
            <div className="jp-card p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-serif font-medium text-graphite">
                  療程標準耗材配方（Treatment BOM — 堂數核銷時依 FIFO 自動扣減）
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!bomTreatmentId) {
                      setBomTreatmentId(
                        db.items.find((i) => i.type === "TREATMENT")?.id || ""
                      );
                    }
                    if (!bomConsumableId) {
                      setBomConsumableId(
                        db.items.find((i) => i.type === "CONSUMABLE")?.id || ""
                      );
                    }
                    setShowAddBomModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                >
                  + 新增療程配方
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {db.items
                  .filter((i) => i.type === "TREATMENT")
                  .map((trt) => {
                    const recipes = db.treatment_bom.filter(
                      (b) => b.treatment_id === trt.id
                    );
                    const recipeWithCost = recipes.map((r) => {
                      const itemObj = db.items.find(
                        (it) => it.id === r.inventory_item_id
                      );
                      const fallbackBatch = db.inventory_batches.find(
                        (bt) => bt.item_id === r.inventory_item_id
                      );
                      const unitPrice =
                        itemObj?.price ?? fallbackBatch?.cost_price ?? 0;
                      const subtotal = Math.round(unitPrice * r.deduct_quantity);
                      return { ...r, unitPrice, subtotal };
                    });
                    const totalBomCost = recipeWithCost.reduce(
                      (sum, r) => sum + r.subtotal,
                      0
                    );
                    const sessions = trt.package_sessions || 1;
                    const perSessionPrice = Math.round(trt.price / sessions);

                    return (
                      <div
                        key={trt.id}
                        className="p-3.5 jp-subcard flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-serif font-medium text-graphite">
                              {trt.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setBomTreatmentId(trt.id);
                                setShowAddBomModal(true);
                              }}
                              className="text-[11px] font-serif text-roseGold-dark hover:underline shrink-0"
                            >
                              + 加入耗材
                            </button>
                          </div>
                          {recipeWithCost.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {recipeWithCost.map((r) => (
                                <span
                                  key={r.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E2DBD0] text-graphite/80"
                                >
                                  <span>
                                    {r.inventory_item_name} × {r.deduct_quantity}
                                    {r.unit}
                                  </span>
                                  <span className="text-[11px] font-display font-medium text-roseGold-dark border-l border-[#E6E0D6] pl-1.5">
                                    NT${r.subtotal.toLocaleString()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteTreatmentBom(r.id)
                                    }
                                    className="text-graphite/40 hover:text-status-error transition"
                                    title="移除此耗材配方"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-graphite/45 font-serif">
                              尚未設定自動扣減耗材配方
                            </div>
                          )}
                        </div>

                        {/* 單堂耗材費用與療程定價摘要 */}
                        <div className="pt-2 border-t border-[#E6E0D6] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="text-graphite/70 font-serif">
                            單堂耗材費用合計：
                            <b className="font-display text-xs text-graphite ml-1">
                              NT${totalBomCost.toLocaleString()}
                            </b>
                          </div>
                          <div className="text-graphite/55 font-serif">
                            療程定價：
                            <span className="font-display text-graphite/80">
                              NT${trt.price.toLocaleString()}
                            </span>
                            {sessions > 1 && (
                              <span className="ml-1 text-graphite/50">
                                （單堂均價 NT${perSessionPrice.toLocaleString()}）
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 6. LINE 自動化排程引擎 (Section 3.6) ==================== */}
        {section === "LINE_ENGINE" && (
          <div className="space-y-5">
            <div className="jp-card p-5">
              <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                AUTOMATED CARE & CONCIERGE
              </span>
              <h1 className="text-lg font-serif font-medium text-graphite mt-0.5">
                LINE 官方帳號 自動化排程與術後關懷引擎
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4 text-xs">
                {[
                  {
                    step: "任務 A / 立即推播",
                    title: "預約成功通知",
                    desc: "推播預約明細、包廂安排與診所交通指引",
                  },
                  {
                    step: "任務 B / 前 24 小時",
                    title: "行前防爽約提醒",
                    desc: "術前停用酸類提醒＋【確認出席／改期取消】互動按鈕",
                  },
                  {
                    step: "任務 C / 術後第 3 天",
                    title: "術後修復關懷問卷",
                    desc: "若貴賓點選「紅腫不適」，系統自動通知護理師主動致電",
                  },
                  {
                    step: "任務 D / 術後第 21 天",
                    title: "黃金週期維護提醒",
                    desc: "膠原蛋白最佳維持期提醒，引導預約下期保養",
                  },
                ].map((node) => (
                  <div key={node.step} className="p-3.5 jp-subcard space-y-1">
                    <span className="text-[9px] font-display tracking-[0.18em] text-roseGold-dark block">
                      {node.step}
                    </span>
                    <div className="font-serif font-medium text-graphite">
                      {node.title}
                    </div>
                    <p className="text-[11px] text-graphite/60 leading-relaxed">
                      {node.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="jp-card p-5 space-y-3">
              <h3 className="text-sm font-serif font-medium text-graphite">
                推播任務佇列與顧客互動回饋紀錄（BullMQ Delayed Queue）
              </h3>
              <div className="divide-y divide-[#EFEAE2]">
                {db.line_jobs.map((job) => (
                  <div
                    key={job.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 border border-[#D8D0C5] bg-ivory text-graphite/65">
                          {job.job_id}
                        </span>
                        <span className="font-serif font-medium text-graphite">
                          {job.label}
                        </span>
                        <span className="text-graphite/55">
                          — 對象：{job.member_name}
                        </span>
                      </div>
                      <p className="text-graphite/75 leading-relaxed">
                        {job.message_preview}
                      </p>
                      {job.customer_feedback && (
                        <div className="font-serif text-status-error">
                          {job.customer_feedback}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 border text-[11px] font-serif ${
                          job.status === "SENT"
                            ? "border-status-success/40 text-status-success"
                            : job.status === "ALERT_CALLBACK"
                            ? "border-status-error bg-status-error text-white"
                            : job.status === "CANCELLED"
                            ? "border-[#DED7CC] text-graphite/40 line-through"
                            : "border-roseGold/50 text-roseGold-dark"
                        }`}
                      >
                        {job.status === "SENT"
                          ? "已發送"
                          : job.status === "SCHEDULED"
                          ? "排程等待中"
                          : job.status === "CANCELLED"
                          ? "已取消回收"
                          : "需主動電訪"}
                      </span>
                      {job.status === "SCHEDULED" && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch("/api/v1/state", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "TRIGGER_LINE_JOB",
                                job_id: job.id,
                              }),
                            });
                            toast(`已立即執行推播任務 ${job.job_id}`, "success");
                            await onRefresh();
                          }}
                          className="px-3 py-1 bg-graphite text-ivory text-[11px] font-serif tracking-wider"
                        >
                          立即推播測試
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL: 堂數核銷與電子簽名 ==================== */}
      {consumeModalPkg && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-3">
              <div>
                <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                  COURSE CONSUMPTION & FIFO
                </span>
                <h3 className="text-base font-serif font-medium text-graphite">
                  療程堂數核銷與耗材 FIFO 自動扣減（{consumeModalPkg.package_no}）
                </h3>
              </div>
              <button onClick={() => setConsumeModalPkg(null)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="p-3.5 jp-subcard text-xs space-y-1">
              <div className="font-serif">
                核銷會員：<b>{currentMember.full_name}</b> ｜ 目前剩餘：
                <b>{consumeModalPkg.remaining_quota} 堂</b> → 核銷後剩餘：
                <b className="text-roseGold-dark">
                  {consumeModalPkg.remaining_quota - 1} 堂
                </b>
              </div>
              <div className="text-graphite/65">
                FIFO 自動扣減配方：
                {db.treatment_bom
                  .filter((b) => b.treatment_id === consumeModalPkg.treatment_id)
                  .map(
                    (b) => `${b.inventory_item_name} ×${b.deduct_quantity}${b.unit}`
                  )
                  .join("、")}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-serif text-graphite">執行操作師</label>
              <select
                value={consumeOperatorId}
                onChange={(e) => setConsumeOperatorId(e.target.value)}
                className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 font-serif"
              >
                {db.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.title}）
                  </option>
                ))}
              </select>
            </div>

            <SignaturePad
              height={120}
              label="顧客現場確認簽名（核銷堂數簽署存證）"
              onChange={(url) => setConsumeSignature(url)}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConsumeModalPkg(null)}
                className="flex-1 py-2.5 border border-[#D8D0C5] text-xs font-serif text-graphite"
              >
                取消
              </button>
              <button
                type="button"
                disabled={consuming}
                onClick={handleConfirmConsumption}
                className="flex-1 py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
              >
                {consuming ? "核銷處理中..." : "確認核銷 1 堂"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 排程變更 ==================== */}
      {rescheduleModalAptId && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <h3 className="text-sm font-serif font-medium text-graphite">
                預約時段・包廂・操作師變更
              </h3>
              <button onClick={() => setRescheduleModalAptId(null)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1">變更後時段</label>
                <select
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {[
                    "11:00",
                    "13:00",
                    "13:30",
                    "14:30",
                    "15:00",
                    "16:30",
                    "18:00",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-serif">變更後包廂</label>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoomModal(true)}
                    className="text-[11px] font-serif text-roseGold-dark hover:underline"
                  >
                    + 新增包廂
                  </button>
                </div>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.resources
                    .filter((r) => r.type === "ROOM")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-serif">指定操作師</label>
                  <button
                    type="button"
                    onClick={() => setShowCreateStaffModal(true)}
                    className="text-[11px] font-serif text-roseGold-dark hover:underline"
                  >
                    + 新增操作老師
                  </button>
                </div>
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.staff
                    .filter((s) => s.role !== "CONSULTANT" && s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setRescheduleModalAptId(null)}
                className="flex-1 py-2 border border-[#D8D0C5] text-xs font-serif"
              >
                返回
              </button>
              <button
                onClick={handleRescheduleSubmit}
                className="flex-1 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest"
              >
                確認變更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 快速代客預約 ==================== */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <h3 className="text-sm font-serif font-medium text-graphite">
                櫃檯快速代客預約
              </h3>
              <button onClick={() => setShowWalkInModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1">
                  選擇會員（支援姓名／電話／編號搜尋）
                </label>
                <MemberSearchSelect
                  members={db.members}
                  value={walkInMemberId}
                  onChange={setWalkInMemberId}
                  isStoreManager={isStoreManager}
                />
              </div>

              <div>
                <label className="font-serif block mb-1">療程項目</label>
                <select
                  value={walkInTreatmentId}
                  onChange={(e) => setWalkInTreatmentId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.items
                    .filter((i) => i.type === "TREATMENT")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-serif">指定操作師</label>
                  <button
                    type="button"
                    onClick={() => setShowCreateStaffModal(true)}
                    className="text-[11px] font-serif text-roseGold-dark hover:underline"
                  >
                    + 新增操作老師
                  </button>
                </div>
                <select
                  value={walkInStaffId}
                  onChange={(e) => setWalkInStaffId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.staff
                    .filter((s) => s.role !== "CONSULTANT" && s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}（{s.title}）
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-serif block mb-1">預約時段</label>
                <select
                  value={walkInTime}
                  onChange={(e) => setWalkInTime(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {["11:00", "13:00", "14:30", "15:00", "16:30", "18:00"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={handleQuickWalkInSubmit}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest"
            >
              確認建立預約
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 進貨入庫 ==================== */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <h3 className="text-sm font-serif font-medium text-graphite">
                醫療耗材批號進貨驗收入庫
              </h3>
              <button onClick={() => setShowStockInModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1">耗材品項</label>
                <select
                  value={stockInItemId}
                  onChange={(e) => setStockInItemId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.items
                    .filter((i) => i.type === "CONSUMABLE")
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}（安全庫存: {i.safety_stock} {i.unit}）
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-serif block mb-1">
                  製造批號 (Batch No.)
                </label>
                <input
                  type="text"
                  value={stockInBatchNo}
                  onChange={(e) => setStockInBatchNo(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-serif block mb-1">有效期限</label>
                  <input
                    type="date"
                    value={stockInExpiry}
                    onChange={(e) => setStockInExpiry(e.target.value)}
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-serif block mb-1">入庫數量</label>
                  <input
                    type="number"
                    value={stockInQty}
                    onChange={(e) => setStockInQty(Number(e.target.value))}
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAddStockBatch}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest"
            >
              確認驗收入庫
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 新增產品 / 耗材 / 療程品項 ==================== */}
      {showCreateItemModal && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <div>
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                  CATALOG REGISTRATION
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                  新增產品 / 醫療耗材 / 療程品項
                </h3>
              </div>
              <button onClick={() => setShowCreateItemModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 品項類型切換 */}
              <div>
                <label className="font-serif block mb-1.5">品項類型</label>
                <div className="grid grid-cols-3 border border-[#D8D0C5] bg-ivory p-0.5 font-serif">
                  {[
                    { id: "CONSUMABLE", label: "醫療耗材" },
                    { id: "PRODUCT", label: "零售產品" },
                    { id: "TREATMENT", label: "美學療程" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const nextType = t.id as
                          | "CONSUMABLE"
                          | "PRODUCT"
                          | "TREATMENT";
                        setNewItemType(nextType);
                        if (nextType === "CONSUMABLE") {
                          setNewItemCategory("醫療耗材");
                          setNewItemUnit("瓶");
                        } else if (nextType === "PRODUCT") {
                          setNewItemCategory("術後修護保養");
                          setNewItemUnit("盒");
                        } else {
                          setNewItemCategory("美學療程");
                          setNewItemUnit("堂");
                        }
                      }}
                      className={`py-1.5 transition ${
                        newItemType === t.id
                          ? "bg-graphite text-ivory"
                          : "text-graphite/65 hover:text-graphite"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-serif block mb-1">
                  品項名稱 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={
                    newItemType === "CONSUMABLE"
                      ? "例如：外泌體修護安瓶 5ml"
                      : newItemType === "PRODUCT"
                      ? "例如：術後冰鎮舒緩修護霜"
                      : "例如：外泌體水光煥膚療程 (4堂)"
                  }
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-serif block mb-1">分類</label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-serif block mb-1">計量單位</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="瓶 / 盒 / 支 / 堂"
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-serif block mb-1">
                    {newItemType === "CONSUMABLE"
                      ? "參考進貨單價 (NT$)"
                      : "標準定價 (NT$)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
                {newItemType === "TREATMENT" ? (
                  <div>
                    <label className="font-serif block mb-1">
                      療程時長（分鐘）
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={newItemDurationMin}
                      onChange={(e) =>
                        setNewItemDurationMin(Number(e.target.value))
                      }
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-serif block mb-1">安全庫存水位</label>
                    <input
                      type="number"
                      min={1}
                      value={newItemSafetyStock}
                      onChange={(e) =>
                        setNewItemSafetyStock(Number(e.target.value))
                      }
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                    />
                  </div>
                )}
              </div>

              {newItemType === "TREATMENT" && (
                <div>
                  <label className="font-serif block mb-1">
                    方案堂數（單次請填 1）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItemSessions}
                    onChange={(e) => setNewItemSessions(Number(e.target.value))}
                    className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                  />
                </div>
              )}

              {/* 醫療耗材可選填首批入庫批號 */}
              {newItemType === "CONSUMABLE" && (
                <div className="p-3.5 jp-subcard space-y-3">
                  <div className="font-serif font-medium text-graphite">
                    同時建立首批入庫批號（選填）
                  </div>
                  <div>
                    <label className="font-serif block mb-1 text-graphite/75">
                      製造批號 (Batch No.)
                    </label>
                    <input
                      type="text"
                      value={newItemInitBatchNo}
                      onChange={(e) => setNewItemInitBatchNo(e.target.value)}
                      placeholder="留空則僅建立品項，稍後再進貨入庫"
                      className="w-full border border-[#D8D0C5] bg-white px-3 py-2 font-mono"
                    />
                  </div>
                  {newItemInitBatchNo.trim() && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-serif block mb-1 text-graphite/75">
                          有效期限
                        </label>
                        <input
                          type="date"
                          value={newItemInitExpiry}
                          onChange={(e) => setNewItemInitExpiry(e.target.value)}
                          className="w-full border border-[#D8D0C5] bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-serif block mb-1 text-graphite/75">
                          初始入庫數量
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newItemInitQty}
                          onChange={(e) =>
                            setNewItemInitQty(Number(e.target.value))
                          }
                          className="w-full border border-[#D8D0C5] bg-white px-3 py-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateCatalogItem}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
            >
              確認建立品項
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 新增療程標準耗材配方 (BOM) ==================== */}
      {showAddBomModal && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <div>
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                  TREATMENT BOM RECIPE
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                  新增 / 調整療程標準耗材配方
                </h3>
              </div>
              <button onClick={() => setShowAddBomModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1">目標療程項目</label>
                <select
                  value={bomTreatmentId}
                  onChange={(e) => setBomTreatmentId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.items
                    .filter((i) => i.type === "TREATMENT")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-serif block mb-1">
                  自動扣減之耗材品項
                </label>
                <select
                  value={bomConsumableId}
                  onChange={(e) => setBomConsumableId(e.target.value)}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                >
                  {db.items
                    .filter((i) => i.type === "CONSUMABLE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}（NT${c.price.toLocaleString()} / {c.unit}）
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-serif block mb-1">
                  每次堂數核銷扣減數量
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={bomDeductQty}
                  onChange={(e) => setBomDeductQty(Number(e.target.value))}
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
                {(() => {
                  const selectedConsumable = db.items.find(
                    (i) => i.id === bomConsumableId
                  );
                  const unitPrice = selectedConsumable?.price || 0;
                  const estimatedCost = Math.round(unitPrice * bomDeductQty);
                  return (
                    <div className="mt-2 p-2.5 bg-ivory border border-[#E6E0D6] flex items-center justify-between text-[11px]">
                      <span className="font-serif text-graphite/70">
                        本項預估耗材費用小計
                      </span>
                      <span className="font-display font-semibold text-sm text-roseGold-dark">
                        NT${estimatedCost.toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-graphite/50 mt-1.5">
                  若該療程已設定相同耗材，送出後將自動更新為此扣減數量。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddTreatmentBom}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
            >
              確認儲存配方
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 新增操作老師 / 診所人員 ==================== */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-graphite/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <div>
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                  STAFF REGISTRATION
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                  新增操作老師 / 診所專業人員
                </h3>
              </div>
              <button onClick={() => setShowCreateStaffModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1.5">人員角色</label>
                <div className="grid grid-cols-3 border border-[#D8D0C5] bg-ivory p-0.5 font-serif">
                  {[
                    {
                      id: "BEAUTICIAN",
                      label: "操作老師",
                      defaultTitle: "皮膚管理師",
                    },
                    {
                      id: "DOCTOR",
                      label: "主治醫師",
                      defaultTitle: "醫美主治醫師",
                    },
                    {
                      id: "CONSULTANT",
                      label: "諮詢顧問",
                      defaultTitle: "醫美諮詢師",
                    },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setNewStaffRole(
                          r.id as "BEAUTICIAN" | "DOCTOR" | "CONSULTANT"
                        );
                        setNewStaffTitle(r.defaultTitle);
                      }}
                      className={`py-1.5 transition ${
                        newStaffRole === r.id
                          ? "bg-graphite text-ivory"
                          : "text-graphite/65 hover:text-graphite"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-serif block mb-1">
                  姓名／稱謂 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="例如：Chloe 老師、陳醫師"
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
              </div>

              <div>
                <label className="font-serif block mb-1">專業職稱</label>
                <input
                  type="text"
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                  placeholder="例如：資深皮膚管理師、雷射微整主治醫師"
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
              </div>

              <div>
                <label className="font-serif block mb-1">聯絡電話</label>
                <input
                  type="text"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="例如：0911-888-999"
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateStaff}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
            >
              確認新增人員
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 新增獨立診療包廂 ==================== */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-graphite/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2.5">
              <div>
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase block">
                  ROOM REGISTRATION
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                  新增獨立診療包廂
                </h3>
              </div>
              <button onClick={() => setShowCreateRoomModal(false)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-serif block mb-1">
                  包廂名稱 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={newRoomNameInput}
                  onChange={(e) => setNewRoomNameInput(e.target.value)}
                  placeholder="例如：包廂 4 (VIP 抗老修復室)"
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2"
                />
              </div>

              <div>
                <label className="font-serif block mb-1">
                  包廂編號（選填，留空將自動產生）
                </label>
                <input
                  type="text"
                  value={newRoomCodeInput}
                  onChange={(e) => setNewRoomCodeInput(e.target.value)}
                  placeholder="例如：RM-VIP04"
                  className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
            >
              確認新增包廂
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: 新增會員病歷檔案 ==================== */}
      {showCreateMemberModal && (
        <div className="fixed inset-0 bg-graphite/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C5] max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-3">
              <div>
                <span className="text-[10px] font-display tracking-[0.24em] text-roseGold-dark uppercase block">
                  NEW MEMBER REGISTRATION
                </span>
                <h3 className="text-base font-serif font-medium text-graphite mt-0.5">
                  新增會員病歷檔案
                </h3>
              </div>
              <button
                onClick={() => setShowCreateMemberModal(false)}
                className="text-graphite/50 hover:text-graphite p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 基本身份資料 */}
              <div className="space-y-2">
                <div className="text-[10px] font-display tracking-[0.18em] text-roseGold-dark uppercase border-b border-[#F1ECE4] pb-1">
                  01 / BASIC INFORMATION｜基本資料
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      會員姓名 <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：陳舒涵"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 text-xs font-serif focus:outline-none focus:border-roseGold"
                    />
                  </div>

                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      聯絡電話 <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：0988-123-456"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 text-xs font-mono focus:outline-none focus:border-roseGold"
                    />
                  </div>

                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      性別
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["女性", "男性", "其他"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setNewMemberGender(g)}
                          className={`py-1.5 border font-serif text-xs transition ${
                            newMemberGender === g
                              ? "border-graphite bg-graphite text-ivory"
                              : "border-[#D8D0C5] bg-ivory/60 text-graphite hover:border-roseGold"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-serif block mb-1 text-graphite">
                        年齡
                      </label>
                      <input
                        type="number"
                        value={newMemberAge}
                        onChange={(e) => setNewMemberAge(Number(e.target.value))}
                        className="w-full border border-[#D8D0C5] bg-ivory px-3 py-1.5 font-display"
                      />
                    </div>
                    <div>
                      <label className="font-serif block mb-1 text-graphite">
                        出生日期
                      </label>
                      <input
                        type="date"
                        value={newMemberBirthday}
                        onChange={(e) => setNewMemberBirthday(e.target.value)}
                        className="w-full border border-[#D8D0C5] bg-ivory px-2.5 py-1.5 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 專屬操作師與初始儲值金 */}
              <div className="space-y-2 pt-1 border-t border-[#F1ECE4]">
                <div className="text-[10px] font-display tracking-[0.18em] text-roseGold-dark uppercase border-b border-[#F1ECE4] pb-1">
                  02 / PREFERENCES & WALLET｜指名與儲值
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      專屬指名操作師／醫師
                    </label>
                    <select
                      value={newMemberStaffId}
                      onChange={(e) => setNewMemberStaffId(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 font-serif text-xs"
                    >
                      {db.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}（{s.title}）
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      開戶預存儲值金（NT$）
                    </label>
                    <input
                      type="number"
                      step={500}
                      value={newMemberWallet}
                      onChange={(e) =>
                        setNewMemberWallet(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-2 font-display text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 膚質特徵標籤 */}
              <div className="space-y-2 pt-1 border-t border-[#F1ECE4]">
                <div className="text-[10px] font-display tracking-[0.18em] text-roseGold-dark uppercase border-b border-[#F1ECE4] pb-1">
                  03 / CLINICAL TAGS｜膚質標籤
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {availableQuickTags.map((tag) => {
                      const isSelected = newMemberTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-2.5 py-1 text-[11px] font-serif border transition ${
                            isSelected
                              ? "border-roseGold bg-roseGold/20 text-graphite font-semibold"
                              : "border-[#D8D0C5] bg-ivory/60 text-graphite/70 hover:border-roseGold/50"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="自訂標籤（例如：怕針劑微痛、建議敷麻40分）..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      className="flex-1 border border-[#D8D0C5] bg-ivory px-3 py-1.5 text-xs font-serif"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3 py-1.5 border border-[#D8D0C5] bg-white text-xs font-serif text-graphite hover:border-roseGold"
                    >
                      新增標籤
                    </button>
                  </div>
                </div>
              </div>

              {/* 病歷筆記與特殊備註 */}
              <div className="space-y-2 pt-1 border-t border-[#F1ECE4]">
                <div className="text-[10px] font-display tracking-[0.18em] text-roseGold-dark uppercase border-b border-[#F1ECE4] pb-1">
                  04 / MEDICAL NOTES｜病歷備註與過敏史
                </div>
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      藥物或成分過敏史
                    </label>
                    <input
                      type="text"
                      value={newMemberAllergies}
                      onChange={(e) => setNewMemberAllergies(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-1.5 font-serif text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      過去光療／雷射／酸類煥膚施作經驗
                    </label>
                    <input
                      type="text"
                      value={newMemberLaserExp}
                      onChange={(e) => setNewMemberLaserExp(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory px-3 py-1.5 font-serif text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-serif block mb-1 text-graphite">
                      醫囑與特記事項備註
                    </label>
                    <textarea
                      rows={2}
                      value={newMemberSpecialNotes}
                      onChange={(e) => setNewMemberSpecialNotes(e.target.value)}
                      className="w-full border border-[#D8D0C5] bg-ivory p-2.5 font-serif text-xs focus:outline-none focus:border-roseGold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#EAE4DA]">
              <button
                type="button"
                onClick={() => setShowCreateMemberModal(false)}
                className="flex-1 py-2.5 border border-[#D8D0C5] text-xs font-serif text-graphite hover:bg-ivory"
              >
                取消
              </button>
              <button
                type="button"
                disabled={creatingMember}
                onClick={handleCreateMemberSubmit}
                className="flex-1 py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition disabled:opacity-50"
              >
                {creatingMember ? "建立病歷中..." : "確認建立會員病歷"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
