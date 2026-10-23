// Shared frontend behavior for every Coffee Bench page.
const menuItems = [
  { id: "honey-oat-cappuccino", name: "Honey Oat Cappuccino", category: "Coffee", description: "Double espresso, silky oat milk, a kiss of honey.", price: 220, tag: "Bestseller", photo: "photo-1572442388796-11668a67e53d", alt: "Cappuccino topped with delicate latte art" },
  { id: "brown-sugar-flat-white", name: "Brown Sugar Flat White", category: "Coffee", description: "Velvety microfoam with a warm caramel finish.", price: 240, tag: "House favourite", photo: "photo-1461023058943-07fcbe16d735", alt: "Freshly poured coffee in a ceramic cup" },
  { id: "vanilla-cold-brew", name: "Vanilla Cream Cold Brew", category: "Cold Drinks", description: "Slow-steeped, mellow, and finished with vanilla.", price: 260, tag: "Chilled", photo: "photo-1517701550927-30cf4ba1dba5", alt: "Iced cold brew coffee in a clear glass" },
  { id: "orange-blossom-fizz", name: "Orange Blossom Fizz", category: "Cold Drinks", description: "Fresh orange, gentle fizz, and a little blossom.", price: 210, tag: "Bright & bubbly", photo: "photo-1513558161293-cdadcf081c7b", alt: "Refreshing citrus drink served over ice" },
  { id: "garden-pesto-croissant", name: "Garden Pesto Croissant", category: "Food", description: "Flaky pastry, basil pesto, roasted tomato.", price: 285, tag: "From the oven", photo: "photo-1555507036-ab1f4038808a", alt: "Golden flaky croissant fresh from the bakery" },
  { id: "berry-ricotta-pancakes", name: "Berry Ricotta Pancakes", category: "Food", description: "Fluffy stacks, whipped ricotta, seasonal berries.", price: 320, tag: "Brunch favourite", photo: "photo-1528207776546-365bb710ee93", alt: "Fluffy pancakes topped with fresh berries" },
  { id: "cardamom-latte", name: "Cardamom Latte", category: "Coffee", description: "A comforting espresso latte with a fragrant spice.", price: 235, tag: "A little spice", photo: "photo-1509042239860-f550ce710b93", alt: "Warm latte in a handmade ceramic mug" },
  { id: "cocoa-mocha", name: "Dark Cocoa Mocha", category: "Coffee", description: "Deep cocoa, espresso, and softly steamed milk.", price: 255, tag: "Chocolatey", photo: "photo-1570968915860-54d5c301fa9f", alt: "Rich mocha coffee with cocoa dusting" },
  { id: "peach-iced-tea", name: "Peach Garden Iced Tea", category: "Cold Drinks", description: "Black tea, ripe peach, and a squeeze of lemon.", price: 205, tag: "House-made", photo: "photo-1556679343-c7306c1976bc", alt: "Peach iced tea with lemon and fresh herbs" },
  { id: "avocado-toast", name: "Avocado & Garden Toast", category: "Food", description: "Sourdough, smashed avocado, seeds, and herbs.", price: 295, tag: "All-day brunch", photo: "photo-1525351484163-7529414344d8", alt: "Avocado toast with seeds on toasted sourdough" },
  { id: "paneer-melt", name: "Smoky Paneer Melt", category: "Food", description: "Spiced paneer, peppers, and melted cheese on sourdough.", price: 330, tag: "Comfort food", photo: "photo-1528735602780-2552fd46c7af", alt: "Toasted sandwich filled with cheese and vegetables" },
  { id: "lemon-loaf", name: "Lemon & Poppy Loaf", category: "Food", description: "Soft citrus loaf with a delicate lemon glaze.", price: 175, tag: "Baked today", photo: "photo-1519869325930-281384150729", alt: "Freshly baked lemon cake served with tea" }
];

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TAX_RATE = 0.05; // Illustrative only; connect to verified rules with the backend.
const CART_KEY = "coffee-bench-cart";
const THEME_KEY = "coffee-bench-theme";
const ORDER_KEY = "coffee-bench-order";
const INVOICE_KEY = "coffee-bench-invoice";
const BOOKINGS_KEY = "coffee-bench-bookings";
const ACCOUNTS_KEY = "coffee-bench-demo-accounts";
const CURRENT_ACCOUNT_KEY = "coffee-bench-current-account";
let toastTimeout;
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (_) { return fallback; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Keep current-page behavior if storage is unavailable. */ }
}

