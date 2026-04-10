
const STORAGE_KEY = "skillbridge_data_v3";
const ACTIVE_TAB_KEY = "skillnest_active_tab";
const ACTIVE_TAB_NAME_PREFIX = "skillnest_active_tab=";
const SELLER_CREATE_MODE_KEY = "skillnest_seller_create_mode";
const SELLER_WIZARD_STEP_KEY = "skillnest_seller_wizard_step";
const SELLER_DRAFT_KEY = "skillnest_seller_draft_v1";
const LEGACY_KEYS = ["skillbridge_data_v2", "skillbridge_data_v1"];
const COMMISSION_RATE = 0.15;

const PACKAGE_MULTIPLIER = {
  basic: 1,
  standard: 1.5,
  premium: 2.2
};

const PACKAGE_DELIVERY_BONUS = {
  basic: 0,
  standard: 1,
  premium: 2
};

const PLAN_CONFIG = {
  premium: {
    label: "Premium Plan",
    price: 100,
    description: "Better visibility and faster support."
  },
  pro: {
    label: "Pro Plan",
    price: 500,
    description: "Advanced tools and maximum growth features."
  }
};
const PLAN_RANK = {
  free: 0,
  premium: 1,
  pro: 2
};

const DEMO_USER_EMAILS = new Set(["owner@skillbridge.com", "ayesha@mail.com", "usman@mail.com"]);
const DEMO_SERVICE_IDS = new Set(["s_1", "s_2", "s_3"]);

const seedData = {
  users: [],
  services: [],
  orders: [],
  reviews: [],
  messages: [],
  withdrawals: [],
  ownerWithdrawals: [],
  ownerSubscriptionRevenue: 0,
  planPayments: [],
  currentUserId: null
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedData));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function money(v) {
  return `$${Number(v).toFixed(2)}`;
}

function toTitleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function notify(message) {
  const text = String(message || "").trim();
  if (!text) return;
  let wrap = document.getElementById("appNoticeWrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "appNoticeWrap";
    wrap.style.position = "fixed";
    wrap.style.right = "14px";
    wrap.style.bottom = "14px";
    wrap.style.zIndex = "9999";
    wrap.style.display = "grid";
    wrap.style.gap = "8px";
    document.body.appendChild(wrap);
  }

  const item = document.createElement("div");
  item.textContent = text;
  item.style.maxWidth = "360px";
  item.style.padding = "10px 12px";
  item.style.borderRadius = "10px";
  item.style.border = "1px solid #dbe3ef";
  item.style.background = "#0f172a";
  item.style.color = "#e2e8f0";
  item.style.font = '600 13px "Plus Jakarta Sans", sans-serif';
  item.style.boxShadow = "0 8px 20px rgba(15,23,42,0.25)";
  wrap.appendChild(item);

  setTimeout(() => {
    item.remove();
    if (wrap && !wrap.children.length) wrap.remove();
  }, 2600);
}

if (typeof window !== "undefined") {
  window.alert = (msg) => notify(msg);
}

function nextDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString();
}

function orderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const stamp = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SBM-${y}-${stamp}`;
}

function threadIdForOrder(orderId) {
  return `thread_${orderId}`;
}

function normalizeService(s) {
  const basePrice = Number(s.basePrice || s.price || 20);
  const parsedRating = Number(s.rating);
  return {
    ...s,
    basePrice,
    deliveryDays: Number(s.deliveryDays || 3),
    rating: Number.isFinite(parsedRating) && parsedRating >= 0 ? parsedRating : 0,
    ordersCompleted: Number(s.ordersCompleted || 0),
    isPublic: s.isPublic !== false,
    tags: Array.isArray(s.tags)
      ? s.tags
      : String(s.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    galleryImages: Array.isArray(s.galleryImages) ? s.galleryImages.filter(Boolean) : [],
    portfolioDocName: s.portfolioDocName || ""
  };
}

function normalizeOrder(o) {
  const packageTier = o.packageTier || "basic";
  return {
    ...o,
    number: o.number || orderNumber(),
    packageTier,
    packageName: o.packageName || toTitleCase(packageTier),
    paymentMethod: o.paymentMethod || "Card",
    paymentStatus: o.paymentStatus || "Paid",
    requirements: o.requirements || "No requirements provided.",
    dueDate: o.dueDate || nextDate(3),
    date: o.date || new Date().toISOString(),
    isPriority: !!o.isPriority,
    fee: Number(o.fee || 0),
    sellerEarning: Number(o.sellerEarning || 0),
    total: Number(o.total || o.price || 0)
  };
}

function normalizeSubscriptionTier(tier) {
  if (tier === "pro") return "pro";
  if (tier === "premium") return "premium";
  return "free";
}

function planRank(tier) {
  return PLAN_RANK[normalizeSubscriptionTier(tier)] ?? 0;
}

function hasPlanAccess(user, minimumTier) {
  if (!user) return false;
  return planRank(user.subscriptionTier) >= planRank(minimumTier);
}

function showPremiumRequiredNotice() {
  notify("Premium subscription required.");
  setActiveTab("marketplace");
  renderAll();
  setTimeout(() => {
    plansBox?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

function planPaymentFieldsTemplate(method) {
  if (method === "Card") {
    return `
      <div class="payment-grid">
        <label class="payment-col-full">Cardholder Name
          <input id="pp_cardName" type="text" placeholder="Name on card" />
        </label>
        <label>Issuing Bank
          <select id="pp_cardBank">
            <option value="">Select bank</option>
            <option>HBL</option>
            <option>UBL</option>
            <option>MCB</option>
            <option>Allied Bank</option>
            <option>Bank Alfalah</option>
            <option>Standard Chartered</option>
            <option>Meezan Bank</option>
            <option>Faysal Bank</option>
            <option>Askari Bank</option>
            <option>Other Bank</option>
          </select>
        </label>
        <label>Billing Country
          <input id="pp_cardCountry" type="text" placeholder="Country" />
        </label>
        <label>Card Number
          <input id="pp_cardNumber" type="text" placeholder="4242 4242 4242 4242" />
        </label>
        <label>Expiry
          <input id="pp_cardExpiry" type="text" placeholder="MM/YY" />
        </label>
        <label>CVV
          <input id="pp_cardCvv" type="password" placeholder="123" />
        </label>
        <label>Billing ZIP
          <input id="pp_cardZip" type="text" placeholder="Postal code" />
        </label>
      </div>
    `;
  }
  if (method === "PayPal") {
    return `
      <div class="payment-grid">
        <label class="payment-col-full">PayPal Email
          <input id="pp_paypalEmail" type="email" placeholder="you@example.com" />
        </label>
        <label>Account Holder Name
          <input id="pp_paypalName" type="text" placeholder="Your full name" />
        </label>
        <label>Billing Country
          <input id="pp_paypalCountry" type="text" placeholder="Country" />
        </label>
      </div>
    `;
  }
  if (method === "Bank Transfer") {
    return `
      <div class="payment-grid">
        <label>Bank Name
          <select id="pp_bankName">
            <option value="">Select bank</option>
            <option>HBL</option>
            <option>UBL</option>
            <option>MCB</option>
            <option>Allied Bank</option>
            <option>Bank Alfalah</option>
            <option>Standard Chartered</option>
            <option>Meezan Bank</option>
            <option>Faysal Bank</option>
            <option>Askari Bank</option>
            <option>Other Bank</option>
          </select>
        </label>
        <label>Account Holder
          <input id="pp_accountHolder" type="text" placeholder="Full legal name" />
        </label>
        <label>Account Type
          <select id="pp_accountType">
            <option value="">Select type</option>
            <option>Savings</option>
            <option>Current</option>
            <option>Business</option>
          </select>
        </label>
        <label>Account Number
          <input id="pp_accountNumber" type="text" placeholder="Account number" />
        </label>
        <label>IBAN
          <input id="pp_iban" type="text" placeholder="PKXX XXXX XXXX XXXX XXXX XXXX" />
        </label>
        <label>SWIFT / Routing
          <input id="pp_swift" type="text" placeholder="SWIFT or routing code" />
        </label>
        <label>Branch Code
          <input id="pp_branchCode" type="text" placeholder="Branch code" />
        </label>
        <label>Account Holder CNIC / ID
          <input id="pp_holderId" type="text" placeholder="CNIC or national ID" />
        </label>
      </div>
    `;
  }
  if (method === "Easypaisa" || method === "JazzCash") {
    return `
      <div class="payment-grid">
        <label>Mobile Number
          <input id="pp_mobile" type="text" placeholder="+92xxxxxxxxxx" />
        </label>
        <label>Account Name
          <input id="pp_mobileName" type="text" placeholder="Registered account name" />
        </label>
        <label>CNIC Number
          <input id="pp_mobileCnic" type="text" placeholder="xxxxx-xxxxxxx-x" />
        </label>
        <label>Transaction PIN / OTP
          <input id="pp_mobilePin" type="password" placeholder="Enter secure PIN/OTP" />
        </label>
      </div>
    `;
  }
  return `<div class="meta">Please select a payment method first.</div>`;
}

function getFieldVal(id) {
  const el = document.getElementById(id);
  return String(el?.value || "").trim();
}

function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function fromCents(cents) {
  return +(Number(cents || 0) / 100).toFixed(2);
}

function validatePlanPaymentFields(method) {
  if (method === "Card") {
    const cardName = getFieldVal("pp_cardName");
    const cardBank = getFieldVal("pp_cardBank");
    const cardCountry = getFieldVal("pp_cardCountry");
    const cardNumber = getFieldVal("pp_cardNumber").replace(/\s+/g, "");
    const cardExpiry = getFieldVal("pp_cardExpiry");
    const cardCvv = getFieldVal("pp_cardCvv");
    const cardZip = getFieldVal("pp_cardZip");
    if (!cardName || cardName.length < 3) return "Please enter a valid cardholder name.";
    if (!cardBank) return "Please select issuing bank.";
    if (!cardCountry) return "Please enter billing country.";
    if (!/^\d{13,19}$/.test(cardNumber)) return "Please enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return "Please enter card expiry in MM/YY.";
    if (!/^\d{3,4}$/.test(cardCvv)) return "Please enter a valid CVV.";
    if (!cardZip) return "Please enter billing ZIP/postal code.";
    return "";
  }
  if (method === "PayPal") {
    const email = getFieldVal("pp_paypalEmail");
    const name = getFieldVal("pp_paypalName");
    const country = getFieldVal("pp_paypalCountry");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid PayPal email.";
    if (!name || name.length < 3) return "Please enter account holder name.";
    if (!country) return "Please enter billing country.";
    return "";
  }
  if (method === "Bank Transfer") {
    const bankName = getFieldVal("pp_bankName");
    const accountHolder = getFieldVal("pp_accountHolder");
    const accountType = getFieldVal("pp_accountType");
    const accountNumber = getFieldVal("pp_accountNumber");
    const iban = getFieldVal("pp_iban");
    const swift = getFieldVal("pp_swift");
    const branchCode = getFieldVal("pp_branchCode");
    const holderId = getFieldVal("pp_holderId");
    if (!bankName) return "Please enter bank name.";
    if (!accountHolder) return "Please enter account holder name.";
    if (!accountType) return "Please select account type.";
    if (!accountNumber) return "Please enter account number.";
    if (!iban) return "Please enter IBAN.";
    if (!swift) return "Please enter SWIFT or routing code.";
    if (!branchCode) return "Please enter branch code.";
    if (!holderId) return "Please enter CNIC / national ID.";
    return "";
  }
  if (method === "Easypaisa" || method === "JazzCash") {
    const mobile = getFieldVal("pp_mobile");
    const accountName = getFieldVal("pp_mobileName");
    const cnic = getFieldVal("pp_mobileCnic");
    const pin = getFieldVal("pp_mobilePin");
    if (!mobile || mobile.length < 8) return "Please enter a valid mobile account number.";
    if (!accountName) return "Please enter account name.";
    if (!cnic) return "Please enter CNIC number.";
    if (!pin || pin.length < 4) return "Please enter transaction PIN/OTP.";
    return "";
  }
  return "Please select a payment method.";
}

function openPlanPaymentPage(planKey, method) {
  const data = getData();
  const me = getCurrentUser(data);
  if (!me || !PLAN_CONFIG[planKey]) return;

  pendingPlanCheckout = { planKey, method };
  const amount = Number(PLAN_CONFIG[planKey].price || 0);
  const balance = Number(me.walletBalance || 0);

  if (planPaymentSummary) {
    planPaymentSummary.innerHTML = `
      <strong>${PLAN_CONFIG[planKey].label}</strong>
      <div class="meta">Billing: $${amount.toFixed(2)} / month</div>
      <div class="meta">Payment Method: ${method}</div>
      <div class="meta">Current Balance: ${money(balance)}</div>
      <div class="meta">Balance After Payment: ${money(Math.max(0, balance - amount))}</div>
    `;
  }
  if (planPaymentFields) {
    planPaymentFields.innerHTML = planPaymentFieldsTemplate(method);
  }
  if (planPaymentMessage) {
    planPaymentMessage.className = "meta";
    planPaymentMessage.textContent = "";
  }
  if (planPaymentPage) {
    planPaymentPage.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function closePlanPaymentPage() {
  pendingPlanCheckout = null;
  if (planPaymentPage) planPaymentPage.classList.add("hidden");
}

function normalizeWithdrawal(w) {
  return {
    ...w,
    amount: Number(w.amount || 0),
    status: w.status || "Pending",
    date: w.date || new Date().toISOString(),
    processedDate: w.processedDate || null
  };
}

function normalizeOwnerWithdrawal(w) {
  return {
    ...w,
    amount: Number(w.amount || 0),
    status: w.status || "Approved",
    date: w.date || new Date().toISOString()
  };
}

function normalizePlanPayment(p) {
  return {
    ...p,
    amount: Number(p.amount || 0),
    date: p.date || new Date().toISOString()
  };
}

function recalculateServiceRatings(data) {
  const byService = new Map();
  data.reviews.forEach((r) => {
    if (!byService.has(r.serviceId)) byService.set(r.serviceId, []);
    byService.get(r.serviceId).push(Number(r.rating));
  });

  data.services = data.services.map((s) => {
    const arr = byService.get(s.id) || [];
    if (!arr.length) {
      return { ...s, rating: 0 };
    }
    const avg = arr.reduce((sum, r) => sum + r, 0) / arr.length;
    return { ...s, rating: +avg.toFixed(1) };
  });
}

function normalizeData(data) {
  data.users = Array.isArray(data.users)
    ? data.users.map((u) => {
        const normalizedTier = normalizeSubscriptionTier(u.subscriptionTier);
        const subscriptionActive = u.subscriptionActive === true && normalizedTier !== "free";
        return {
          ...u,
          walletBalance: Number.isFinite(Number(u.walletBalance)) ? Number(u.walletBalance) : 1000,
          subscriptionActive,
          subscriptionTier: subscriptionActive ? normalizedTier : "free"
        };
      })
    : [];
  data.services = Array.isArray(data.services) ? data.services.map(normalizeService) : [];
  data.orders = Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [];
  data.reviews = Array.isArray(data.reviews) ? data.reviews : [];
  data.messages = Array.isArray(data.messages) ? data.messages : [];
  data.withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals.map(normalizeWithdrawal) : [];
  data.ownerWithdrawals = Array.isArray(data.ownerWithdrawals)
    ? data.ownerWithdrawals.map(normalizeOwnerWithdrawal)
    : [];
  data.ownerSubscriptionRevenue = Number(data.ownerSubscriptionRevenue || 0);
  data.planPayments = Array.isArray(data.planPayments) ? data.planPayments.map(normalizePlanPayment) : [];

  // Remove legacy demo/sample marketplace data so Explore only shows real seller posts.
  const removedUserIds = new Set(
    data.users.filter((u) => DEMO_USER_EMAILS.has(String(u.email || "").toLowerCase())).map((u) => u.id)
  );
  data.users = data.users.filter((u) => !removedUserIds.has(u.id));

  const removedServiceIds = new Set(
    data.services
      .filter((s) => DEMO_SERVICE_IDS.has(String(s.id)) || removedUserIds.has(s.sellerId))
      .map((s) => s.id)
  );
  data.services = data.services.filter((s) => !removedServiceIds.has(s.id));
  data.orders = data.orders.filter(
    (o) =>
      !removedServiceIds.has(o.serviceId) &&
      !removedUserIds.has(o.buyerId) &&
      !removedUserIds.has(o.sellerId)
  );
  data.reviews = data.reviews.filter(
    (r) =>
      !removedServiceIds.has(r.serviceId) &&
      !removedUserIds.has(r.buyerId) &&
      !removedUserIds.has(r.sellerId)
  );
  data.messages = data.messages.filter((m) => !removedUserIds.has(m.fromId) && !removedUserIds.has(m.toId));
  data.withdrawals = data.withdrawals.filter((w) => !removedUserIds.has(w.sellerId));

  if (data.currentUserId && removedUserIds.has(data.currentUserId)) {
    data.currentUserId = null;
  }

  if (!data.currentUserId && data.users[0]) {
    data.currentUserId = data.users[0].id;
  }

  recalculateServiceRatings(data);
  return data;
}

function migrateLegacy() {
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const migrated = {
        users: parsed.users || [],
        services: parsed.services || [],
        orders: parsed.orders || [],
        reviews: parsed.reviews || [],
        messages: parsed.messages || [],
        withdrawals: parsed.withdrawals || [],
        ownerWithdrawals: parsed.ownerWithdrawals || [],
        currentUserId: parsed.currentUserId
      };
      return normalizeData(migrated);
    } catch {
      continue;
    }
  }
  return null;
}

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return normalizeData(JSON.parse(raw));

  const migrated = migrateLegacy();
  if (migrated) {
    saveData(migrated);
    return migrated;
  }

  const seeded = cloneSeed();
  saveData(seeded);
  return seeded;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentUser(data) {
  return data.users.find((u) => u.id === data.currentUserId) || null;
}

function saveActiveTabPreference(tabId) {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tabId);
  } catch {}
  try {
    sessionStorage.setItem(ACTIVE_TAB_KEY, tabId);
  } catch {}
  try {
    const parts = String(window.name || "")
      .split(";")
      .filter(Boolean)
      .filter((p) => !p.startsWith(ACTIVE_TAB_NAME_PREFIX));
    parts.push(`${ACTIVE_TAB_NAME_PREFIX}${tabId}`);
    window.name = parts.join(";");
  } catch {}
}

function saveSellerFlowState() {
  const mode = sellerCreateMode ? "1" : "0";
  const step = ["overview", "pricing", "description", "requirements", "gallery", "publish"].includes(sellerWizardStep) ? sellerWizardStep : "overview";
  try {
    localStorage.setItem(SELLER_CREATE_MODE_KEY, mode);
    localStorage.setItem(SELLER_WIZARD_STEP_KEY, step);
  } catch {}
  try {
    sessionStorage.setItem(SELLER_CREATE_MODE_KEY, mode);
    sessionStorage.setItem(SELLER_WIZARD_STEP_KEY, step);
  } catch {}
}

function loadSellerFlowState() {
  let mode = false;
  let step = "overview";
  try {
    const sm = sessionStorage.getItem(SELLER_CREATE_MODE_KEY);
    const ss = sessionStorage.getItem(SELLER_WIZARD_STEP_KEY);
    if (sm !== null) mode = sm === "1";
    if (["overview", "pricing", "description", "requirements", "gallery", "publish"].includes(ss)) step = ss;
  } catch {}
  try {
    if (!mode) {
      const lm = localStorage.getItem(SELLER_CREATE_MODE_KEY);
      if (lm !== null) mode = lm === "1";
    }
    const ls = localStorage.getItem(SELLER_WIZARD_STEP_KEY);
    if (["overview", "pricing", "description", "requirements", "gallery", "publish"].includes(ls)) step = ls;
  } catch {}
  return { mode, step };
}

function readInputValue(el) {
  return el && typeof el.value === "string" ? el.value : "";
}

function captureSellerDraftState() {
  return {
    sellerCreateMode: !!sellerCreateMode,
    sellerWizardStep,
    stepAttempted: { ...stepAttempted },
    overview: {
      title: readInputValue(ovTitle),
      categorySearch: readInputValue(ovCategorySearch),
      category: readInputValue(ovCategory),
      subcategory: readInputValue(ovSubcategory),
      pendingTag: readInputValue(ovTags),
      tags: Array.isArray(overviewTagsState) ? overviewTagsState.slice() : [],
      requirements: readInputValue(ovRequirements)
    },
    pricing: {
      basicName: readInputValue(pkgBasicName),
      standardName: readInputValue(pkgStandardName),
      premiumName: readInputValue(pkgPremiumName),
      basicDesc: readInputValue(pkgBasicDesc),
      standardDesc: readInputValue(pkgStandardDesc),
      premiumDesc: readInputValue(pkgPremiumDesc),
      basicPrice: readInputValue(pkgBasicPrice),
      standardPrice: readInputValue(pkgStandardPrice),
      premiumPrice: readInputValue(pkgPremiumPrice),
      basicDays: readInputValue(pkgBasicDays),
      standardDays: readInputValue(pkgStandardDays),
      premiumDays: readInputValue(pkgPremiumDays)
    },
    description: {
      main: readInputValue(descMain),
      faqs: Array.isArray(faqItemsState)
        ? faqItemsState.map((f) => ({ q: String(f?.q || ""), a: String(f?.a || "") }))
        : []
    },
    requirements: {
      checklist: readInputValue(reqChecklist)
    },
    gallery: {
      image1Name: String(sellerGalleryState?.image1Name || ""),
      image1DataUrl: String(sellerGalleryState?.image1DataUrl || ""),
      image2Name: String(sellerGalleryState?.image2Name || ""),
      image2DataUrl: String(sellerGalleryState?.image2DataUrl || ""),
      docName: String(sellerGalleryState?.docName || ""),
      docDataUrl: String(sellerGalleryState?.docDataUrl || "")
    }
  };
}

function saveSellerDraftState() {
  try {
    const payload = JSON.stringify(captureSellerDraftState());
    localStorage.setItem(SELLER_DRAFT_KEY, payload);
    try {
      sessionStorage.setItem(SELLER_DRAFT_KEY, payload);
    } catch {}
  } catch {}
}

function loadSellerDraftState() {
  const parseDraft = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  try {
    const fromSession = parseDraft(sessionStorage.getItem(SELLER_DRAFT_KEY));
    if (fromSession) return fromSession;
  } catch {}
  try {
    return parseDraft(localStorage.getItem(SELLER_DRAFT_KEY));
  } catch {
    return null;
  }
}

function clearSellerDraftState() {
  try {
    localStorage.removeItem(SELLER_DRAFT_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(SELLER_DRAFT_KEY);
  } catch {}
}

function applySellerDraftState(draft) {
  if (!draft || typeof draft !== "object") return;

  const overview = draft.overview || {};
  const pricing = draft.pricing || {};
  const description = draft.description || {};
  const requirements = draft.requirements || {};
  const gallery = draft.gallery || {};

  if (ovTitle) ovTitle.value = String(overview.title || "");
  if (ovCategorySearch) ovCategorySearch.value = String(overview.categorySearch || "");
  renderOverviewCategories("");
  if (ovCategory) ovCategory.value = String(overview.category || "");
  refreshOverviewSubcategories();
  if (ovSubcategory && overview.subcategory) {
    const optionExists = Array.from(ovSubcategory.options || []).some((o) => o.value === overview.subcategory);
    if (optionExists) ovSubcategory.value = String(overview.subcategory);
  }
  if (ovTags) ovTags.value = String(overview.pendingTag || "");
  overviewTagsState = Array.isArray(overview.tags)
    ? overview.tags.map((t) => normalizeOverviewTag(t)).filter(Boolean).slice(0, 5)
    : [];
  if (ovRequirements) ovRequirements.value = String(overview.requirements || "");

  if (pkgBasicName) pkgBasicName.value = String(pricing.basicName || "");
  if (pkgStandardName) pkgStandardName.value = String(pricing.standardName || "");
  if (pkgPremiumName) pkgPremiumName.value = String(pricing.premiumName || "");
  if (pkgBasicDesc) pkgBasicDesc.value = String(pricing.basicDesc || "");
  if (pkgStandardDesc) pkgStandardDesc.value = String(pricing.standardDesc || "");
  if (pkgPremiumDesc) pkgPremiumDesc.value = String(pricing.premiumDesc || "");
  if (pkgBasicPrice) pkgBasicPrice.value = String(pricing.basicPrice || "");
  if (pkgStandardPrice) pkgStandardPrice.value = String(pricing.standardPrice || "");
  if (pkgPremiumPrice) pkgPremiumPrice.value = String(pricing.premiumPrice || "");
  if (pkgBasicDays) pkgBasicDays.value = String(pricing.basicDays || "");
  if (pkgStandardDays) pkgStandardDays.value = String(pricing.standardDays || "");
  if (pkgPremiumDays) pkgPremiumDays.value = String(pricing.premiumDays || "");

  if (descMain) descMain.value = String(description.main || "");
  faqItemsState = Array.isArray(description.faqs)
    ? description.faqs.map((f) => ({ q: String(f?.q || ""), a: String(f?.a || "") }))
    : [];

  if (reqChecklist) reqChecklist.value = String(requirements.checklist || "");

  sellerGalleryState = {
    image1Name: String(gallery.image1Name || ""),
    image1DataUrl: String(gallery.image1DataUrl || ""),
    image2Name: String(gallery.image2Name || ""),
    image2DataUrl: String(gallery.image2DataUrl || ""),
    docName: String(gallery.docName || ""),
    docDataUrl: String(gallery.docDataUrl || "")
  };

  if (draft.stepAttempted && typeof draft.stepAttempted === "object") {
    stepAttempted.overview = !!draft.stepAttempted.overview;
    stepAttempted.pricing = !!draft.stepAttempted.pricing;
    stepAttempted.description = !!draft.stepAttempted.description;
    stepAttempted.requirements = !!draft.stepAttempted.requirements;
    stepAttempted.gallery = !!draft.stepAttempted.gallery;
  }

  if (galleryImage1) galleryImage1.value = "";
  if (galleryImage2) galleryImage2.value = "";
  if (galleryDoc) galleryDoc.value = "";

  renderOverviewTagChips();
  renderFaqList();
  renderGalleryPreview();
}

function getSavedActiveTab(validTabIds) {
  const htmlDefault = document.querySelector(".nav-btn.active")?.dataset.tab || "explore";
  const sellerState = loadSellerFlowState();
  if (sellerState.mode) return "seller";
  try {
    const hashTab = (window.location.hash || "").replace("#", "").trim();
    if (hashTab && validTabIds.has(hashTab)) return hashTab;
  } catch {}
  try {
    const sessionTab = sessionStorage.getItem(ACTIVE_TAB_KEY);
    if (sessionTab && validTabIds.has(sessionTab)) return sessionTab;
  } catch {}
  try {
    const namePart = String(window.name || "")
      .split(";")
      .find((p) => p.startsWith(ACTIVE_TAB_NAME_PREFIX));
    const savedFromName = namePart ? namePart.slice(ACTIVE_TAB_NAME_PREFIX.length) : "";
    if (savedFromName && validTabIds.has(savedFromName)) return savedFromName;
  } catch {}
  try {
    const localTab = localStorage.getItem(ACTIVE_TAB_KEY);
    if (localTab && validTabIds.has(localTab)) return localTab;
  } catch {}
  return validTabIds.has(htmlDefault) ? htmlDefault : "explore";
}

function getUserName(data, userId) {
  return (data.users.find((u) => u.id === userId) || {}).name || "Unknown";
}

function packagePrice(basePrice, tier) {
  return +(Number(basePrice) * (PACKAGE_MULTIPLIER[tier] || 1)).toFixed(2);
}

function packageDelivery(baseDelivery, tier) {
  return Number(baseDelivery) + (PACKAGE_DELIVERY_BONUS[tier] || 0);
}

function coverByCategory(category) {
  const c = category.toLowerCase();
  if (c.includes("logo") || c.includes("design")) return "linear-gradient(120deg, #f97316, #fb7185 50%, #a855f7)";
  if (c.includes("web") || c.includes("dev")) return "linear-gradient(120deg, #0ea5e9, #2563eb 50%, #22d3ee)";
  if (c.includes("seo") || c.includes("marketing")) return "linear-gradient(120deg, #84cc16, #10b981 50%, #22c55e)";
  if (c.includes("video") || c.includes("edit")) return "linear-gradient(120deg, #ec4899, #f43f5e 55%, #f97316)";
  return "linear-gradient(120deg, #16a34a, #14b8a6 50%, #0ea5e9)";
}

function hasReview(data, orderId) {
  return data.reviews.some((r) => r.orderId === orderId);
}

function sellerLifetimeEarnings(data, sellerId) {
  return data.orders.filter((o) => o.sellerId === sellerId && o.status === "Completed").reduce((sum, o) => sum + o.sellerEarning, 0);
}

function sellerWithdrawnOrLocked(data, sellerId) {
  return data.withdrawals
    .filter((w) => w.sellerId === sellerId && (w.status === "Pending" || w.status === "Approved"))
    .reduce((sum, w) => sum + w.amount, 0);
}

function sellerAvailableToWithdraw(data, sellerId) {
  return +(sellerLifetimeEarnings(data, sellerId) - sellerWithdrawnOrLocked(data, sellerId)).toFixed(2);
}

function ownerCommissionTotal(data) {
  return +data.orders.reduce((sum, o) => sum + Number(o.fee || 0), 0).toFixed(2);
}

function ownerSubscriptionTotal(data) {
  return +Number(data.ownerSubscriptionRevenue || 0).toFixed(2);
}

function ownerWithdrawnTotal(data) {
  return +data.ownerWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0).toFixed(2);
}

function ownerAvailableCommission(data) {
  return +(ownerCommissionTotal(data) + ownerSubscriptionTotal(data) - ownerWithdrawnTotal(data)).toFixed(2);
}

const navBtns = document.querySelectorAll(".nav-btn");
const tabs = document.querySelectorAll(".tab");
const authSection = document.getElementById("auth");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const sellerMessage = document.getElementById("sellerMessage");
const serviceForm = document.getElementById("serviceForm");
const serviceList = document.getElementById("serviceList");
const search = document.getElementById("search");
const sortBy = document.getElementById("sortBy");
const heroUserName = document.getElementById("heroUserName");
const heroStats = document.getElementById("heroStats");
const ctaSellBtn = document.getElementById("ctaSellBtn");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loggedInUser = document.getElementById("loggedInUser");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckout = document.getElementById("closeCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutServiceInfo = document.getElementById("checkoutServiceInfo");
const packageTierEl = document.getElementById("packageTier");
const paymentMethodEl = document.getElementById("paymentMethod");
const orderRequirementsEl = document.getElementById("orderRequirements");
const checkoutSummary = document.getElementById("checkoutSummary");

const chatModal = document.getElementById("chatModal");
const closeChat = document.getElementById("closeChat");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatThreadMeta = document.getElementById("chatThreadMeta");
const plansBox = document.querySelector(".plans-box");
const sellerGigRows = document.getElementById("sellerGigRows");
const sellerLiveCount = document.getElementById("sellerLiveCount");
const openCreateGigBtn = document.getElementById("openCreateGigBtn");
const sellerHub = document.querySelector(".seller-hub");
const sellerCreateFlow = document.getElementById("sellerCreateFlow");
const closeCreateFlowBtn = document.getElementById("closeCreateFlowBtn");
const exploreProToolsBtn = document.getElementById("exploreProToolsBtn");
const ovTitle = document.getElementById("ovTitle");
const ovTitleCount = document.getElementById("ovTitleCount");
const ovCategorySearch = document.getElementById("ovCategorySearch");
const ovCategory = document.getElementById("ovCategory");
const ovSubcategory = document.getElementById("ovSubcategory");
const ovTags = document.getElementById("ovTags");
const ovTagChips = document.getElementById("ovTagChips");
const ovRequirements = document.getElementById("ovRequirements");
const ovDetector = document.getElementById("ovDetector");
const ovDetectorList = document.getElementById("ovDetectorList");
const ovProceedBtn = document.getElementById("ovProceedBtn");
const pricingNextBtn = document.getElementById("pricingNextBtn");
const sellerStepOverview = document.getElementById("sellerStepOverview");
const sellerStepPricing = document.getElementById("sellerStepPricing");
const sellerStepDescription = document.getElementById("sellerStepDescription");
const sellerStepRequirements = document.getElementById("sellerStepRequirements");
const sellerStepGallery = document.getElementById("sellerStepGallery");
const sellerStepPublish = document.getElementById("sellerStepPublish");
const overviewStepPanel = document.getElementById("overviewStepPanel");
const pricingStepPanel = document.getElementById("pricingStepPanel");
const descriptionStepPanel = document.getElementById("descriptionStepPanel");
const requirementsStepPanel = document.getElementById("requirementsStepPanel");
const galleryStepPanel = document.getElementById("galleryStepPanel");
const publishStepPanel = document.getElementById("publishStepPanel");
const pricingBackBtn = document.getElementById("pricingBackBtn");
const descriptionBackBtn = document.getElementById("descriptionBackBtn");
const descriptionNextBtn = document.getElementById("descriptionNextBtn");
const requirementsBackBtn = document.getElementById("requirementsBackBtn");
const requirementsNextBtn = document.getElementById("requirementsNextBtn");
const galleryBackBtn = document.getElementById("galleryBackBtn");
const galleryNextBtn = document.getElementById("galleryNextBtn");
const publishBackBtn = document.getElementById("publishBackBtn");
const publishNowBtn = document.getElementById("publishNowBtn");
const sellerStepNavButtons = document.querySelectorAll(".seller-step-nav");
const galleryImage1 = document.getElementById("galleryImage1");
const galleryImage2 = document.getElementById("galleryImage2");
const galleryDoc = document.getElementById("galleryDoc");
const galleryPreview = document.getElementById("galleryPreview");
const reqChecklist = document.getElementById("reqChecklist");
const faqList = document.getElementById("faqList");
const addFaqBtn = document.getElementById("addFaqBtn");
const aiGuardBox = document.getElementById("aiGuardBox");
const aiGuardList = document.getElementById("aiGuardList");
const pkgBasicName = document.getElementById("pkgBasicName");
const pkgStandardName = document.getElementById("pkgStandardName");
const pkgPremiumName = document.getElementById("pkgPremiumName");
const pkgBasicDesc = document.getElementById("pkgBasicDesc");
const pkgStandardDesc = document.getElementById("pkgStandardDesc");
const pkgPremiumDesc = document.getElementById("pkgPremiumDesc");
const pkgBasicPrice = document.getElementById("pkgBasicPrice");
const pkgStandardPrice = document.getElementById("pkgStandardPrice");
const pkgPremiumPrice = document.getElementById("pkgPremiumPrice");
const pkgBasicDays = document.getElementById("pkgBasicDays");
const pkgStandardDays = document.getElementById("pkgStandardDays");
const pkgPremiumDays = document.getElementById("pkgPremiumDays");
const descMain = document.getElementById("descMain");

const withdrawForm = document.getElementById("withdrawForm");
const withdrawMessage = document.getElementById("withdrawMessage");
const ownerWithdrawForm = document.getElementById("ownerWithdrawForm");
const ownerWithdrawMessage = document.getElementById("ownerWithdrawMessage");
const planTabs = document.querySelectorAll(".plan-tab");
const planCards = document.querySelectorAll(".plan-column");
const planTitle = document.getElementById("planTitle");
const planPrice = document.getElementById("planPrice");
const planDescription = document.getElementById("planDescription");
const planPaymentMethod = document.getElementById("planPaymentMethod");
const planPayBtn = document.getElementById("planPayBtn");
const planMessage = document.getElementById("planMessage");
const planPaymentPage = document.getElementById("planPaymentPage");
const planPaymentClose = document.getElementById("planPaymentClose");
const planPaymentCancel = document.getElementById("planPaymentCancel");
const planPaymentConfirm = document.getElementById("planPaymentConfirm");
const planPaymentSummary = document.getElementById("planPaymentSummary");
const planPaymentFields = document.getElementById("planPaymentFields");
const planPaymentMessage = document.getElementById("planPaymentMessage");

let currentCheckoutServiceId = null;
let currentChatOrderId = null;
let currentChatOtherUserId = null;
let openServiceMenuId = null;
let openSellerHubMenuId = null;
let activePlanKey = "premium";
let pendingPlanCheckout = null;
let sellerCreateMode = false;
let sellerWizardStep = "overview";
let lastOverviewErrors = [];
const stepAttempted = {
  overview: false,
  pricing: false,
  description: false,
  requirements: false,
  gallery: false
};
const SELLER_STEP_ORDER = ["overview", "pricing", "description", "requirements", "gallery", "publish"];
let sellerGalleryState = {
  image1Name: "",
  image1DataUrl: "",
  image2Name: "",
  image2DataUrl: "",
  docName: "",
  docDataUrl: ""
};
let faqItemsState = [];
const OVERVIEW_CATEGORY_CATALOG = [
  { key: "web-development", label: "Web Development", subcategories: ["Frontend Development", "Backend Development", "Full-Stack Development", "WordPress Development", "Shopify Development", "Custom CMS Development", "Website Bug Fixing", "Website Optimization", "Landing Page Development", "API Integration", "Web App Development", "Website Security Hardening", "Website Migration", "Headless CMS Setup", "Maintenance & Support"] },
  { key: "mobile-development", label: "Mobile App Development", subcategories: ["iOS Development", "Android Development", "Flutter Development", "React Native Development", "Hybrid App Development", "Mobile UI Integration", "App Performance Optimization", "App Bug Fixing", "App Store Deployment", "Push Notification Setup", "In-App Purchase Integration", "Firebase Integration", "Cross-Platform Migration", "Mobile Backend APIs", "App Maintenance"] },
  { key: "software-development", label: "Software Development", subcategories: ["Desktop Applications", "SaaS Product Development", "Enterprise Software", "Custom Tools Development", "Automation Scripts", "Microservices Architecture", "REST API Development", "GraphQL API Development", "Code Review & Refactor", "Legacy System Modernization", "Testing & QA Automation", "CLI Tool Development", "Integration Development", "Software Documentation", "Maintenance Contracts"] },
  { key: "ai-ml", label: "AI & Machine Learning", subcategories: ["AI Chatbots", "LLM Integrations", "Prompt Engineering", "Custom AI Assistants", "RAG Systems", "Model Fine-Tuning", "Machine Learning Pipelines", "Computer Vision", "NLP Solutions", "Recommendation Systems", "AI Workflow Automation", "AI Data Labeling Setup", "AI Evaluation & Testing", "AI Product Prototyping", "MLOps Setup"] },
  { key: "data-science", label: "Data Science & Analytics", subcategories: ["Data Analysis", "Data Cleaning", "Data Visualization", "Dashboard Development", "Business Intelligence", "Predictive Analytics", "Statistical Modeling", "A/B Test Analysis", "Data Warehousing", "ETL Pipelines", "Reporting Automation", "KPI Framework Setup", "Forecasting Models", "Spreadsheet Analytics", "Research Data Support"] },
  { key: "cybersecurity", label: "Cybersecurity", subcategories: ["Security Audit", "Penetration Testing", "Vulnerability Assessment", "Cloud Security Review", "Web App Security Testing", "Network Security Assessment", "Security Policy Drafting", "Compliance Readiness", "Identity & Access Hardening", "Security Monitoring Setup", "Incident Response Planning", "Risk Assessment Reports", "Email Security Setup", "Endpoint Security Guidance", "Security Awareness Content"] },
  { key: "cloud-devops", label: "Cloud & DevOps", subcategories: ["AWS Services", "Azure Services", "Google Cloud Services", "DevOps Pipeline Setup", "CI/CD Automation", "Docker Containerization", "Kubernetes Deployment", "Infrastructure as Code", "Server Deployment", "Monitoring & Alerting", "Load Balancing", "Cloud Cost Optimization", "Disaster Recovery Setup", "Performance Tuning", "Environment Migration"] },
  { key: "graphic-design", label: "Graphic Design", subcategories: ["Logo Design", "Brand Identity", "Social Media Design", "Print Design", "Packaging Design", "Business Cards", "Poster & Flyer Design", "Brochure Design", "Pitch Deck Design", "Ad Creative Design", "Infographic Design", "Book & Ebook Covers", "Banner Design", "Merch Design", "Visual Style Guide"] },
  { key: "ui-ux", label: "UI/UX Design", subcategories: ["Website UI Design", "App UI Design", "UX Audit", "Wireframing", "Interactive Prototyping", "User Journey Mapping", "Design Systems", "Usability Testing", "Dashboard UX", "SaaS UX Design", "Landing Page UX", "Accessibility UX", "Mobile UX Design", "Product Redesign", "Figma Components"] },
  { key: "video-animation", label: "Video & Animation", subcategories: ["Short-Form Video Editing", "Long-Form Editing", "YouTube Editing", "Reels/TikTok Editing", "Motion Graphics", "2D Animation", "3D Animation", "Explainer Videos", "Animated Ads", "Subtitle & Captions", "Color Grading", "Video Cleanup", "Intro/Outro Creation", "Storyboard Support", "Visual Effects"] },
  { key: "audio-music", label: "Audio & Music", subcategories: ["Voice Over", "Podcast Editing", "Audio Cleanup", "Audio Mixing", "Mastering", "Music Production", "Beat Making", "Sound Design", "Jingles", "Audiobook Editing", "Audio Restoration", "Background Score", "Music Arrangement", "Vocal Tuning", "Audio Branding"] },
  { key: "writing-translation", label: "Writing & Translation", subcategories: ["SEO Blog Writing", "Article Writing", "Copywriting", "Website Content", "Product Descriptions", "Technical Writing", "Script Writing", "Grant Writing", "Resume Writing", "Proofreading", "Editing & Rewriting", "Translation", "Localization", "Transcreation", "Business Writing"] },
  { key: "digital-marketing", label: "Digital Marketing", subcategories: ["Search Engine Optimization", "On-Page SEO", "Technical SEO", "Local SEO", "Google Ads", "Meta Ads", "LinkedIn Ads", "Social Media Marketing", "Email Marketing", "Marketing Funnel Setup", "Conversion Rate Optimization", "Content Strategy", "Influencer Outreach", "Analytics Setup", "Brand Growth Strategy"] },
  { key: "sales-leads", label: "Sales & Lead Generation", subcategories: ["B2B Lead Generation", "B2C Lead Generation", "Prospect List Building", "Appointment Setting", "Cold Email Campaigns", "Sales Copy", "CRM Setup", "CRM Cleanup", "Pipeline Management", "Sales Funnel Setup", "Outreach Automation", "LinkedIn Prospecting", "Market Research", "Contact Verification", "Sales Reporting"] },
  { key: "ecommerce", label: "Ecommerce", subcategories: ["Shopify Store Setup", "WooCommerce Setup", "Amazon Store Management", "Etsy Store Support", "eBay Listing Support", "Product Listing Optimization", "A+ Content Design", "Store Speed Optimization", "Checkout Optimization", "Payment Gateway Setup", "Inventory Management", "Order Workflow Automation", "Dropshipping Setup", "Marketplace Ads", "Ecommerce Analytics"] },
  { key: "business-finance", label: "Business & Finance", subcategories: ["Business Plans", "Financial Forecasting", "Financial Modeling", "Bookkeeping", "Accounts Reconciliation", "Tax Preparation Support", "Investor Pitch Financials", "Cost Analysis", "Cash Flow Management", "Budget Planning", "Pricing Strategy", "Management Reporting", "Virtual CFO Advisory", "Payroll Support", "Financial Process Setup"] },
  { key: "legal", label: "Legal Services", subcategories: ["Contract Drafting", "Contract Review", "Legal Research", "Terms & Conditions", "Privacy Policy", "Cookie Policy", "NDA Drafting", "Employment Agreements", "IP Documentation", "Trademark Support", "Compliance Documentation", "Business Registration Guidance", "Legal Notice Drafting", "Dispute Support Documents", "Policy Updates"] },
  { key: "hr-training", label: "HR & Training", subcategories: ["Recruitment Support", "Talent Sourcing", "Resume Screening", "Interview Coordination", "Job Description Writing", "Onboarding Kits", "Employee Handbook", "HR Policy Drafting", "Performance Management", "Training Program Design", "Learning Material Creation", "HR Process Automation", "Workforce Planning", "Team Development", "Leadership Coaching"] },
  { key: "project-management", label: "Project Management", subcategories: ["Agile Project Setup", "Scrum Master Support", "Kanban Workflow Setup", "Project Roadmapping", "Task Breakdown", "Milestone Planning", "Risk Management", "Stakeholder Reporting", "Resource Planning", "Program Coordination", "PMO Documentation", "Team Standup Management", "Delivery Tracking", "Retrospective Facilitation", "Cross-Team Coordination"] },
  { key: "virtual-assistance", label: "Virtual Assistance", subcategories: ["Administrative Support", "Data Entry", "Internet Research", "Calendar Management", "Email Management", "Travel Planning", "Meeting Coordination", "Document Formatting", "File Organization", "Spreadsheet Management", "Customer Follow-Up", "CRM Updates", "Personal Assistance", "Operations Support", "Task Management"] },
  { key: "customer-support", label: "Customer Support", subcategories: ["Live Chat Support", "Email Support", "Phone Support", "Ticket Management", "Helpdesk Setup", "Knowledge Base Creation", "SOP Documentation", "Escalation Handling", "Refund & Returns Handling", "Onboarding Support", "After-Sales Support", "Support QA", "Multilingual Support", "Community Support", "Support Analytics"] },
  { key: "architecture-engineering", label: "Architecture & Engineering", subcategories: ["2D Floor Plans", "3D Modeling", "Architectural Visualization", "CAD Drafting", "Structural Drawings", "MEP Drawings", "Interior Layout Planning", "Landscape Plans", "Construction Documentation", "BIM Modeling", "Permit Drawing Support", "Renovation Plans", "Product CAD Modeling", "Technical Drawings", "Engineering Calculations"] },
  { key: "product-photography", label: "Photography & Image Editing", subcategories: ["Product Photography", "Portrait Retouching", "Background Removal", "Color Correction", "Photo Restoration", "Image Manipulation", "Batch Photo Editing", "Real Estate Photo Editing", "Fashion Retouching", "Ecommerce Image Prep", "Jewelry Retouching", "Photo Enhancement", "Thumbnail Design", "Composite Editing", "Image Optimization"] },
  { key: "gaming", label: "Gaming Services", subcategories: ["Game UI Design", "Game Asset Creation", "Level Design", "Game Testing", "Gameplay Balancing", "Character Design", "Environment Design", "Server Setup", "Community Moderation", "Streaming Overlay Design", "Esports Brand Assets", "Game Trailer Editing", "Bug Reporting", "Game Localization", "Unity/Unreal Scripting"] },
  { key: "blockchain", label: "Blockchain & Web3", subcategories: ["Smart Contract Development", "Smart Contract Audit", "DApp Development", "Tokenomics Advisory", "Token Deployment", "NFT Contract Setup", "NFT Collection Launch", "Wallet Integration", "Web3 Frontend", "Blockchain Consulting", "DeFi Integration", "DAO Setup", "On-Chain Analytics", "Web3 Security Review", "Blockchain API Integration"] },
  { key: "consulting", label: "Consulting", subcategories: ["Business Consulting", "Startup Consulting", "Operations Consulting", "Technology Consulting", "Growth Consulting", "Go-To-Market Strategy", "Product Strategy", "Pricing Strategy", "Market Entry Strategy", "Process Improvement", "Digital Transformation", "Executive Advisory", "Change Management", "Competitive Analysis", "Strategic Planning"] }
];
const OVERVIEW_BLOCKED_TERMS = /(hack|hacking|crack|fake|fraud|scam|weapon|drugs|adult|porn|illegal)/i;
let overviewTagsState = [];

function updatePlansVisibility(tabId) {
  if (!plansBox) return;
  plansBox.classList.toggle("hidden", tabId !== "marketplace");
}

function getActiveTabId() {
  const navTab = document.querySelector(".nav-btn.active")?.dataset.tab;
  if (navTab) return navTab;
  return document.querySelector(".tab.active")?.id || "marketplace";
}

function syncPlansVisibility() {
  const activeTabId = getActiveTabId();
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === activeTabId));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.id === activeTabId));
  document.body.setAttribute("data-active-tab", activeTabId);
  updatePlansVisibility(activeTabId);
}

function setActiveTab(tabId) {
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.id === tabId));
  document.body.setAttribute("data-active-tab", tabId);
  saveActiveTabPreference(tabId);
  try {
    if (window.location.hash !== `#${tabId}`) {
      history.replaceState(null, "", `#${tabId}`);
    }
  } catch {
    try {
      window.location.hash = tabId;
    } catch {}
  }
  try {
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }
  } catch {}
  updatePlansVisibility(tabId);
}

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.dataset.tab;
    if (!targetTab) return;
    setActiveTab(targetTab);
    renderAll();
  });
});

