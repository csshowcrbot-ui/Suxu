import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/v1/admin/orders/checkout
 * 現場建立訂單與核銷結帳 (支援複合付款、儲值金扣抵、自動建立療程堂數包、業績抽成拆分、發送 LINE 電子收據)
 */
export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const {
    member_id,
    items = [],
    discount = 0,
    payments = [],
    sales_split = [],
  } = body;

  const member = db.members.find((m) => m.id === member_id);
  if (!member) {
    return NextResponse.json(
      { success: false, message: "找不到指定的會員資料" },
      { status: 404 }
    );
  }

  // 計算小計與應付總額
  const enrichedItems = items.map(
    (it: { item_id: string; quantity: number; custom_price: number }) => {
      const catalogItem = db.items.find((c) => c.id === it.item_id);
      return {
        item_id: it.item_id,
        name: catalogItem ? catalogItem.name : "客製療程項目",
        quantity: Number(it.quantity) || 1,
        custom_price: Number(it.custom_price) || 0,
        catalogItem,
      };
    }
  );

  const subtotal = enrichedItems.reduce(
    (acc: number, cur: { custom_price: number }) => acc + cur.custom_price,
    0
  );
  const total_amount = Math.max(0, subtotal - Number(discount || 0));

  // 檢查儲值金餘額是否足夠
  const walletPayment = payments
    .filter((p: { method: string; amount: number }) => p.method === "WALLET")
    .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);

  if (walletPayment > member.wallet_balance) {
    return NextResponse.json(
      {
        success: false,
        message: `儲值金餘額不足（目前餘額 NT$${member.wallet_balance.toLocaleString()}，欲扣款 NT$${walletPayment.toLocaleString()}）`,
      },
      { status: 400 }
    );
  }

  // 扣除儲值金、累加總消費額
  member.wallet_balance -= walletPayment;
  member.total_spent += total_amount;

  // 若購買項目包含療程方案 (TREATMENT)，自動入帳至顧客療程券夾 (member_packages)
  const createdPackages = [];
  for (const line of enrichedItems) {
    if (line.catalogItem && line.catalogItem.type === "TREATMENT") {
      const sessions = (line.catalogItem.package_sessions || 1) * line.quantity;
      const pkgNo = `PKG-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPkg = {
        id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        package_no: pkgNo,
        member_id: member.id,
        treatment_id: line.catalogItem.id,
        treatment_name: line.catalogItem.name.replace(/\s*\(\d+堂\)/, ""),
        total_quota: sessions,
        remaining_quota: sessions,
        last_consumed_at: "尚未使用",
        last_operator_name: "-",
        expire_at: "2027/03/12",
      };
      db.member_packages.unshift(newPkg);
      createdPackages.push(newPkg);
    }
  }

  // 計算業績歸屬拆分
  const enrichedSplit = sales_split.map(
    (sp: { staff_id: string; percentage: number }) => {
      const st = db.staff.find((s) => s.id === sp.staff_id);
      const pct = Number(sp.percentage) || 0;
      return {
        staff_id: sp.staff_id,
        staff_name: st ? st.name : "未指定人員",
        percentage: pct,
        commission_amount: Math.round((total_amount * pct) / 100),
      };
    }
  );

  const order_no = `ORD-${db.referenceDate.replace(/-/g, "")}-${String(
    db.orders.length + 82
  ).padStart(4, "0")}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    order_no,
    member_id: member.id,
    member_name: member.full_name,
    subtotal,
    discount: Number(discount || 0),
    total_amount,
    items: enrichedItems.map(
      ({
        item_id,
        name,
        quantity,
        custom_price,
      }: {
        item_id: string;
        name: string;
        quantity: number;
        custom_price: number;
      }) => ({
        item_id,
        name,
        quantity,
        custom_price,
      })
    ),
    payments,
    sales_split: enrichedSplit,
    created_at: `${db.referenceDate} ${new Date().toTimeString().slice(0, 5)}`,
  };

  db.orders.unshift(newOrder);

  // 推播 LINE 電子收據
  db.line_jobs.unshift({
    id: `job-receipt-${Date.now()}`,
    job_id: `receipt-${order_no}`,
    type: "SEND_POS_RECEIPT",
    label: "POS 結帳電子收據推播 (LINE Flex Receipt)",
    member_id: member.id,
    member_name: member.full_name,
    scheduled_for: "立即發送 (Immediate)",
    status: "SENT",
    message_preview: `【沐光美學電子收據】${member.full_name}您好，感謝您的消費！訂單編號 ${order_no}，實付金額 NT$${total_amount.toLocaleString()}（儲值金餘額 NT$${member.wallet_balance.toLocaleString()}）。療程堂數已同步存入您的 LINE 票券夾。`,
  });

  return NextResponse.json(
    {
      success: true,
      order: newOrder,
      created_packages: createdPackages,
      updated_wallet_balance: member.wallet_balance,
    },
    { status: 201 }
  );
}