function getSignedInProfile() {
  const email = readStorage(CURRENT_ACCOUNT_KEY, "");
  const accounts = readStorage(ACCOUNTS_KEY, []);
  return Array.isArray(accounts) ? accounts.find((account) => account.email === email) || null : null;
}

function getSavedCart() {
  const data = readStorage(CART_KEY, []);
  if (!Array.isArray(data)) return new Map();
  const result = new Map();
  data.forEach((saved) => {
    const item = menuItems.find((entry) => entry.id === saved?.id);
    const quantity = Number(saved?.quantity);
    if (item && Number.isInteger(quantity) && quantity > 0 && quantity < 100) result.set(item.id, { ...item, quantity });
  });
  return result;
}

const cart = getSavedCart();
function saveCart() {
  writeStorage(CART_KEY, [...cart.values()].map(({ id, quantity }) => ({ id, quantity })));
  updateCartCount();
}

function updateCartCount() {
  const count = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cart-count").forEach((element) => { element.textContent = String(count); });
}

function showToast(message) {
  const element = document.getElementById("toast");
  if (!element) return;
  element.textContent = message;
  element.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => element.classList.remove("is-visible"), 2400);
}

// Menu page: cards are data-driven and filtered locally.
const menuGrid = document.getElementById("menu-grid");
if (menuGrid) {
  let selectedCategory = "All";
  function renderMenu() {
    const visible = selectedCategory === "All" ? menuItems : menuItems.filter((item) => item.category === selectedCategory);
    menuGrid.innerHTML = visible.map((item) => `
      <article class="menu-card"><div class="menu-photo-wrap"><img class="menu-photo" src="https://images.unsplash.com/${item.photo}?auto=format&fit=crop&w=900&q=82" alt="${item.alt}" loading="lazy" decoding="async">${item.tag ? `<span class="menu-tag">${item.tag}</span>` : ""}</div>
      <div class="menu-card-body"><h3>${item.name}</h3><p class="menu-description">${item.description}</p><div class="menu-card-bottom"><span class="menu-price">${money.format(item.price)}</span><button class="add-button" type="button" data-add="${item.id}" aria-label="Add ${item.name} to bag">Add to bag</button></div></div></article>`).join("");
    const count = document.getElementById("menu-count");
    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? "favourite" : "favourites"}`;
  }
  document.querySelectorAll(".filter-tab").forEach((button) => button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    renderMenu();
  }));
  menuGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    const item = menuItems.find((entry) => entry.id === button.dataset.add);
    if (!item) return;
    const existing = cart.get(item.id);
    if (existing) existing.quantity += 1;
    else cart.set(item.id, { ...item, quantity: 1 });
    saveCart();
    button.textContent = "Added ✓";
    button.classList.add("is-added");
    button.setAttribute("aria-label", `${item.name} added to bag`);
    showToast(`${item.name} added to your bag ✓`);
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.textContent = "Add to bag";
      button.classList.remove("is-added");
      button.setAttribute("aria-label", `Add ${item.name} to bag`);
    }, 1500);
  });
  renderMenu();
}

// Ordering page: the cart survives navigation between menu.html and order.html.
const cartItemsElement = document.getElementById("cart-items");
if (cartItemsElement) {
  const savedOrder = readStorage(ORDER_KEY, {});
  let promoApplied = savedOrder.promo === "BLOOM10";
  let selectedOrderMode = savedOrder.mode === "Takeaway" ? "Takeaway" : "Dine in";
  const instructionsInput = document.getElementById("special-instructions");
  const customerNameInput = document.getElementById("customer-name");
  const customerPhoneInput = document.getElementById("customer-phone");
  const customerEmailInput = document.getElementById("customer-email");
  const signedInProfile = getSignedInProfile();
  const promoInput = document.getElementById("promo-code");
  if (instructionsInput && typeof savedOrder.instructions === "string") instructionsInput.value = savedOrder.instructions;
  if (customerNameInput) customerNameInput.value = signedInProfile?.name || savedOrder.customerName || "";
  if (customerPhoneInput) customerPhoneInput.value = signedInProfile?.phone || savedOrder.customerPhone || "";
  if (customerEmailInput) customerEmailInput.value = signedInProfile?.email || savedOrder.customerEmail || "";
  document.querySelectorAll(".mode-button").forEach((button) => {
    const active = button.dataset.mode === selectedOrderMode;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (promoInput && promoApplied) promoInput.value = "BLOOM10";

  if (customerNameInput && typeof savedOrder.customerName === "string") customerNameInput.value = savedOrder.customerName;
  if (customerPhoneInput && typeof savedOrder.customerPhone === "string") customerPhoneInput.value = savedOrder.customerPhone;
  function saveOrderPreferences() {
    writeStorage(ORDER_KEY, { mode: selectedOrderMode, instructions: instructionsInput?.value || "", promo: promoApplied ? "BLOOM10" : "", customerName: customerNameInput?.value || "", customerPhone: customerPhoneInput?.value || "", customerEmail: customerEmailInput?.value || "" });
  }
  function renderCart() {
    const items = [...cart.values()];
    const quantityCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * TAX_RATE * 100) / 100;
    const total = taxable + tax;
    const count = document.getElementById("cart-items-count");
    if (count) count.textContent = String(quantityCount);
    cartItemsElement.innerHTML = items.length ? items.map((item) => `
      <div class="cart-row"><div><div class="cart-item-name">${item.name}</div><p class="cart-item-price">${money.format(item.price)} each · ${money.format(item.price * item.quantity)}</p></div>
      <div class="cart-actions"><button class="quantity-btn" type="button" data-quantity="-1" data-item="${item.id}" aria-label="Remove one ${item.name}">−</button><span class="quantity-value">${item.quantity}</span><button class="quantity-btn" type="button" data-quantity="1" data-item="${item.id}" aria-label="Add one ${item.name}">+</button><button class="remove-btn" type="button" data-remove="${item.id}">Remove</button></div></div>`).join("") : '<p class="empty-cart">Your bag is waiting for something lovely. <a href="menu.html">Explore the menu →</a></p>';
    document.getElementById("cart-subtotal").textContent = money.format(subtotal);
    document.getElementById("cart-tax").textContent = money.format(tax);
    document.getElementById("cart-total").textContent = money.format(total);
    document.getElementById("cart-discount").textContent = `−${money.format(discount)}`;
    document.getElementById("discount-line").hidden = !promoApplied;
  }
  cartItemsElement.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove]");
    if (quantityButton) {
      const item = cart.get(quantityButton.dataset.item);
      if (!item) return;
      item.quantity += Number(quantityButton.dataset.quantity);
      if (item.quantity <= 0) cart.delete(item.id);
      saveCart(); renderCart();
    } else if (removeButton) {
      cart.delete(removeButton.dataset.remove);
      saveCart(); renderCart();
    }
  });
  function applyPromo() {
    const message = document.getElementById("promo-message");
    const code = promoInput.value.trim().toUpperCase();
    message.classList.remove("error");
    if (code === "BLOOM10") {
      promoApplied = true;
      message.textContent = "BLOOM10 applied — 10% off your subtotal. ✨";
    } else {
      promoApplied = false;
      message.textContent = code ? "That code didn’t work. Try BLOOM10." : "Enter the code BLOOM10 to get 10% off.";
      message.classList.add("error");
    }
    saveOrderPreferences(); renderCart();
  }
  document.getElementById("apply-promo").addEventListener("click", applyPromo);
  promoInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); applyPromo(); } });
  document.querySelectorAll(".mode-button").forEach((button) => button.addEventListener("click", () => {
    selectedOrderMode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach((mode) => {
      const active = mode === button;
      mode.classList.toggle("is-selected", active);
      mode.setAttribute("aria-pressed", String(active));
    });
    saveOrderPreferences();
  }));
  instructionsInput?.addEventListener("input", saveOrderPreferences);
  customerNameInput?.addEventListener("input", saveOrderPreferences);
  customerPhoneInput?.addEventListener("input", saveOrderPreferences);
  customerEmailInput?.addEventListener("input", saveOrderPreferences);
  document.addEventListener("coffee-bench:account-changed", (event) => {
    const profile = event.detail?.profile;
    if (!profile) return;
    customerNameInput.value = profile.name || customerNameInput.value;
    customerPhoneInput.value = profile.phone || customerPhoneInput.value;
    customerEmailInput.value = profile.email || customerEmailInput.value;
    saveOrderPreferences();
  });
  document.getElementById("checkout-button").addEventListener("click", () => {
    if (!cart.size) { showToast("Your bag is empty. Pick something lovely from the menu first."); return; }
    if (!customerNameInput.value.trim()) { customerNameInput.setCustomValidity("Add a name for the invoice."); customerNameInput.reportValidity(); customerNameInput.addEventListener("input", () => customerNameInput.setCustomValidity(""), { once: true }); return; }
    if (!customerPhoneInput.value.trim()) { customerPhoneInput.setCustomValidity("Add a contact number for the invoice."); customerPhoneInput.reportValidity(); customerPhoneInput.addEventListener("input", () => customerPhoneInput.setCustomValidity(""), { once: true }); return; }
    const phoneDigits = customerPhoneInput.value.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) { customerPhoneInput.setCustomValidity("Enter a contact number with 7 to 15 digits."); customerPhoneInput.reportValidity(); customerPhoneInput.addEventListener("input", () => customerPhoneInput.setCustomValidity(""), { once: true }); return; }
    if (!customerEmailInput.reportValidity()) return;
    const subtotal = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * TAX_RATE * 100) / 100;
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const invoice = {
      number: `TCB-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: now.toISOString(), customerName: customerNameInput.value.trim(), customerPhone: customerPhoneInput.value.trim(), customerEmail: customerEmailInput.value.trim(),
      mode: selectedOrderMode, instructions: instructionsInput.value.trim(), promoCode: promoApplied ? "BLOOM10" : "",
      items: [...cart.values()].map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, unitPrice: item.price, lineTotal: item.price * item.quantity })),
      subtotal, discount, tax, total: taxable + tax, taxRate: TAX_RATE, demo: true
    };
    writeStorage(INVOICE_KEY, invoice);
    window.location.href = "invoice.html";
  });
  renderCart();
}