ctaSellBtn.addEventListener("click", () => {
  setActiveTab("seller");
  renderAll();
});

  if (openCreateGigBtn) {
  openCreateGigBtn.addEventListener("click", () => {
    clearSellerDraftState();
    sellerCreateMode = true;
    sellerWizardStep = "overview";
    sellerGalleryState = { image1Name: "", image1DataUrl: "", image2Name: "", image2DataUrl: "", docName: "", docDataUrl: "" };
    faqItemsState = [];
    if (galleryImage1) galleryImage1.value = "";
    if (galleryImage2) galleryImage2.value = "";
    if (galleryDoc) galleryDoc.value = "";
    renderGalleryPreview();
    renderFaqList();
    saveSellerFlowState();
    saveSellerDraftState();
    setActiveTab("seller");
    renderAll();
  });
}

if (closeCreateFlowBtn) {
  closeCreateFlowBtn.addEventListener("click", () => {
    sellerCreateMode = false;
    sellerWizardStep = "overview";
    sellerGalleryState = { image1Name: "", image1DataUrl: "", image2Name: "", image2DataUrl: "", docName: "", docDataUrl: "" };
    faqItemsState = [];
    renderGalleryPreview();
    renderFaqList();
    saveSellerFlowState();
    setActiveTab("seller");
    renderAll();
  });
}