// Invoice page: a printable digital bill generated from the latest local demo order.
const invoiceDocument = document.getElementById("invoice-document");
if (invoiceDocument) {
  const invoice = readStorage(INVOICE_KEY, null);
  const empty = document.getElementById("invoice-empty");
  const after = document.getElementById("invoice-after");
  if (!invoice || !Array.isArray(invoice.items) || !invoice.items.length) {
    empty.hidden = false;
  } else {
    invoiceDocument.hidden = false;
    after.hidden = false;
    document.getElementById("invoice-number").textContent = invoice.number || "TCB-DEMO";
    const created = new Date(invoice.createdAt);
    document.getElementById("invoice-date").textContent = Number.isNaN(created.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(created);
    document.getElementById("invoice-customer").textContent = invoice.customerName || "Guest";
    document.getElementById("invoice-phone").textContent = invoice.customerPhone || "";
    document.getElementById("invoice-email").textContent = invoice.customerEmail || "";
    document.getElementById("invoice-mode").textContent = invoice.mode || "Dine in";
    document.getElementById("invoice-instructions").textContent = invoice.instructions || "No special instructions.";
    const lines = document.getElementById("invoice-lines");
    invoice.items.forEach((item) => {
      const row = document.createElement("tr");
      [item.name, String(item.quantity), money.format(item.unitPrice), money.format(item.lineTotal)].forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        if (index === 3) cell.className = "align-right";
        cell.textContent = value;
        row.appendChild(cell);
      });
      lines.appendChild(row);
    });
    document.getElementById("invoice-subtotal").textContent = money.format(invoice.subtotal || 0);
    document.getElementById("invoice-tax").textContent = money.format(invoice.tax || 0);
    document.getElementById("invoice-total").textContent = money.format(invoice.total || 0);
    if (invoice.discount > 0) {
      document.getElementById("invoice-discount-row").hidden = false;
      document.getElementById("invoice-discount").textContent = `−${money.format(invoice.discount)}`;
    }
    const printButton = document.getElementById("print-invoice");
    printButton.disabled = false;
    printButton.addEventListener("click", () => window.print());
  }
}

// Booking page: request confirmation is local and temporary until a backend is connected.
const bookingForm = document.getElementById("booking-form");
if (bookingForm) {
  const bookingDate = document.getElementById("booking-date");
  const bookingTime = document.getElementById("booking-time");
  const tableGrid = document.getElementById("table-grid");
  const tableSelection = document.getElementById("table-selection");
  const bookingNameInput = document.getElementById("booking-name");
  const bookingPhoneInput = document.getElementById("booking-phone");
  const bookingProfile = getSignedInProfile();
  if (bookingNameInput && bookingProfile && !bookingNameInput.value) bookingNameInput.value = bookingProfile.name || "";
  if (bookingPhoneInput && bookingProfile && !bookingPhoneInput.value) bookingPhoneInput.value = bookingProfile.phone || "";
  document.addEventListener("coffee-bench:account-changed", (event) => {
    const profile = event.detail?.profile;
    if (!profile) return;
    bookingNameInput.value = profile.name || bookingNameInput.value;
    bookingPhoneInput.value = profile.phone || bookingPhoneInput.value;
  });
  const savedBookings = readStorage(BOOKINGS_KEY, []);
  const bookingRecords = Array.isArray(savedBookings) ? savedBookings.filter((item) => item && item.date && item.time && Number.isInteger(Number(item.table))) : [];
  const demoBookings = new Set(bookingRecords.map((item) => `${item.date}|${item.time}|${item.table}`));
  let selectedTable = null;
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  bookingDate.min = localToday;
  const bookingKey = (number) => `${bookingDate.value}|${bookingTime.value}|${number}`;
  const bookingSummary = document.getElementById("booking-summary");
  function renderBookingStatus(booking) {
    const date = new Date(`${booking.date}T12:00:00`);
    const dateText = Number.isNaN(date.getTime()) ? booking.date : new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(date);
    bookingSummary.innerHTML = `<div class="booking-status-heading"><span class="booking-status-icon" aria-hidden="true">✓</span><div><p class="eyebrow">Request prepared</p><h3>Thank you, ${escapeHtml(booking.name)}.</h3><span class="booking-state"><i></i> Awaiting café confirmation · Demo</span></div></div><div class="booking-reference"><span>Booking reference</span><strong>${escapeHtml(booking.reference)}</strong></div><div class="booking-detail-grid"><div><span>Date & time</span><strong>${escapeHtml(dateText)} · ${escapeHtml(booking.time)}</strong></div><div><span>Party</span><strong>${escapeHtml(booking.guests)} ${booking.guests === "1" ? "guest" : "guests"}</strong></div><div><span>Requested table</span><strong>Table ${escapeHtml(booking.table)}</strong></div><div><span>Contact number</span><strong>${escapeHtml(booking.phone)}</strong></div></div><div class="booking-steps"><div class="is-complete"><b>1</b><span>Request prepared</span></div><div class="is-current"><b>2</b><span>Confirmation</span></div><div><b>3</b><span>Your visit</span></div></div><p class="booking-demo-note">This request is saved in this browser only. The café has not received it yet, so this is not a confirmed reservation.</p>`;
    bookingSummary.hidden = false;
  }
  function renderTables() {
    tableGrid.innerHTML = "";
    for (let number = 1; number <= 12; number += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `table-option${selectedTable === number ? " is-selected" : ""}`;
      button.textContent = `Table ${number}`;
      button.setAttribute("aria-pressed", String(selectedTable === number));
      if (bookingDate.value && bookingTime.value && demoBookings.has(bookingKey(number))) { button.disabled = true; button.textContent = `Table ${number} · Booked`; }
      button.addEventListener("click", () => {
        if (!bookingDate.value || !bookingTime.value) { tableSelection.textContent = "Choose a date and time first."; return; }
        selectedTable = number;
        tableSelection.textContent = `Table ${number} selected. Ready when you are.`;
        renderTables();
      });
      tableGrid.appendChild(button);
    }
  }
  function resetSelection() {
    selectedTable = null;
    tableSelection.textContent = bookingDate.value && bookingTime.value ? "Choose an available table to continue." : "Choose a date and time, then select a table.";
    renderTables();
  }
  bookingDate.addEventListener("change", resetSelection);
  bookingTime.addEventListener("change", resetSelection);
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = bookingNameInput.value.trim();
    const phone = bookingPhoneInput.value.trim();
    const phoneInput = bookingPhoneInput;
    const phoneDigits = phone.replace(/\D/g, "");
    phoneInput.setCustomValidity(phone && (phoneDigits.length < 7 || phoneDigits.length > 15) ? "Enter a phone number with 7 to 15 digits." : "");
    if (!bookingForm.reportValidity()) return;
    const date = bookingDate.value;
    const time = bookingTime.value;
    const guests = document.getElementById("guest-count").value;
    if (!selectedTable) { tableSelection.textContent = "Please choose one of the available tables."; return; }
    if (date < localToday) { tableSelection.textContent = "Please choose today or a future date."; return; }
    if (demoBookings.has(bookingKey(selectedTable))) { tableSelection.textContent = "That table was just booked in this demo. Please choose another."; selectedTable = null; renderTables(); return; }
    const bookedNumber = selectedTable;
    demoBookings.add(bookingKey(bookedNumber));
    const now = new Date();
    const reference = `TCB-BK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const booking = { reference, name, phone, date, time, guests, table: bookedNumber, createdAt: now.toISOString(), status: "awaiting-confirmation-demo" };
    bookingRecords.push(booking);
    while (bookingRecords.length > 10) bookingRecords.shift();
    writeStorage(BOOKINGS_KEY, bookingRecords);
    renderBookingStatus(booking);
    selectedTable = null;
    bookingForm.reset(); bookingDate.min = localToday;
    tableSelection.textContent = "Choose a date and time, then select a table.";
    renderTables();
    bookingSummary.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
  renderTables();
  if (bookingRecords.length) renderBookingStatus(bookingRecords[bookingRecords.length - 1]);
}

// Shared theme, navigation, and motion behavior.
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    const dark = theme === "dark";
    toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    toggle.setAttribute("aria-pressed", String(dark));
  }
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* Storage may be unavailable. */ }
}
const savedTheme = readStorage(THEME_KEY, null);
setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
document.getElementById("theme-toggle")?.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navLinks?.classList.toggle("is-open", open);
});
navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a")) { navToggle.setAttribute("aria-expanded", "false"); navToggle.setAttribute("aria-label", "Open navigation"); navLinks.classList.remove("is-open"); }
});

const currentFile = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach((link) => {
  const target = new URL(link.href, window.location.href);
  if (target.pathname.split("/").pop() === currentFile && !target.hash) link.setAttribute("aria-current", "page");
});

const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  window.addEventListener("scroll", () => backToTop.classList.toggle("is-visible", window.scrollY > 500), { passive: true });
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = document.querySelectorAll(".reveal");
if (prefersReducedMotion || !("IntersectionObserver" in window)) revealElements.forEach((element) => element.classList.add("is-visible"));
else {
  const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

const navSections = [...document.querySelectorAll("main section[id]")];
if (navSections.length && "IntersectionObserver" in window) {
  const activeLinkObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const target = new URL(link.href, window.location.href);
      const active = target.pathname === window.location.pathname && target.hash === `#${entry.target.id}`;
      if (active) link.setAttribute("aria-current", "location");
      else if (target.pathname === window.location.pathname && target.hash) link.removeAttribute("aria-current");
    });
  }), { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
  navSections.forEach((section) => activeLinkObserver.observe(section));
}