if (exploreProToolsBtn) {
  exploreProToolsBtn.addEventListener("click", () => {
    const data = getData();
    const me = getCurrentUser(data);
    if (!hasPlanAccess(me, "premium")) {
      notify("Pro tools are available for Premium and Pro members only. Please upgrade to access.");
      setActiveTab("marketplace");
      renderAll();
      setTimeout(() => {
        plansBox?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    sellerCreateMode = false;
    setActiveTab("marketplace");
    renderAll();
    setTimeout(() => {
      plansBox?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  });
}

function refreshOverviewSubcategories() {
  if (!ovCategory || !ovSubcategory) return;
  const selected = ovCategory.value;
  const selectedSub = ovSubcategory.value;
  const categoryObj = OVERVIEW_CATEGORY_CATALOG.find((c) => c.key === selected);
  const items = categoryObj?.subcategories || [];
  ovSubcategory.innerHTML = `<option value="">Choose subcategory</option>${items
    .map((x) => `<option value="${x}">${x}</option>`)
    .join("")}`;
  if (selectedSub && items.includes(selectedSub)) {
    ovSubcategory.value = selectedSub;
  }
}

function renderOverviewCategories(filter = "") {
  if (!ovCategory) return;
  const selected = ovCategory.value;
  const q = String(filter || "").trim().toLowerCase();

  const filtered = !q
    ? OVERVIEW_CATEGORY_CATALOG
    : OVERVIEW_CATEGORY_CATALOG.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.subcategories.some((s) => s.toLowerCase().includes(q))
      );

  ovCategory.innerHTML = `<option value="">Choose category</option>${filtered
    .map((c) => `<option value="${c.key}">${c.label}</option>`)
    .join("")}`;

  if (selected && filtered.some((c) => c.key === selected)) {
    ovCategory.value = selected;
  }
}

function normalizeOverviewTag(tag) {
  return String(tag || "")
    .trim()
    .replace(/\s+/g, " ");
}

function renderOverviewTagChips() {
  if (!ovTagChips) return;
  ovTagChips.innerHTML = overviewTagsState
    .map(
      (tag, idx) =>
        `<span class="overview-tag-chip">${tag}<button type="button" onclick="removeOverviewTagAt(${idx})" aria-label="Remove tag">×</button></span>`
    )
    .join("");
}

function addOverviewTag(rawTag) {
  const tag = normalizeOverviewTag(rawTag);
  if (!tag) return;
  if (overviewTagsState.includes(tag)) return;
  if (overviewTagsState.length >= 5) return;
  overviewTagsState.push(tag);
  renderOverviewTagChips();
  saveSellerDraftState();
}

function removeOverviewTag(tag) {
  overviewTagsState = overviewTagsState.filter((t) => t !== tag);
  renderOverviewTagChips();
  validateOverviewInputs();
  saveSellerDraftState();
}

function removeOverviewTagAt(index) {
  overviewTagsState = overviewTagsState.filter((_, i) => i !== index);
  renderOverviewTagChips();
  validateOverviewInputs();
  saveSellerDraftState();
}

function clearInlineFieldErrors(scopeEl) {
  const root = scopeEl || document;
  root.querySelectorAll(".field-error").forEach((n) => n.remove());
  root.querySelectorAll(".field-error-input").forEach((n) => n.classList.remove("field-error-input"));
}

function setInlineFieldError(el, message) {
  if (!el || !message) return;
  el.classList.add("field-error-input");
  const next = el.nextElementSibling;
  if (next && next.classList.contains("field-error")) {
    next.textContent = message;
    return;
  }
  const div = document.createElement("div");
  div.className = "field-error";
  div.textContent = message;
  el.insertAdjacentElement("afterend", div);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderGalleryPreview() {
  if (!galleryPreview) return;
  const rows = [];
  if (sellerGalleryState.image1DataUrl) {
    rows.push(`<img class="gallery-thumb" src="${sellerGalleryState.image1DataUrl}" alt="Primary sample" />`);
  }
  if (sellerGalleryState.image2DataUrl) {
    rows.push(`<img class="gallery-thumb" src="${sellerGalleryState.image2DataUrl}" alt="Second sample" />`);
  }
  if (sellerGalleryState.docName) {
    rows.push(`<span class="gallery-doc-pill">${sellerGalleryState.docName}</span>`);
  }
  galleryPreview.innerHTML = rows.join("");
  syncGalleryLockState();
}

function syncGalleryLockState() {
  if (galleryImage1) {
    const hasPrimary = !!sellerGalleryState.image1DataUrl;
    galleryImage1.disabled = hasPrimary;
    galleryImage1.style.opacity = hasPrimary ? "0.65" : "1";
    galleryImage1.style.cursor = hasPrimary ? "not-allowed" : "pointer";
    galleryImage1.title = hasPrimary ? "Primary image already uploaded." : "";
  }
  if (galleryImage2) {
    const hasSecond = !!sellerGalleryState.image2DataUrl;
    galleryImage2.disabled = hasSecond;
    galleryImage2.style.opacity = hasSecond ? "0.65" : "1";
    galleryImage2.style.cursor = hasSecond ? "not-allowed" : "pointer";
    galleryImage2.title = hasSecond ? "Second image already uploaded." : "";
  }
}

function renderFaqList() {
  if (!faqList) return;
  faqList.innerHTML = faqItemsState
    .map(
      (faq, idx) => `
        <div class="faq-row">
          <div class="faq-row-top">
            <strong>FAQ ${idx + 1}</strong>
            <button type="button" class="faq-remove-btn" data-remove-faq="${idx}">Remove</button>
          </div>
          <input type="text" data-faq-q="${idx}" placeholder="Question" value="${String(faq.q || "").replace(/"/g, "&quot;")}" />
          <input type="text" data-faq-a="${idx}" placeholder="Answer" value="${String(faq.a || "").replace(/"/g, "&quot;")}" />
        </div>
      `
    )
    .join("");
}

function parseDayValue(v) {
  const n = parseInt(String(v || "").replace(/\D+/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

async function handleGalleryFileChange(target) {
  if (target === galleryImage1 && sellerGalleryState.image1DataUrl) return;
  if (target === galleryImage2 && sellerGalleryState.image2DataUrl) return;
  const file = target?.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await fileToDataUrl(file);
    if (target === galleryImage1) {
      sellerGalleryState.image1Name = file.name;
      sellerGalleryState.image1DataUrl = dataUrl;
    } else if (target === galleryImage2) {
      sellerGalleryState.image2Name = file.name;
      sellerGalleryState.image2DataUrl = dataUrl;
    } else if (target === galleryDoc) {
      sellerGalleryState.docName = file.name;
      sellerGalleryState.docDataUrl = dataUrl;
    }
    renderGalleryPreview();
    runHiddenAIDetector("gallery");
    saveSellerDraftState();
  } catch {
    notify("File upload failed. Please try another file.");
  }
}

function validateOverviewInputs(showErrors = true) {
  if (!ovProceedBtn) return true;
  if (showErrors) {
    clearInlineFieldErrors(overviewStepPanel || undefined);
  }

  const title = (ovTitle?.value || "").trim();
  const category = ovCategory?.value || "";
  const subcategory = ovSubcategory?.value || "";
  const rawTags = (ovTags?.value || "").trim();
  const scope = (ovRequirements?.value || "").trim();
  const errors = [];

  if (ovTitleCount) ovTitleCount.textContent = String(title.length);

  if (title.length < 12) {
    errors.push("Title must be at least 12 characters for clarity.");
    if (showErrors) setInlineFieldError(ovTitle, "Please write a more specific title (minimum 12 characters).");
  }
  if (title.length > 80) {
    errors.push("Title exceeds 80 characters.");
    if (showErrors) setInlineFieldError(ovTitle, "Title should not exceed 80 characters.");
  }
  if (OVERVIEW_BLOCKED_TERMS.test(title)) {
    errors.push("Title contains restricted or unsafe wording.");
    if (showErrors) setInlineFieldError(ovTitle, "Please remove restricted wording from title.");
  }

  if (!category) {
    errors.push("Please choose a primary category.");
    if (showErrors) setInlineFieldError(ovCategory, "Please select a category.");
  }
  if (!subcategory) {
    errors.push("Please choose a subcategory.");
    if (showErrors) setInlineFieldError(ovSubcategory, "Please select a subcategory.");
  }

  const tags = overviewTagsState.slice();
  if (rawTags.includes(",")) {
    rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => {
        if (tags.length < 5 && !tags.includes(t)) tags.push(t);
      });
  }

  if (tags.length < 3) {
    errors.push("Add minimum 3 search tags.");
    if (showErrors) setInlineFieldError(ovTags, "Please add at least 3 tags.");
  }
  if (tags.length > 5) {
    errors.push("Use maximum 5 tags.");
    if (showErrors) setInlineFieldError(ovTags, "Maximum 5 tags allowed.");
  }
  if (tags.some((t) => !/^[a-zA-Z0-9 -]+$/.test(t))) {
    errors.push("Tags can only include letters, numbers, spaces, and hyphens.");
    if (showErrors) setInlineFieldError(ovTags, "Use only letters, numbers, spaces, and hyphens in tags.");
  }
  if (tags.some((t) => OVERVIEW_BLOCKED_TERMS.test(t))) {
    errors.push("One or more tags contain restricted wording.");
    if (showErrors) setInlineFieldError(ovTags, "Restricted wording found in tags.");
  }

  if (scope.length < 35) {
    errors.push("Service scope should be at least 35 characters.");
    if (showErrors) setInlineFieldError(ovRequirements, "Please provide more detail (minimum 35 characters).");
  }
  if (OVERVIEW_BLOCKED_TERMS.test(scope)) {
    errors.push("Service scope contains restricted or non-compliant wording.");
    if (showErrors) setInlineFieldError(ovRequirements, "Please remove restricted wording from service scope.");
  }

  lastOverviewErrors = errors;
  ovProceedBtn.disabled = false;
  return !errors.length;
}

function runHiddenAIDetector(stage, showErrors = false) {
  const errors = [];

  if (stage === "overview") {
    if (!validateOverviewInputs(showErrors)) {
      errors.push(...lastOverviewErrors);
    }
  }

  if (stage === "pricing") {
    if (showErrors) clearInlineFieldErrors(pricingStepPanel || undefined);
    const packChecks = [
      { name: "Basic", n: pkgBasicName?.value.trim(), d: pkgBasicDesc?.value.trim(), p: Number(pkgBasicPrice?.value), t: pkgBasicDays?.value },
      { name: "Standard", n: pkgStandardName?.value.trim(), d: pkgStandardDesc?.value.trim(), p: Number(pkgStandardPrice?.value), t: pkgStandardDays?.value },
      { name: "Premium", n: pkgPremiumName?.value.trim(), d: pkgPremiumDesc?.value.trim(), p: Number(pkgPremiumPrice?.value), t: pkgPremiumDays?.value }
    ];

    packChecks.forEach((x) => {
      const nameEl = x.name === "Basic" ? pkgBasicName : x.name === "Standard" ? pkgStandardName : pkgPremiumName;
      const descEl = x.name === "Basic" ? pkgBasicDesc : x.name === "Standard" ? pkgStandardDesc : pkgPremiumDesc;
      const timeEl = x.name === "Basic" ? pkgBasicDays : x.name === "Standard" ? pkgStandardDays : pkgPremiumDays;
      const priceEl = x.name === "Basic" ? pkgBasicPrice : x.name === "Standard" ? pkgStandardPrice : pkgPremiumPrice;
      if (!x.n) {
        errors.push(`${x.name} package name is required.`);
        if (showErrors) setInlineFieldError(nameEl, `${x.name} package name is required.`);
      }
      if (!x.d || x.d.length < 20) {
        errors.push(`${x.name} package description should be at least 20 characters.`);
        if (showErrors) setInlineFieldError(descEl, `${x.name} description must be at least 20 characters.`);
      }
      if (!x.t) {
        errors.push(`${x.name} delivery time is required.`);
        if (showErrors) setInlineFieldError(timeEl, `${x.name} delivery time is required.`);
      }
      if (!x.p || x.p <= 4) {
        errors.push(`${x.name} price must be greater than $4.`);
        if (showErrors) setInlineFieldError(priceEl, `${x.name} price must be above $4.`);
      }
    });

    const b = Number(pkgBasicPrice?.value || 0);
    const s = Number(pkgStandardPrice?.value || 0);
    const p = Number(pkgPremiumPrice?.value || 0);
    if (b && s && p && !(b <= s && s <= p)) {
      errors.push("Package pricing should follow Basic <= Standard <= Premium.");
      if (showErrors) setInlineFieldError(pkgStandardPrice, "Pricing must follow Basic <= Standard <= Premium.");
    }
  }

  if (stage === "description") {
    if (showErrors) clearInlineFieldErrors(descriptionStepPanel || undefined);
    const d = (descMain?.value || "").trim();
    const faqs = faqItemsState.map((x) => ({ q: String(x.q || "").trim(), a: String(x.a || "").trim() }));

    if (!d || d.length < 120) {
      errors.push("Service description should be at least 120 characters.");
      if (showErrors) setInlineFieldError(descMain, "Please provide a detailed description (minimum 120 characters).");
    }
    if (OVERVIEW_BLOCKED_TERMS.test(d)) {
      errors.push("Service description contains restricted wording.");
      if (showErrors) setInlineFieldError(descMain, "Please remove restricted wording.");
    }
    const partialFaqs = faqs.filter((f) => f.q || f.a);
    partialFaqs.forEach((f, idx) => {
      if (!f.q || f.q.length < 8) {
        errors.push(`FAQ ${idx + 1} question must be meaningful.`);
      }
      if (!f.a || f.a.length < 8) {
        errors.push(`FAQ ${idx + 1} answer must be meaningful.`);
      }
    });
  }

  if (stage === "requirements") {
    if (showErrors) clearInlineFieldErrors(requirementsStepPanel || undefined);
    const req = (reqChecklist?.value || "").trim();
    if (!req || req.length < 40) {
      errors.push("Client input checklist is mandatory and must be detailed.");
      if (showErrors) setInlineFieldError(reqChecklist, "Please provide a detailed client input checklist (minimum 40 characters).");
    }
    if (OVERVIEW_BLOCKED_TERMS.test(req)) {
      errors.push("Client input checklist contains restricted wording.");
      if (showErrors) setInlineFieldError(reqChecklist, "Please remove restricted wording from checklist.");
    }
  }

  if (stage === "gallery") {
    if (showErrors) clearInlineFieldErrors(galleryStepPanel || undefined);
    if (!sellerGalleryState.image1DataUrl) {
      errors.push("Primary image is required.");
      if (showErrors) setInlineFieldError(galleryImage1, "Please upload the primary image.");
    }
    if (!sellerGalleryState.image2DataUrl) {
      errors.push("Second image is required.");
      if (showErrors) setInlineFieldError(galleryImage2, "Please upload the second image.");
    }
  }

  if (aiGuardBox && aiGuardList) {
    aiGuardList.innerHTML = errors.length ? errors.map((e) => `<li>${e}</li>`).join("") : "";
    aiGuardBox.classList.add("hidden");
  }

  return errors;
}

function focusFirstPricingIssue() {
  const checks = [
    [pkgBasicName, (v) => !!v?.trim()],
    [pkgBasicDesc, (v) => !!v?.trim() && v.trim().length >= 20],
    [pkgBasicDays, (v) => !!v],
    [pkgBasicPrice, (v) => Number(v) > 4],
    [pkgStandardName, (v) => !!v?.trim()],
    [pkgStandardDesc, (v) => !!v?.trim() && v.trim().length >= 20],
    [pkgStandardDays, (v) => !!v],
    [pkgStandardPrice, (v) => Number(v) > 4],
    [pkgPremiumName, (v) => !!v?.trim()],
    [pkgPremiumDesc, (v) => !!v?.trim() && v.trim().length >= 20],
    [pkgPremiumDays, (v) => !!v],
    [pkgPremiumPrice, (v) => Number(v) > 4]
  ];

  for (const [el, rule] of checks) {
    if (!el) continue;
    const value = "value" in el ? el.value : "";
    if (!rule(value)) {
      try {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
      return;
    }
  }
}

function setSellerWizardStep(step) {
  sellerWizardStep = SELLER_STEP_ORDER.includes(step) ? step : "overview";
  saveSellerFlowState();
  saveSellerDraftState();
  if (sellerStepOverview) sellerStepOverview.classList.toggle("active", sellerWizardStep === "overview");
  if (sellerStepPricing) sellerStepPricing.classList.toggle("active", sellerWizardStep === "pricing");
  if (sellerStepDescription) sellerStepDescription.classList.toggle("active", sellerWizardStep === "description");
  if (sellerStepRequirements) sellerStepRequirements.classList.toggle("active", sellerWizardStep === "requirements");
  if (sellerStepGallery) sellerStepGallery.classList.toggle("active", sellerWizardStep === "gallery");
  if (sellerStepPublish) sellerStepPublish.classList.toggle("active", sellerWizardStep === "publish");
  if (overviewStepPanel) overviewStepPanel.classList.toggle("hidden", sellerWizardStep !== "overview");
  if (pricingStepPanel) pricingStepPanel.classList.toggle("hidden", sellerWizardStep !== "pricing");
  if (descriptionStepPanel) descriptionStepPanel.classList.toggle("hidden", sellerWizardStep !== "description");
  if (requirementsStepPanel) requirementsStepPanel.classList.toggle("hidden", sellerWizardStep !== "requirements");
  if (galleryStepPanel) galleryStepPanel.classList.toggle("hidden", sellerWizardStep !== "gallery");
  if (publishStepPanel) publishStepPanel.classList.toggle("hidden", sellerWizardStep !== "publish");
}

function canJumpToStep(targetStep) {
  const currentIdx = SELLER_STEP_ORDER.indexOf(sellerWizardStep);
  const targetIdx = SELLER_STEP_ORDER.indexOf(targetStep);
  if (targetIdx === -1 || currentIdx === -1) return false;
  return targetIdx <= currentIdx;
}

sellerStepNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetStep = btn.dataset.step;
    if (!targetStep) return;
    if (!canJumpToStep(targetStep)) return;
    setSellerWizardStep(targetStep);
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

if (ovCategory) {
  ovCategory.addEventListener("change", () => {
    refreshOverviewSubcategories();
    validateOverviewInputs(stepAttempted.overview);
    saveSellerDraftState();
  });
}

if (ovCategorySearch) {
  ovCategorySearch.addEventListener("input", () => {
    renderOverviewCategories(ovCategorySearch.value);
    refreshOverviewSubcategories();
    validateOverviewInputs(stepAttempted.overview);
    saveSellerDraftState();
  });
}

if (ovSubcategory) ovSubcategory.addEventListener("change", () => {
  validateOverviewInputs(stepAttempted.overview);
  saveSellerDraftState();
});
if (ovTitle) ovTitle.addEventListener("input", () => {
  validateOverviewInputs(stepAttempted.overview);
  saveSellerDraftState();
});
if (ovTags) {
  ovTags.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const pending = ovTags.value.trim();
      if (pending) {
        addOverviewTag(pending);
        ovTags.value = "";
      }
      validateOverviewInputs(stepAttempted.overview);
      saveSellerDraftState();
      return;
    }
    if (e.key === "Backspace" && !ovTags.value && overviewTagsState.length) {
      overviewTagsState.pop();
      renderOverviewTagChips();
      validateOverviewInputs(stepAttempted.overview);
      saveSellerDraftState();
    }
  });
  ovTags.addEventListener("blur", () => {
    const pending = ovTags.value.trim();
    if (pending) {
      addOverviewTag(pending);
      ovTags.value = "";
    }
    validateOverviewInputs(stepAttempted.overview);
    saveSellerDraftState();
  });
}
if (ovRequirements) ovRequirements.addEventListener("input", () => {
  validateOverviewInputs(stepAttempted.overview);
  saveSellerDraftState();
});
if (galleryImage1) galleryImage1.addEventListener("change", () => handleGalleryFileChange(galleryImage1));
if (galleryImage2) galleryImage2.addEventListener("change", () => handleGalleryFileChange(galleryImage2));
if (galleryDoc) galleryDoc.addEventListener("change", () => handleGalleryFileChange(galleryDoc));

[
  pkgBasicName,
  pkgStandardName,
  pkgPremiumName,
  pkgBasicDesc,
  pkgStandardDesc,
  pkgPremiumDesc,
  pkgBasicPrice,
  pkgStandardPrice,
  pkgPremiumPrice,
  pkgBasicDays,
  pkgStandardDays,
  pkgPremiumDays
].forEach((el) => {
  if (!el) return;
  const eventName = el.tagName === "SELECT" ? "change" : "input";
  el.addEventListener(eventName, () => {
    runHiddenAIDetector("pricing", stepAttempted.pricing);
    saveSellerDraftState();
  });
});

[descMain].forEach((el) => {
  if (!el) return;
  el.addEventListener("input", () => {
    runHiddenAIDetector("description", stepAttempted.description);
    saveSellerDraftState();
  });
});

if (addFaqBtn) {
  addFaqBtn.addEventListener("click", () => {
    faqItemsState.push({ q: "", a: "" });
    renderFaqList();
    saveSellerDraftState();
  });
}

if (faqList) {
  faqList.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const qIdx = t.dataset.faqQ;
    const aIdx = t.dataset.faqA;
    if (qIdx !== undefined) {
      const i = Number(qIdx);
      if (!Number.isNaN(i) && faqItemsState[i]) faqItemsState[i].q = t.value;
    }
    if (aIdx !== undefined) {
      const i = Number(aIdx);
      if (!Number.isNaN(i) && faqItemsState[i]) faqItemsState[i].a = t.value;
    }
    runHiddenAIDetector("description", stepAttempted.description);
    saveSellerDraftState();
  });

  faqList.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const removeIdx = t.getAttribute("data-remove-faq");
    if (removeIdx === null) return;
    const i = Number(removeIdx);
    if (Number.isNaN(i)) return;
    faqItemsState = faqItemsState.filter((_, idx) => idx !== i);
    renderFaqList();
    runHiddenAIDetector("description", stepAttempted.description);
    saveSellerDraftState();
  });
}

if (reqChecklist) {
  reqChecklist.addEventListener("input", () => {
    runHiddenAIDetector("requirements", stepAttempted.requirements);
    saveSellerDraftState();
  });
}

if (ovProceedBtn) {
  ovProceedBtn.addEventListener("click", () => {
    stepAttempted.overview = true;
    const aiErrors = runHiddenAIDetector("overview", true);
    if (aiErrors.length) return;
    sellerCreateMode = true;
    setSellerWizardStep("pricing");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (pricingBackBtn) {
  pricingBackBtn.addEventListener("click", () => {
    runHiddenAIDetector("overview", false);
    setSellerWizardStep("overview");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (pricingNextBtn) {
  pricingNextBtn.addEventListener("click", () => {
    stepAttempted.pricing = true;
    const aiErrors = runHiddenAIDetector("pricing", true);
    if (aiErrors.length) {
      focusFirstPricingIssue();
      return;
    }
    setSellerWizardStep("description");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (descriptionBackBtn) {
  descriptionBackBtn.addEventListener("click", () => {
    setSellerWizardStep("pricing");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (descriptionNextBtn) {
  descriptionNextBtn.addEventListener("click", () => {
    stepAttempted.description = true;
    const aiErrors = runHiddenAIDetector("description", true);
    if (aiErrors.length) return;
    setSellerWizardStep("requirements");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (requirementsBackBtn) {
  requirementsBackBtn.addEventListener("click", () => {
    setSellerWizardStep("description");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (requirementsNextBtn) {
  requirementsNextBtn.addEventListener("click", () => {
    stepAttempted.requirements = true;
    const aiErrors = runHiddenAIDetector("requirements", true);
    if (aiErrors.length) return;
    setSellerWizardStep("gallery");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (galleryBackBtn) {
  galleryBackBtn.addEventListener("click", () => {
    setSellerWizardStep("requirements");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (galleryNextBtn) {
  galleryNextBtn.addEventListener("click", () => {
    stepAttempted.gallery = true;
    const aiErrors = runHiddenAIDetector("gallery", true);
    if (aiErrors.length) return;
    setSellerWizardStep("publish");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (publishBackBtn) {
  publishBackBtn.addEventListener("click", () => {
    setSellerWizardStep("gallery");
    sellerCreateFlow?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (publishNowBtn) {
  publishNowBtn.addEventListener("click", () => {
    const overviewErrors = runHiddenAIDetector("overview");
    const pricingErrors = runHiddenAIDetector("pricing");
    const descriptionErrors = runHiddenAIDetector("description");
    const requirementsErrors = runHiddenAIDetector("requirements");
    const galleryErrors = runHiddenAIDetector("gallery");
    if ([...overviewErrors, ...pricingErrors, ...descriptionErrors, ...requirementsErrors, ...galleryErrors].length) {
      notify("Please complete all required fields before publishing.");
      return;
    }

    const data = getData();
    const me = getCurrentUser(data);
    if (!me) {
      notify("Please login first.");
      return;
    }

    const title = (ovTitle?.value || "").trim();
    const categoryLabel =
      OVERVIEW_CATEGORY_CATALOG.find((c) => c.key === (ovCategory?.value || ""))?.label || "General";
    const subcategory = (ovSubcategory?.value || "").trim();
    const description = (descMain?.value || "").trim();
    const basePrice = Number(pkgBasicPrice?.value || 0);
    const deliveryDays = parseDayValue(pkgBasicDays?.value);

    data.services.unshift({
      id: uid("s"),
      sellerId: me.id,
      title,
      category: subcategory ? `${categoryLabel} • ${subcategory}` : categoryLabel,
      description,
      basePrice: basePrice > 4 ? basePrice : 5,
      deliveryDays,
      rating: 0,
      ordersCompleted: 0,
      isPublic: true,
      tags: overviewTagsState.slice(),
      galleryImages: [sellerGalleryState.image1DataUrl, sellerGalleryState.image2DataUrl].filter(Boolean),
      portfolioDocName: sellerGalleryState.docName || ""
    });

    saveData(data);
    notify("Service published successfully.");
    sellerCreateMode = false;
    sellerWizardStep = "overview";
    clearSellerDraftState();
    renderAll();
    setActiveTab("explore");
    renderServices();
  });
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    search.value = chip.dataset.cat;
    setActiveTab("explore");
    renderServices();
  });
});

search.addEventListener("input", renderServices);
sortBy.addEventListener("change", renderServices);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".service-menu-wrap")) {
    if (openServiceMenuId) {
      openServiceMenuId = null;
      renderServices();
    }
  }
  if (!e.target.closest(".seller-service-menu-wrap")) {
    if (openSellerHubMenuId) {
      openSellerHubMenuId = null;
      renderSellerHub();
    }
  }
});

loginBtn.addEventListener("click", () => {
  document.getElementById("auth").scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("name").focus();
});

signupBtn.addEventListener("click", () => {
  document.getElementById("auth").scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("name").focus();
});

logoutBtn.addEventListener("click", () => {
  const data = getData();
  data.currentUserId = null;
  saveData(data);
  authMessage.className = "";
  authMessage.textContent = "Logged out successfully.";
  renderAll();
});

function updateCheckoutSummary() {
  const data = getData();
  const me = getCurrentUser(data);
  const service = data.services.find((s) => s.id === currentCheckoutServiceId);
  if (!service) return;

  const tier = packageTierEl.value;
  const total = packagePrice(service.basePrice, tier);
  const fee = +(total * COMMISSION_RATE).toFixed(2);
  const sellerAmount = +(total - fee).toFixed(2);
  const baseDelivery = packageDelivery(service.deliveryDays, tier);
  const priorityEnabled = hasPlanAccess(me, "premium");
  const delivery = priorityEnabled ? Math.max(1, baseDelivery - 1) : baseDelivery;

  checkoutSummary.innerHTML = `
    <strong>Order Summary</strong>
    <div class="meta">Package: ${toTitleCase(tier)} | Delivery: ${delivery} days</div>
    <div class="meta">Total: ${money(total)} | Platform Fee: ${money(fee)} | Seller Receives: ${money(sellerAmount)}</div>
    ${priorityEnabled ? `<div class="meta"><span class="badge priority">Priority Order</span> Premium fast processing applied</div>` : ""}
    <div class="meta">Payment: ${paymentMethodEl.value || "Not selected"}</div>
  `;
}

function openCheckout(serviceId) {
  const data = getData();
  const me = getCurrentUser(data);
  const service = data.services.find((s) => s.id === serviceId);

  if (!me || !service) return;
  if (service.sellerId === me.id) {
    alert("You cannot order your own service.");
    return;
  }

  currentCheckoutServiceId = serviceId;
  packageTierEl.value = "basic";
  paymentMethodEl.value = "";
  orderRequirementsEl.value = "";

  checkoutServiceInfo.innerHTML = `
    <strong>${service.title}</strong>
    <div class="meta">Seller: ${getUserName(data, service.sellerId)}</div>
    <div class="meta">Base Price: ${money(service.basePrice)} | Delivery: ${service.deliveryDays} day(s)</div>
  `;

  updateCheckoutSummary();
  checkoutModal.classList.remove("hidden");
}

function closeCheckoutModal() {
  checkoutModal.classList.add("hidden");
  currentCheckoutServiceId = null;
}

closeCheckout.addEventListener("click", closeCheckoutModal);
checkoutModal.addEventListener("click", (e) => {
  if (e.target === checkoutModal) closeCheckoutModal();
});

packageTierEl.addEventListener("change", updateCheckoutSummary);
paymentMethodEl.addEventListener("change", updateCheckoutSummary);

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getData();
  const me = getCurrentUser(data);
  const service = data.services.find((s) => s.id === currentCheckoutServiceId);
  if (!me || !service) return;

  const tier = packageTierEl.value;
  const paymentMethod = paymentMethodEl.value;
  const requirements = orderRequirementsEl.value.trim();

  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }
  if (!requirements) {
    alert("Please provide order requirements.");
    return;
  }

  const total = packagePrice(service.basePrice, tier);
  const fee = +(total * COMMISSION_RATE).toFixed(2);
  const sellerEarning = +(total - fee).toFixed(2);
  const baseDeliveryDays = packageDelivery(service.deliveryDays, tier);
  const priorityEnabled = hasPlanAccess(me, "premium");
  const deliveryDays = priorityEnabled ? Math.max(1, baseDeliveryDays - 1) : baseDeliveryDays;

  data.orders.unshift({
    id: uid("o"),
    number: orderNumber(),
    buyerId: me.id,
    sellerId: service.sellerId,
    serviceId: service.id,
    title: service.title,
    packageTier: tier,
    packageName: toTitleCase(tier),
    paymentMethod,
    paymentStatus: "Paid",
    requirements,
    isPriority: priorityEnabled,
    total,
    fee,
    sellerEarning,
    status: "Pending",
    date: new Date().toISOString(),
    dueDate: nextDate(deliveryDays)
  });

  saveData(data);
  closeCheckoutModal();
  renderAll();
  alert(`Order confirmed (${toTitleCase(tier)}). Your platform earned ${money(fee)}.`);
});

function closeChatModal() {
  chatModal.classList.add("hidden");
  currentChatOrderId = null;
  currentChatOtherUserId = null;
}

closeChat.addEventListener("click", closeChatModal);
chatModal.addEventListener("click", (e) => {
  if (e.target === chatModal) closeChatModal();
});

function openChat(orderId) {
  const data = getData();
  const me = getCurrentUser(data);
  const order = data.orders.find((o) => o.id === orderId);
  if (!me || !order) return;

  if (order.buyerId !== me.id && order.sellerId !== me.id) {
    alert("You cannot access this conversation.");
    return;
  }

  currentChatOrderId = orderId;
  currentChatOtherUserId = order.buyerId === me.id ? order.sellerId : order.buyerId;

  chatThreadMeta.innerHTML = `
    <strong>${order.number} - ${order.title}</strong>
    <div class="meta">Chat with: ${getUserName(data, currentChatOtherUserId)}</div>
  `;

  chatInput.value = "";
  renderChatMessages();
  chatModal.classList.remove("hidden");
}

function renderChatMessages() {
  const data = getData();
  const me = getCurrentUser(data);
  if (!me || !currentChatOrderId) return;

  const threadId = threadIdForOrder(currentChatOrderId);
  const msgs = data.messages.filter((m) => m.threadId === threadId).sort((a, b) => new Date(a.date) - new Date(b.date));

  chatMessages.innerHTML = msgs.length
    ? msgs
        .map((m) => {
          const mine = m.fromId === me.id;
          return `<div class="msg ${mine ? "mine" : "other"}"><div>${m.text}</div><div class="msg-meta">${mine ? "You" : getUserName(data, m.fromId)} | ${formatDate(m.date)}</div></div>`;
        })
        .join("")
    : `<div class="meta">No messages yet. Start the conversation.</div>`;

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getData();
  const me = getCurrentUser(data);
  if (!me || !currentChatOrderId || !currentChatOtherUserId) return;

  const text = chatInput.value.trim();
  if (!text) return;

  data.messages.push({
    id: uid("m"),
    threadId: threadIdForOrder(currentChatOrderId),
    orderId: currentChatOrderId,
    fromId: me.id,
    toId: currentChatOtherUserId,
    text,
    date: new Date().toISOString()
  });

  saveData(data);
  chatInput.value = "";
  renderChatMessages();
  renderInbox();
});
authForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const role = document.getElementById("role").value;

  if (!name || !email) return;

  const data = getData();
  let user = data.users.find((u) => u.email === email);

  if (!user) {
    user = { id: uid("u"), name, email, role, subscriptionTier: "free", subscriptionActive: false, walletBalance: 1000 };
    data.users.push(user);
    authMessage.className = "success";
    authMessage.textContent = `Welcome ${name}, your account is ready.`;
  } else {
    user.name = name;
    user.role = role;
    user.subscriptionTier = normalizeSubscriptionTier(user.subscriptionTier);
    user.subscriptionActive = user.subscriptionActive === true && user.subscriptionTier !== "free";
    user.walletBalance = Number.isFinite(Number(user.walletBalance)) ? Number(user.walletBalance) : 1000;
    authMessage.className = "success";
    authMessage.textContent = `Welcome back ${name}.`;
  }

  data.currentUserId = user.id;
  saveData(data);
  renderAll();
});

if (serviceForm) {
  serviceForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = getData();
    const me = getCurrentUser(data);
    if (!me || (me.role !== "seller" && me.role !== "both")) {
      if (sellerMessage) {
        sellerMessage.className = "error";
        sellerMessage.textContent = "Login as seller or both to publish services.";
      }
      return;
    }

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value.trim();
    const description = document.getElementById("description").value.trim();
    const basePrice = Number(document.getElementById("price").value);
    const deliveryDays = Number(document.getElementById("deliveryDays").value);
    const tags = document
      .getElementById("serviceTags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!title || !category || !description || basePrice < 5 || deliveryDays < 1) {
      if (sellerMessage) {
        sellerMessage.className = "error";
        sellerMessage.textContent = "Please fill all fields, set price >= $5, and delivery >= 1 day.";
      }
      return;
    }

    data.services.unshift({
      id: uid("s"),
      sellerId: me.id,
      title,
      category,
      description,
      basePrice,
      deliveryDays,
      rating: 0,
      ordersCompleted: 0,
      isPublic: true,
      tags
    });

    saveData(data);
    serviceForm.reset();
    if (sellerMessage) {
      sellerMessage.className = "success";
      sellerMessage.textContent = "Service published with Basic/Standard/Premium packages.";
    }
    renderAll();
  });
}

withdrawForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getData();
  const me = getCurrentUser(data);
  if (!me || (me.role !== "seller" && me.role !== "both")) {
    withdrawMessage.className = "error";
    withdrawMessage.textContent = "Only sellers can request withdrawals.";
    return;
  }

  const amount = Number(document.getElementById("withdrawAmount").value);
  const method = document.getElementById("withdrawMethod").value;
  const account = document.getElementById("withdrawAccount").value.trim();
  const available = sellerAvailableToWithdraw(data, me.id);

  if (!amount || amount <= 0) {
    withdrawMessage.className = "error";
    withdrawMessage.textContent = "Enter a valid withdrawal amount.";
    return;
  }
  if (amount > available) {
    withdrawMessage.className = "error";
    withdrawMessage.textContent = `Insufficient withdrawable balance. Available: ${money(available)}.`;
    return;
  }
  if (!method || !account) {
    withdrawMessage.className = "error";
    withdrawMessage.textContent = "Please provide withdrawal method and account details.";
    return;
  }

  data.withdrawals.unshift({
    id: uid("w"),
    sellerId: me.id,
    amount: +amount.toFixed(2),
    method,
    account,
    status: "Pending",
    date: new Date().toISOString(),
    processedDate: null
  });

  saveData(data);
  withdrawForm.reset();
  withdrawMessage.className = "success";
  withdrawMessage.textContent = "Withdrawal request submitted. Waiting for platform approval.";
  renderAll();
});

ownerWithdrawForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getData();
  const me = getCurrentUser(data);

  if (!me) {
    ownerWithdrawMessage.className = "error";
    ownerWithdrawMessage.textContent = "Please login first.";
    return;
  }

  const amount = Number(document.getElementById("ownerWithdrawAmount").value);
  const method = document.getElementById("ownerWithdrawMethod").value;
  const account = document.getElementById("ownerWithdrawAccount").value.trim();
  const available = ownerAvailableCommission(data);

  if (!amount || amount <= 0) {
    ownerWithdrawMessage.className = "error";
    ownerWithdrawMessage.textContent = "Enter a valid withdrawal amount.";
    return;
  }
  if (amount > available) {
    ownerWithdrawMessage.className = "error";
    ownerWithdrawMessage.textContent = `Insufficient commission balance. Available: ${money(available)}.`;
    return;
  }
  if (!method || !account) {
    ownerWithdrawMessage.className = "error";
    ownerWithdrawMessage.textContent = "Please provide withdrawal method and account details.";
    return;
  }

  data.ownerWithdrawals.unshift({
    id: uid("ow"),
    ownerId: me.id,
    amount: +amount.toFixed(2),
    method,
    account,
    status: "Approved",
    date: new Date().toISOString()
  });

  saveData(data);
  ownerWithdrawForm.reset();
  ownerWithdrawMessage.className = "success";
  ownerWithdrawMessage.textContent = `Commission withdrawn successfully: ${money(amount)} via ${method}.`;
  renderAll();
});

planTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    activePlanKey = btn.dataset.plan;
    renderPlanSection();
  });
});

planPayBtn.addEventListener("click", () => {
  const data = getData();
  const me = getCurrentUser(data);

  if (!me) {
    planMessage.textContent = "Please login first to subscribe.";
    return;
  }

  if (!planPaymentMethod.value) {
    planMessage.textContent = "Please select a payment method.";
    return;
  }

  openPlanPaymentPage(activePlanKey, planPaymentMethod.value);
});

if (planPaymentClose) {
  planPaymentClose.addEventListener("click", closePlanPaymentPage);
}

if (planPaymentCancel) {
  planPaymentCancel.addEventListener("click", closePlanPaymentPage);
}

if (planPaymentConfirm) {
  planPaymentConfirm.addEventListener("click", () => {
    const data = getData();
    const me = getCurrentUser(data);
    if (!me || !pendingPlanCheckout) {
      closePlanPaymentPage();
      return;
    }

    const { planKey, method } = pendingPlanCheckout;
    const cfg = PLAN_CONFIG[planKey];
    if (!cfg) {
      closePlanPaymentPage();
      return;
    }

    const validationError = validatePlanPaymentFields(method);
    if (validationError) {
      if (planPaymentMessage) {
        planPaymentMessage.className = "error";
        planPaymentMessage.textContent = validationError;
      }
      return;
    }

    const currentTier = normalizeSubscriptionTier(me.subscriptionTier);
    if (me.subscriptionActive === true && currentTier === planKey) {
      if (planPaymentMessage) {
        planPaymentMessage.className = "error";
        planPaymentMessage.textContent = `You already have ${cfg.label}.`;
      }
      return;
    }

    const amountCents = toCents(cfg.price || 0);
    const balanceCents = toCents(me.walletBalance || 0);
    if (balanceCents < amountCents) {
      if (planPaymentMessage) {
        planPaymentMessage.className = "error";
        planPaymentMessage.textContent = `Insufficient balance. Required ${money(fromCents(amountCents))}, available ${money(fromCents(balanceCents))}.`;
      }
      return;
    }

    const updatedBalanceCents = balanceCents - amountCents;
    me.walletBalance = fromCents(updatedBalanceCents);
    me.subscriptionTier = planKey;
    me.subscriptionActive = true;
    data.ownerSubscriptionRevenue = fromCents(toCents(data.ownerSubscriptionRevenue || 0) + amountCents);
    data.planPayments.unshift({
      id: uid("pp"),
      userId: me.id,
      userName: me.name,
      planKey,
      planLabel: cfg.label,
      method,
      amount: fromCents(amountCents),
      date: new Date().toISOString()
    });

    saveData(data);
    closePlanPaymentPage();
    planMessage.textContent = `${cfg.label} activated via ${method}. Charged ${money(fromCents(amountCents))}. Remaining balance: ${money(fromCents(updatedBalanceCents))}.`;
    renderAll();
  });
}

function markOrderComplete(orderId) {
  const data = getData();
  const me = getCurrentUser(data);
  const order = data.orders.find((o) => o.id === orderId);

  if (!me || !order) return;
  if (order.sellerId !== me.id) {
    alert("Only the seller can complete this order.");
    return;
  }

  order.status = "Completed";

  const service = data.services.find((s) => s.id === order.serviceId);
  if (service) service.ordersCompleted += 1;

  saveData(data);
  renderAll();
}

function submitReview(orderId) {
  const data = getData();
  const me = getCurrentUser(data);
  const order = data.orders.find((o) => o.id === orderId);

  if (!me || !order) return;
  if (order.buyerId !== me.id) {
    alert("Only the buyer can leave a review.");
    return;
  }
  if (order.status !== "Completed") {
    alert("You can review only after order completion.");
    return;
  }
  if (hasReview(data, orderId)) {
    alert("Review already submitted for this order.");
    return;
  }

  const ratingEl = document.getElementById(`rating_${orderId}`);
  const commentEl = document.getElementById(`comment_${orderId}`);
  if (!ratingEl || !commentEl) return;

  const rating = Number(ratingEl.value);
  const comment = commentEl.value.trim();

  if (!rating || !comment) {
    alert("Please add rating and comment.");
    return;
  }

  data.reviews.unshift({
    id: uid("r"),
    orderId,
    serviceId: order.serviceId,
    buyerId: me.id,
    sellerId: order.sellerId,
    rating,
    comment,
    date: new Date().toISOString()
  });

  recalculateServiceRatings(data);
  saveData(data);
  renderAll();
}

function approveWithdrawal(withdrawalId) {
  const data = getData();
  const w = data.withdrawals.find((x) => x.id === withdrawalId);
  if (!w || w.status !== "Pending") return;

  w.status = "Approved";
  w.processedDate = new Date().toISOString();

  saveData(data);
  renderAll();
}

function rejectWithdrawal(withdrawalId) {
  const data = getData();
  const w = data.withdrawals.find((x) => x.id === withdrawalId);
  if (!w || w.status !== "Pending") return;

  w.status = "Rejected";
  w.processedDate = new Date().toISOString();

  saveData(data);
  renderAll();
}

function showServiceDetails(serviceId) {
  const data = getData();
  const service = data.services.find((s) => s.id === serviceId);
  if (!service) return;

  const reviews = data.reviews.filter((r) => r.serviceId === serviceId).slice(0, 3);
  const reviewText = reviews.length
    ? reviews
        .map((r) => {
          const buyer = data.users.find((u) => u.id === r.buyerId);
          return `${r.rating}★ by ${buyer?.name || "Buyer"}: ${r.comment}`;
        })
        .join("\n\n")
    : "No reviews yet.";

  alert(
    `${service.title}\n\nCategory: ${service.category}\nBase Price: ${money(service.basePrice)}\nDelivery: ${service.deliveryDays} day(s)\nRating: ${service.rating}★\n\nTop Reviews:\n${reviewText}`
  );
}

function canManageServiceById(data, serviceId) {
  const me = getCurrentUser(data);
  if (!me) return false;
  if (getActiveTabId() !== "seller") return false;
  const service = data.services.find((s) => s.id === serviceId);
  if (!service) return false;
  return service.sellerId === me.id;
}

function setServiceVisibility(serviceId, isPublic) {
  const data = getData();
  const service = data.services.find((s) => s.id === serviceId);
  if (!service) return;
  if (!canManageServiceById(data, serviceId)) {
    alert("Only your own seller service can be managed from Become Seller.");
    return;
  }

  service.isPublic = isPublic;
  saveData(data);
  renderAll();
}

function deleteService(serviceId) {
  const data = getData();
  const service = data.services.find((s) => s.id === serviceId);
  if (!service) return;
  if (!canManageServiceById(data, serviceId)) {
    alert("Only your own seller service can be deleted from Become Seller.");
    return;
  }

  if (!confirm("Delete this service permanently?")) return;

  const removedOrderIds = new Set(
    data.orders.filter((o) => o.serviceId === serviceId).map((o) => o.id)
  );

  data.services = data.services.filter((s) => s.id !== serviceId);
  data.orders = data.orders.filter((o) => o.serviceId !== serviceId);
  data.reviews = data.reviews.filter((r) => r.serviceId !== serviceId);
  data.messages = data.messages.filter((m) => !removedOrderIds.has(m.orderId));

  saveData(data);
  renderAll();
}

function toggleServiceMenu(serviceId) {
  const data = getData();
  if (!canManageServiceById(data, serviceId)) return;
  openServiceMenuId = openServiceMenuId === serviceId ? null : serviceId;
  renderServices();
}

function toggleSellerHubMenu(serviceId) {
  const data = getData();
  if (!canManageServiceById(data, serviceId)) return;
  openSellerHubMenuId = openSellerHubMenuId === serviceId ? null : serviceId;
  renderSellerHub();
}

function setSellerHubVisibility(serviceId, isPublic) {
  openSellerHubMenuId = null;
  setServiceVisibility(serviceId, isPublic);
}

function deleteSellerHubService(serviceId) {
  openSellerHubMenuId = null;
  deleteService(serviceId);
}

function renderServices() {
  const data = getData();
  const me = getCurrentUser(data);
  const query = search.value.trim().toLowerCase();
  const sort = sortBy.value;

  let services = data.services.filter((s) => {
    if (s.isPublic === false && s.sellerId !== me?.id) return false;
    const seller = data.users.find((u) => u.id === s.sellerId);
    const tagText = (s.tags || []).join(" ");
    const fullText = `${s.title} ${s.category} ${s.description} ${tagText} ${seller?.name || ""}`.toLowerCase();
    return fullText.includes(query);
  });

  const sellerRank = (service) => {
    const seller = data.users.find((u) => u.id === service.sellerId);
    return planRank(seller?.subscriptionTier);
  };

  services = services.sort((a, b) => sellerRank(b) - sellerRank(a));

  if (sort === "priceLow") services = services.sort((a, b) => a.basePrice - b.basePrice);
  if (sort === "priceHigh") services = services.sort((a, b) => b.basePrice - a.basePrice);
  if (sort === "rating") services = services.sort((a, b) => b.rating - a.rating);
  if (sort === "popular") services = services.sort((a, b) => b.ordersCompleted - a.ordersCompleted);

  serviceList.innerHTML = services.length
    ? services
        .map((s) => {
          const isOwn = me?.id === s.sellerId;
          const basic = packagePrice(s.basePrice, "basic");
          const standard = packagePrice(s.basePrice, "standard");
          const premium = packagePrice(s.basePrice, "premium");
          const reviewCount = data.reviews.filter((r) => r.serviceId === s.id).length;
          const ratingLabel = reviewCount > 0 ? `${Number(s.rating || 0).toFixed(1)}★` : "New";
          const reviewMeta = reviewCount > 0 ? `(${reviewCount} reviews)` : "(No reviews yet)";

          return `
            <article class="service-card">
              <div class="card-cover" style="${
                s.galleryImages?.[0]
                  ? `background-image:url('${s.galleryImages[0]}'); background-size:cover; background-position:center;`
                  : `background:${coverByCategory(s.category)}`
              }"></div>
              <div class="card-content">
                <div class="service-top">
                  <div class="meta">${s.category}</div>
                </div>
                <h4>${s.title}</h4>
                <p class="meta">${s.description}</p>
                <div class="meta">Seller: ${getUserName(data, s.sellerId)} | <span class="rating">${ratingLabel}</span> ${reviewMeta}</div>
                <div class="meta">Packages: Basic ${money(basic)} | Standard ${money(standard)} | Premium ${money(premium)}</div>
                <div class="price-row"><span class="price">From ${money(s.basePrice)}</span></div>
                <div class="card-actions">
                  <button class="buy-btn" onclick="openCheckout('${s.id}')" ${isOwn ? "disabled" : ""}>${isOwn ? "Your Service" : "Order"}</button>
                  <button class="details-btn" onclick="showServiceDetails('${s.id}')">Details</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("")
    : "";
}

function renderInbox() {
  const data = getData();
  const me = getCurrentUser(data);
  const target = document.getElementById("inboxThreads");

  if (!me) {
    target.innerHTML = `<div class="list-item">Login to see inbox.</div>`;
    return;
  }

  const relevant = data.messages.filter((m) => m.fromId === me.id || m.toId === me.id);
  const latestByThread = new Map();

  relevant.forEach((m) => {
    const prev = latestByThread.get(m.threadId);
    if (!prev || new Date(m.date) > new Date(prev.date)) {
      latestByThread.set(m.threadId, m);
    }
  });

  const rows = Array.from(latestByThread.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

  target.innerHTML = rows.length
    ? rows
        .map((m) => {
          const order = data.orders.find((o) => o.id === m.orderId);
          const otherId = m.fromId === me.id ? m.toId : m.fromId;
          return `
            <div class="list-item">
              <div class="thread-row">
                <div>
                  <strong>${order?.number || "Order"} - ${order?.title || "Conversation"}</strong>
                  <div class="thread-preview">${getUserName(data, otherId)}: ${m.text}</div>
                  <div class="meta">${formatDate(m.date)}</div>
                </div>
                ${order ? `<button class="chat-btn" onclick="openChat('${order.id}')">Open Chat</button>` : ""}
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="list-item">No chat messages yet. Start from any order.</div>`;
}

function renderDashboard() {
  const data = getData();
  const me = getCurrentUser(data);

  const myOrders = data.orders.filter((o) => o.buyerId === me?.id || o.sellerId === me?.id);
  const myServices = data.services.filter((s) => s.sellerId === me?.id);

  const sales = data.orders.filter((o) => o.sellerId === me?.id);
  const purchases = data.orders.filter((o) => o.buyerId === me?.id);
  const myRevenue = sales.reduce((sum, o) => sum + o.sellerEarning, 0);
  const mySpend = purchases.reduce((sum, o) => sum + o.total, 0);

  const sellerReviews = data.reviews.filter((r) => r.sellerId === me?.id);
  const avgRating = sellerReviews.length
    ? (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length).toFixed(1)
    : "0.0";

  document.getElementById("userStats").innerHTML = `
    <div class="stat"><div class="label">Logged in as</div><div class="value">${me?.name || "Guest"}</div></div>
    <div class="stat"><div class="label">Role</div><div class="value">${me?.role || "None"}</div></div>
    <div class="stat"><div class="label">Seller Earnings</div><div class="value">${money(myRevenue)}</div></div>
    <div class="stat"><div class="label">Buyer Spend</div><div class="value">${money(mySpend)}</div></div>
    <div class="stat"><div class="label">Avg Seller Rating</div><div class="value">${avgRating}★</div></div>
  `;

  document.getElementById("myOrders").innerHTML = myOrders.length
    ? myOrders
        .map((o) => {
          const isSeller = o.sellerId === me?.id;
          const isBuyer = o.buyerId === me?.id;
          const reviewed = hasReview(data, o.id);

          return `
            <div class="list-item">
              <strong>${o.title}</strong>
              <div class="meta">Order: ${o.number} | Package: ${o.packageName} | Total: ${money(o.total)}</div>
              <div class="meta">Placed: ${formatDate(o.date)} | Due: ${formatDate(o.dueDate)}</div>
              <div class="meta">Payment: ${o.paymentMethod} <span class="badge ${o.paymentStatus === "Paid" ? "paid" : "pending"}">${o.paymentStatus}</span></div>
              <div class="meta">Status: ${o.status} ${o.isPriority ? `<span class="badge priority">Priority</span>` : ""}</div>

              <details class="order-details">
                <summary>View order details</summary>
                <div class="order-grid">
                  <div><strong>Buyer</strong><br>${getUserName(data, o.buyerId)}</div>
                  <div><strong>Seller</strong><br>${getUserName(data, o.sellerId)}</div>
                  <div><strong>Platform Fee</strong><br>${money(o.fee)}</div>
                  <div><strong>Seller Receives</strong><br>${money(o.sellerEarning)}</div>
                </div>
                <div class="meta" style="margin-top:8px;"><strong>Requirements:</strong> ${o.requirements}</div>
              </details>

              <button class="chat-btn" onclick="openChat('${o.id}')">Open Chat</button>

              ${isSeller && o.status !== "Completed" ? `<button class="status-btn" onclick="markOrderComplete('${o.id}')">Mark Completed</button>` : ""}

              ${
                isBuyer && o.status === "Completed" && !reviewed
                  ? `<div class="review-form">
                      <select id="rating_${o.id}">
                        <option value="">Rate this order</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Very Good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                      <textarea id="comment_${o.id}" rows="2" placeholder="Write your review"></textarea>
                      <button class="review-btn" onclick="submitReview('${o.id}')">Submit Review</button>
                    </div>`
                  : ""
              }
              ${isBuyer && reviewed ? `<div class="meta" style="margin-top:8px;">Review submitted</div>` : ""}
            </div>
          `;
        })
        .join("")
    : `<div class="list-item">No orders yet.</div>`;
  const lifetime = me ? sellerLifetimeEarnings(data, me.id) : 0;
  const locked = me
    ? data.withdrawals.filter((w) => w.sellerId === me.id && w.status === "Pending").reduce((sum, w) => sum + w.amount, 0)
    : 0;
  const withdrawn = me
    ? data.withdrawals.filter((w) => w.sellerId === me.id && w.status === "Approved").reduce((sum, w) => sum + w.amount, 0)
    : 0;
  const available = me ? sellerAvailableToWithdraw(data, me.id) : 0;

  document.getElementById("withdrawalStats").innerHTML = `
    <div class="stat"><div class="label">Withdrawable Balance</div><div class="value">${money(available)}</div></div>
    <div class="stat"><div class="label">Pending Payouts</div><div class="value">${money(locked)}</div></div>
    <div class="stat"><div class="label">Withdrawn</div><div class="value">${money(withdrawn)}</div></div>
    <div class="stat"><div class="label">Lifetime Seller Earnings</div><div class="value">${money(lifetime)}</div></div>
  `;

  const myWithdrawals = data.withdrawals.filter((w) => w.sellerId === me?.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("myWithdrawals").innerHTML = myWithdrawals.length
    ? myWithdrawals
        .map(
          (w) => `<div class="list-item"><strong>${money(w.amount)} via ${w.method}</strong><div class="meta">Requested: ${formatDate(w.date)}</div><div class="meta">Status: <span class="badge ${w.status.toLowerCase()}">${w.status}</span>${w.processedDate ? ` | Processed: ${formatDate(w.processedDate)}` : ""}</div></div>`
        )
        .join("")
    : `<div class="list-item">No withdrawal requests yet.</div>`;

  document.getElementById("myServices").innerHTML = myServices.length
    ? myServices
        .map((s) => {
          const reviewCount = data.reviews.filter((r) => r.serviceId === s.id).length;
          return `
            <div class="list-item">
              <strong>${s.title}</strong>
              <div class="meta">${s.category} | From ${money(s.basePrice)} | ${s.deliveryDays} day delivery | ${s.rating}★ (${reviewCount} reviews)</div>
              <div class="meta">Visibility: ${s.isPublic === false ? "Private" : "Public"}</div>
            </div>
          `;
        })
        .join("")
    : `<div class="list-item">You have not posted services yet.</div>`;

  renderInbox();
}

function renderSellerHub() {
  if (sellerHub) sellerHub.classList.toggle("hidden", sellerCreateMode);
  if (sellerCreateFlow) sellerCreateFlow.classList.toggle("hidden", !sellerCreateMode);
  setSellerWizardStep(sellerWizardStep);
  if (!sellerGigRows) return;
  const data = getData();
  const me = getCurrentUser(data);

  if (!me) {
    if (sellerLiveCount) sellerLiveCount.textContent = "0";
    sellerGigRows.innerHTML = `<tr><td class="seller-empty" colspan="6">Login to view your seller performance panel.</td></tr>`;
    return;
  }

  const myServices = data.services.filter((s) => s.sellerId === me.id);
  const liveServices = myServices.filter((s) => s.isPublic !== false);
  const premiumAccess = hasPlanAccess(me, "premium");
  const lockedPremiumLabel = `<button class="premium-required-note" onclick="showPremiumRequiredNotice()">Premium subscription required</button>`;
  if (sellerLiveCount) sellerLiveCount.textContent = String(liveServices.length);

  sellerGigRows.innerHTML = myServices.length
    ? myServices
        .map((s) => {
          const views = premiumAccess ? Math.max(12, s.ordersCompleted * 37 + 14) : lockedPremiumLabel;
          const clicks = premiumAccess ? Math.max(4, s.ordersCompleted * 8 + 5) : lockedPremiumLabel;
          const orders = Number(s.ordersCompleted || 0);
          const conversion = premiumAccess ? (clicks ? ((orders / clicks) * 100).toFixed(1) : "0.0") : lockedPremiumLabel;

          return `
            <tr>
              <td>
                <div class="seller-service-cell">
                  <div class="seller-service-dot" style="background:${coverByCategory(s.category)}"></div>
                  <div>
                    <div class="seller-service-title">${s.title}</div>
                    <div class="seller-service-meta">${s.category} | ${s.isPublic === false ? "Hidden" : "Live"}</div>
                  </div>
                </div>
              </td>
              <td>${views}</td>
              <td>${clicks}</td>
              <td>${orders}</td>
              <td>${premiumAccess ? `${conversion}%` : conversion}</td>
              <td>
                <div class="seller-service-menu-wrap">
                  <button class="seller-row-action" aria-label="Manage service" onclick="event.stopPropagation(); toggleSellerHubMenu('${s.id}')">⋮</button>
                  ${
                    openSellerHubMenuId === s.id
                      ? `
                        <div class="service-menu seller-service-menu">
                          <button onclick="setSellerHubVisibility('${s.id}', ${s.isPublic === false ? "true" : "false"})">
                            ${s.isPublic === false ? "Make Public" : "Make Private"}
                          </button>
                          <button class="danger" onclick="deleteSellerHubService('${s.id}')">Delete Service</button>
                        </div>
                      `
                      : ""
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td class="seller-empty" colspan="6">No services yet. Publish your first service to start tracking performance.</td></tr>`;

  if (!premiumAccess && myServices.length) {
    sellerGigRows.insertAdjacentHTML(
      "beforeend",
      `<tr><td class="seller-empty" colspan="6"><button class="premium-required-note" onclick="showPremiumRequiredNotice()">Premium subscription required</button></td></tr>`
    );
  }
}

function renderAdmin() {
  const data = getData();

  const totalSales = data.orders.reduce((sum, o) => sum + o.total, 0);
  const totalFee = ownerCommissionTotal(data);
  const totalSubscriptions = ownerSubscriptionTotal(data);
  const totalSeller = data.orders.reduce((sum, o) => sum + o.sellerEarning, 0);
  const paidOrders = data.orders.filter((o) => o.paymentStatus === "Paid").length;
  const approvedWithdrawals = data.withdrawals.filter((w) => w.status === "Approved").reduce((sum, w) => sum + w.amount, 0);
  const ownerWithdrawn = ownerWithdrawnTotal(data);
  const ownerAvailable = ownerAvailableCommission(data);

  document.getElementById("platformStats").innerHTML = `
    <div class="stat"><div class="label">Total Orders</div><div class="value">${data.orders.length}</div></div>
    <div class="stat"><div class="label">Paid Orders</div><div class="value">${paidOrders}</div></div>
    <div class="stat"><div class="label">GMV</div><div class="value">${money(totalSales)}</div></div>
    <div class="stat"><div class="label">Total Owner Commission</div><div class="value">${money(totalFee)}</div></div>
    <div class="stat"><div class="label">Subscription Revenue</div><div class="value">${money(totalSubscriptions)}</div></div>
    <div class="stat"><div class="label">Owner Withdrawn</div><div class="value">${money(ownerWithdrawn)}</div></div>
    <div class="stat"><div class="label">Owner Available</div><div class="value">${money(ownerAvailable)}</div></div>
    <div class="stat"><div class="label">Paid to Sellers</div><div class="value">${money(totalSeller)}</div></div>
    <div class="stat"><div class="label">Approved Seller Withdrawals</div><div class="value">${money(approvedWithdrawals)}</div></div>
  `;

  document.getElementById("ownerWalletStats").innerHTML = `
    <div class="stat"><div class="label">Commission Earned</div><div class="value">${money(totalFee)}</div></div>
    <div class="stat"><div class="label">Subscription Earned</div><div class="value">${money(totalSubscriptions)}</div></div>
    <div class="stat"><div class="label">Commission Withdrawn</div><div class="value">${money(ownerWithdrawn)}</div></div>
    <div class="stat"><div class="label">Withdrawable Now</div><div class="value">${money(ownerAvailable)}</div></div>
  `;

  const ownerWithdrawRows = data.ownerWithdrawals.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById("ownerWithdrawals").innerHTML = ownerWithdrawRows.length
    ? ownerWithdrawRows
        .map(
          (w) => `<div class="list-item"><strong>${money(w.amount)} via ${w.method}</strong><div class="meta">Date: ${formatDate(w.date)}</div><div class="meta">Status: <span class="badge approved">${w.status}</span></div></div>`
        )
        .join("")
    : `<div class="list-item">No owner commission withdrawals yet.</div>`;

  const pendingWithdrawals = data.withdrawals.filter((w) => w.status === "Pending").sort((a, b) => new Date(a.date) - new Date(b.date));
  const allWithdrawals = pendingWithdrawals.length ? pendingWithdrawals : data.withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);

  document.getElementById("withdrawalRequests").innerHTML = allWithdrawals.length
    ? allWithdrawals
        .map((w) => {
          const canProcess = w.status === "Pending";
          return `
            <div class="list-item">
              <strong>${getUserName(data, w.sellerId)} requested ${money(w.amount)}</strong>
              <div class="meta">Method: ${w.method} | Account: ${w.account}</div>
              <div class="meta">Requested: ${formatDate(w.date)} | Status: <span class="badge ${w.status.toLowerCase()}">${w.status}</span>${w.processedDate ? ` | Processed: ${formatDate(w.processedDate)}` : ""}</div>
              ${canProcess ? `<button class="admin-btn" onclick="approveWithdrawal('${w.id}')">Approve</button><button class="reject-btn" onclick="rejectWithdrawal('${w.id}')">Reject</button>` : ""}
            </div>
          `;
        })
        .join("")
    : `<div class="list-item">No withdrawal requests yet.</div>`;

  const byPayment = data.orders.reduce((acc, o) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.total;
    return acc;
  }, {});

  document.getElementById("paymentBreakdown").innerHTML = Object.entries(byPayment).length
    ? Object.entries(byPayment)
        .sort((a, b) => b[1] - a[1])
        .map(([method, amount]) => `<div class="list-item"><strong>${method}</strong><div class="meta">Volume: ${money(amount)}</div></div>`)
        .join("")
    : `<div class="list-item">No payment data yet.</div>`;

  const orderTx = data.orders.map((o) => ({
    kind: "order",
    date: o.date,
    html: `
          <div class="list-item">
            <strong>${o.number} - ${o.title}</strong>
            <div class="meta">Buyer: ${getUserName(data, o.buyerId)} | Seller: ${getUserName(data, o.sellerId)}</div>
            <div class="meta">${o.packageName} | ${o.paymentMethod} | Total: ${money(o.total)} | Fee: ${money(o.fee)} | ${o.status}</div>
          </div>
        `
  }));
  const subTx = (data.planPayments || []).map((p) => ({
    kind: "subscription",
    date: p.date,
    html: `
          <div class="list-item">
            <strong>Subscription Payment - ${p.planLabel || toTitleCase(p.planKey || "plan")}</strong>
            <div class="meta">User: ${p.userName || getUserName(data, p.userId)} | Method: ${p.method}</div>
            <div class="meta">Amount credited to owner wallet: ${money(p.amount)}</div>
          </div>
        `
  }));
  const allTx = [...orderTx, ...subTx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  document.getElementById("transactions").innerHTML = allTx.length
    ? allTx.map((t) => t.html).join("")
    : `<div class="list-item">No transactions yet.</div>`;

  document.getElementById("recentReviews").innerHTML = data.reviews.length
    ? data.reviews
        .slice(0, 10)
        .map((r) => {
          const service = data.services.find((s) => s.id === r.serviceId);
          return `<div class="list-item"><strong>${r.rating}★ on ${service?.title || "Service"}</strong><div class="meta">by ${getUserName(data, r.buyerId)} | ${formatDate(r.date)}</div><div class="meta">${r.comment}</div></div>`;
        })
        .join("")
    : `<div class="list-item">No reviews yet.</div>`;
}

function renderHero() {
  const data = getData();
  const me = getCurrentUser(data);

  const gmv = data.orders.reduce((sum, o) => sum + o.total, 0);
  const fees = data.orders.reduce((sum, o) => sum + o.fee, 0);
  const avgMarketRating = data.services.length
    ? (data.services.reduce((sum, s) => sum + s.rating, 0) / data.services.length).toFixed(1)
    : "0.0";

  heroUserName.textContent = me?.name || "Guest";
  heroStats.innerHTML = `
    <div class="floating-stat"><div class="label">Live Services</div><div class="value">${data.services.length}</div></div>
    <div class="floating-stat"><div class="label">Total Sales</div><div class="value">${money(gmv)}</div></div>
    <div class="floating-stat"><div class="label">Your Commission</div><div class="value">${money(fees)}</div></div>
    <div class="floating-stat"><div class="label">Marketplace Rating</div><div class="value">${avgMarketRating}★</div></div>
    <div class="floating-stat"><div class="label">Inbox Messages</div><div class="value">${data.messages.length}</div></div>
  `;
}

function renderAuthButtons() {
  const data = getData();
  const me = getCurrentUser(data);

  const loggedIn = !!me;
  loginBtn.classList.toggle("hidden", loggedIn);
  signupBtn.classList.toggle("hidden", loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);
  loggedInUser.classList.toggle("hidden", !loggedIn);
  const tier = loggedIn ? normalizeSubscriptionTier(me.subscriptionTier) : "free";
  const tierLabel = tier === "pro" ? "PRO" : tier === "premium" ? "PREMIUM" : "FREE";
  const walletLabel = loggedIn ? money(Number(me.walletBalance || 0)) : money(0);
  loggedInUser.textContent = loggedIn ? `Hi, ${me.name} (${tierLabel}) | Balance: ${walletLabel}` : "";
  authSection.classList.toggle("hidden", loggedIn);
}

function renderPlanSection() {
  const data = getData();
  const me = getCurrentUser(data);
  const cfg = PLAN_CONFIG[activePlanKey];

  planTabs.forEach((b) => b.classList.toggle("active", b.dataset.plan === activePlanKey));
  planCards.forEach((c) => c.classList.toggle("active", c.dataset.planCard === activePlanKey));
  planTitle.textContent = cfg.label;
  planPrice.textContent = `$${cfg.price.toFixed(2)} / month`;
  planDescription.textContent = cfg.description;

  if (me) {
    const currentTier = normalizeSubscriptionTier(me.subscriptionTier);
    const currentPlanLabel = currentTier === "pro" ? PLAN_CONFIG.pro.label : currentTier === "premium" ? PLAN_CONFIG.premium.label : "Free Plan";
    if (currentTier === activePlanKey) {
      planMessage.textContent = `Current active plan: ${currentPlan.label}`;
    } else if (!planMessage.textContent.includes("activated via")) {
      planMessage.textContent = `Current active plan: ${currentPlanLabel}`;
    }
  } else {
    planMessage.textContent = "Login to subscribe.";
  }
}

function renderAll() {
  syncPlansVisibility();
  renderAuthButtons();
  renderPlanSection();
  renderHero();
  renderServices();
  renderSellerHub();
  renderDashboard();
  renderAdmin();
  renderOverviewCategories(ovCategorySearch?.value || "");
  refreshOverviewSubcategories();
  renderGalleryPreview();
  renderFaqList();
  validateOverviewInputs(false);
  runHiddenAIDetector(sellerWizardStep, false);

  if (!chatModal.classList.contains("hidden") && currentChatOrderId) {
    renderChatMessages();
  }
}

window.openCheckout = openCheckout;
window.showServiceDetails = showServiceDetails;
window.markOrderComplete = markOrderComplete;
window.submitReview = submitReview;
window.openChat = openChat;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.setServiceVisibility = setServiceVisibility;
window.deleteService = deleteService;
window.toggleServiceMenu = toggleServiceMenu;
window.toggleSellerHubMenu = toggleSellerHubMenu;
window.setSellerHubVisibility = setSellerHubVisibility;
window.deleteSellerHubService = deleteSellerHubService;
window.showPremiumRequiredNotice = showPremiumRequiredNotice;
window.removeOverviewTagAt = removeOverviewTagAt;

const marketplaceTab = document.getElementById("marketplace");
if (plansBox && marketplaceTab && plansBox.parentElement !== marketplaceTab) {
  marketplaceTab.appendChild(plansBox);
}

const validTabIds = new Set(["marketplace", "explore", "seller", "dashboard", "admin"]);
const sellerStateOnLoad = loadSellerFlowState();
sellerCreateMode = !!sellerStateOnLoad.mode;
sellerWizardStep = ["overview", "pricing", "description", "requirements", "gallery", "publish"].includes(sellerStateOnLoad.step) ? sellerStateOnLoad.step : "overview";
const sellerDraftOnLoad = loadSellerDraftState();
applySellerDraftState(sellerDraftOnLoad);
const initialTab = getSavedActiveTab(validTabIds);

setActiveTab(initialTab);

window.addEventListener("beforeunload", () => {
  saveActiveTabPreference(getActiveTabId());
  saveSellerFlowState();
  saveSellerDraftState();
});

window.addEventListener("hashchange", () => {
  const hashTab = (window.location.hash || "").replace("#", "").trim();
  if (!validTabIds.has(hashTab)) return;
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === hashTab));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.id === hashTab));
  document.body.setAttribute("data-active-tab", hashTab);
  updatePlansVisibility(hashTab);
  saveActiveTabPreference(hashTab);
  renderAll();
});
renderAll();