// Local account prototype. Connect a real identity provider/backend before public launch.
const accountTrigger = document.getElementById("account-trigger");
if (accountTrigger) {
  const accountDialog = document.createElement("dialog");
  accountDialog.className = "account-dialog";
  accountDialog.id = "account-dialog";
  accountDialog.innerHTML = `
    <div class="account-dialog-inner">
      <button class="account-close" type="button" aria-label="Close sign-in dialog">×</button>
      <p class="eyebrow">A seat saved for you</p>
      <h2 id="account-title">Welcome to The Coffee Bench</h2>
      <p class="account-intro" id="account-intro">Sign in or create an account to keep your details ready for your bill and bookings.</p>
      <div class="account-tabs" role="tablist" aria-label="Account access"><button type="button" class="account-tab is-active" data-auth-mode="signin" aria-selected="true">Sign in</button><button type="button" class="account-tab" data-auth-mode="signup" aria-selected="false">Create account</button></div>
      <form id="signin-form" class="account-form"><label for="signin-email">Email address</label><input id="signin-email" type="email" autocomplete="email" required placeholder="you@example.com"><label for="signin-password">Password</label><input id="signin-password" type="password" autocomplete="current-password" required minlength="8" placeholder="At least 8 characters"><button class="btn btn-primary account-submit" type="submit">Sign in</button><p class="account-switch">New to the Bench? <button type="button" data-open-mode="signup">Create an account</button></p></form>
      <form id="signup-form" class="account-form" hidden><label for="signup-name">Your name</label><input id="signup-name" autocomplete="name" required maxlength="80" placeholder="Your name"><label for="signup-email">Email address</label><input id="signup-email" type="email" autocomplete="email" required placeholder="you@example.com"><label for="signup-phone">Phone number</label><input id="signup-phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="Contact number"><label for="signup-password">Create a password</label><input id="signup-password" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters"><button class="btn btn-primary account-submit" type="submit">Create account</button><p class="account-switch">Already have an account? <button type="button" data-open-mode="signin">Sign in</button></p></form>
      <section class="account-profile" id="account-profile" hidden><div class="account-avatar" id="account-avatar"></div><p id="account-profile-name" class="account-profile-name"></p><p id="account-profile-details" class="account-profile-details"></p><button type="button" id="sign-out-button" class="account-signout">Sign out</button></section>
      <p id="account-status" class="account-status" role="status" aria-live="polite"></p>
      <p class="account-local-note">Demo account: profile and a password verifier are saved only in this browser. This is not secure or synced authentication; use a backend before launch.</p>
    </div>`;
  document.body.appendChild(accountDialog);

  const accountStatus = accountDialog.querySelector("#account-status");
  const signInForm = accountDialog.querySelector("#signin-form");
  const signUpForm = accountDialog.querySelector("#signup-form");
  const accountPanel = accountDialog.querySelector("#account-profile");
  const accountTabs = accountDialog.querySelector(".account-tabs");
  let authMode = "signin";

  function setAuthMode(mode) {
    authMode = mode;
    accountTabs.hidden = Boolean(getSignedInProfile());
    signInForm.hidden = Boolean(getSignedInProfile()) || mode !== "signin";
    signUpForm.hidden = Boolean(getSignedInProfile()) || mode !== "signup";
    accountPanel.hidden = !getSignedInProfile();
    accountDialog.querySelectorAll(".account-tab").forEach((tab) => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    accountStatus.textContent = "";
    accountDialog.querySelector("#account-title").textContent = getSignedInProfile() ? "Your Bench account" : mode === "signin" ? "Welcome back" : "Make yourself at home";
    accountDialog.querySelector("#account-intro").textContent = getSignedInProfile() ? "Your details are ready for your bill and booking request." : mode === "signin" ? "Sign in to have your details ready at checkout and booking." : "Create a local demo account to save your name and contact details on this device.";
  }

  function updateAccountUI(profile) {
    const current = profile || null;
    if (current) {
      const firstName = current.name.trim().split(/\s+/)[0] || "friend";
      accountTrigger.textContent = `Hi, ${firstName}`;
      accountTrigger.setAttribute("aria-label", `Signed in as ${current.name}. Open account details`);
      accountDialog.querySelector("#account-profile-name").textContent = current.name;
      accountDialog.querySelector("#account-profile-details").textContent = `${current.email} · ${current.phone}`;
      accountDialog.querySelector("#account-avatar").textContent = current.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    } else {
      accountTrigger.textContent = "Sign in";
      accountTrigger.setAttribute("aria-label", "Sign in or create an account");
    }
    document.querySelectorAll(".hero-content h1, .page-hero h1").forEach((heading) => {
      let greeting = heading.parentElement.querySelector(".member-greeting");
      if (!greeting) {
        greeting = document.createElement("p");
        greeting.className = "member-greeting";
        heading.insertAdjacentElement("afterend", greeting);
      }
      greeting.hidden = !current;
      if (current) greeting.textContent = `Lovely to see you again, ${current.name.trim().split(/\s+/)[0]}.`;
    });
  }

  async function passwordDigest(password, saltHex) {
    if (!window.crypto?.subtle || !window.crypto?.getRandomValues) throw new Error("Secure browser storage is unavailable. Open this site through HTTPS or localhost to use the demo account.");
    const salt = saltHex ? Uint8Array.from(saltHex.match(/.{2}/g), (byte) => parseInt(byte, 16)) : window.crypto.getRandomValues(new Uint8Array(16));
    const saltValue = saltHex || [...salt].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
    const hash = [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return { salt: saltValue, hash };
  }

  accountTrigger.addEventListener("click", () => {
    setAuthMode("signin");
    accountDialog.showModal();
  });
  accountDialog.querySelector(".account-close").addEventListener("click", () => accountDialog.close());
  accountDialog.addEventListener("click", (event) => { if (event.target === accountDialog) accountDialog.close(); });
  accountDialog.querySelectorAll("[data-auth-mode], [data-open-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode || button.dataset.openMode)));

  signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signUpForm.reportValidity()) return;
    const name = accountDialog.querySelector("#signup-name").value.trim();
    const email = accountDialog.querySelector("#signup-email").value.trim().toLowerCase();
    const phone = accountDialog.querySelector("#signup-phone").value.trim();
    const password = accountDialog.querySelector("#signup-password").value;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) { accountStatus.textContent = "Enter a phone number with 7 to 15 digits."; return; }
    const accounts = readStorage(ACCOUNTS_KEY, []);
    if (!Array.isArray(accounts)) { accountStatus.textContent = "Could not read local account details. Please refresh and try again."; return; }
    if (accounts.some((account) => account.email === email)) { accountStatus.textContent = "An account with this email already exists. Please sign in."; setAuthMode("signin"); accountDialog.querySelector("#signin-email").value = email; return; }
    const submit = signUpForm.querySelector("button[type=submit]");
    submit.disabled = true; submit.textContent = "Creating your account…";
    try {
      const verifier = await passwordDigest(password);
      const account = { name, email, phone, salt: verifier.salt, passwordHash: verifier.hash, createdAt: new Date().toISOString() };
      accounts.push(account);
      writeStorage(ACCOUNTS_KEY, accounts);
      writeStorage(CURRENT_ACCOUNT_KEY, email);
      signUpForm.reset();
      updateAccountUI(account); setAuthMode("signin");
      accountStatus.textContent = `You’re signed in, ${name.split(/\s+/)[0]}. Your details are ready to use.`;
      document.dispatchEvent(new CustomEvent("coffee-bench:account-changed", { detail: { profile: { name: account.name, email: account.email, phone: account.phone } } }));
    } catch (error) {
      accountStatus.textContent = error.message || "Could not create this local demo account.";
    } finally { submit.disabled = false; submit.textContent = "Create account"; }
  });

  signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signInForm.reportValidity()) return;
    const email = accountDialog.querySelector("#signin-email").value.trim().toLowerCase();
    const password = accountDialog.querySelector("#signin-password").value;
    const accounts = readStorage(ACCOUNTS_KEY, []);
    const account = Array.isArray(accounts) ? accounts.find((entry) => entry.email === email) : null;
    if (!account) { accountStatus.textContent = "No local demo account found for this email. Create an account on this device first."; return; }
    const submit = signInForm.querySelector("button[type=submit]");
    submit.disabled = true; submit.textContent = "Signing in…";
    try {
      const verifier = await passwordDigest(password, account.salt);
      if (verifier.hash !== account.passwordHash) { accountStatus.textContent = "That password doesn’t match this local account."; return; }
      writeStorage(CURRENT_ACCOUNT_KEY, account.email);
      updateAccountUI(account); setAuthMode("signin");
      accountStatus.textContent = `Welcome back, ${account.name.split(/\s+/)[0]}. Your details are ready to use.`;
      document.dispatchEvent(new CustomEvent("coffee-bench:account-changed", { detail: { profile: { name: account.name, email: account.email, phone: account.phone } } }));
    } catch (error) {
      accountStatus.textContent = error.message || "Could not sign in to this local demo account.";
    } finally { submit.disabled = false; submit.textContent = "Sign in"; }
  });

  accountDialog.querySelector("#sign-out-button").addEventListener("click", () => {
    try { localStorage.removeItem(CURRENT_ACCOUNT_KEY); } catch (_) { /* Continue the visual sign-out. */ }
    updateAccountUI(null); setAuthMode("signin"); accountStatus.textContent = "You’re signed out on this device.";
    document.dispatchEvent(new CustomEvent("coffee-bench:account-changed", { detail: { profile: null } }));
  });
  updateAccountUI(getSignedInProfile());
}

updateCartCount();
