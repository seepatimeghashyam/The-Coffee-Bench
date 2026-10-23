
// ========================================
// BEAN & BLOOM — INTERACTIVE FEATURES
// ========================================

// 1. TABLE BOOKING DEMO

const tableGrid = document.getElementById("table-grid");
const selectedTableText = document.getElementById("selected-table");
const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("booking-message");
const bookingDate = document.getElementById("booking-date");
const bookingTime = document.getElementById("booking-time");

// Bookings are kept in memory only.
// Refreshing the page clears these demo bookings.
const demoBookings = new Set();
let selectedTable = null;

function getBookingKey(tableNumber) {
  return [
    bookingDate.value,
    bookingTime.value,
    tableNumber
  ].join("|");
}

function renderTables() {
  tableGrid.innerHTML = "";

  for (let number = 1; number <= 15; number++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "table-option";

    const isBooked =
      bookingDate.value &&
      bookingTime.value &&
      demoBookings.has(getBookingKey(number));

    button.textContent = isBooked
      ? `Table ${number} · Booked`
      : `Table ${number}`;

    if (isBooked) {
      button.disabled = true;
    }

    if (selectedTable === number && !isBooked) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      if (!bookingDate.value || !bookingTime.value) {
        bookingMessage.textContent =
          "Please choose a date and time first.";
        return;
      }

      selectedTable = number;
      selectedTableText.textContent = `Selected: Table ${number}`;
      bookingMessage.textContent = "";
      renderTables();
    });

    tableGrid.appendChild(button);
  }
}

function resetTableSelection() {
  selectedTable = null;
  selectedTableText.textContent = "No table selected yet.";
  bookingMessage.textContent = "";
  renderTables();
}

bookingDate.addEventListener("change", resetTableSelection);
bookingTime.addEventListener("change", resetTableSelection);

// Prevent selecting a date before today.
const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

bookingDate.min = localToday;

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("booking-name").value.trim();
  const date = bookingDate.value;
  const time = bookingTime.value;
  const guests = Number(document.getElementById("guest-count").value);

  if (!name || !date || !time || !selectedTable) {
    bookingMessage.textContent =
      "Please enter your name and select a date, time and table.";
    return;
  }

  if (date < localToday) {
    bookingMessage.textContent =
      "Please choose today or a future date.";
    return;
  }

  if (demoBookings.has(getBookingKey(selectedTable))) {
    bookingMessage.textContent =
      "That table has already been booked in this demo. Please choose another.";
    selectedTable = null;
    selectedTableText.textContent = "No table selected yet.";
    renderTables();
    return;
  }

  const bookedNumber = selectedTable;
  demoBookings.add(getBookingKey(bookedNumber));

  bookingMessage.textContent =
    `Demo booking recorded for ${name}: Table ${bookedNumber}, ` +
    `${guests} guest(s), on ${date} at ${time}. ` +
    "This is not a real confirmed reservation.";

  selectedTable = null;
  selectedTableText.textContent = "No table selected yet.";
  bookingForm.reset();

  // Reapply today's minimum after resetting the form.
  bookingDate.min = localToday;
  renderTables();
});

renderTables();


// 2. SHOPPING CART

const cart = new Map();

const cartItemsElement = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const subtotalElement = document.getElementById("cart-subtotal");
const taxElement = document.getElementById("cart-tax");
const totalElement = document.getElementById("cart-total");
const orderMessage = document.getElementById("order-message");

const TAX_RATE = 0.05; // Illustrative 5% only; verify actual tax rules.

function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Add menu item buttons.
document.querySelectorAll(".add-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);

    if (!name || !Number.isFinite(price) || price < 0) {
      return;
    }

    if (cart.has(name)) {
      cart.get(name).quantity += 1;
    } else {
      cart.set(name, {
        price: price,
        quantity: 1
      });
    }

    orderMessage.textContent = "";
    renderCart();
  });
});

function changeQuantity(name, amount) {
  const item = cart.get(name);

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.delete(name);
  }

  orderMessage.textContent = "";
  renderCart();
}

function removeItem(name) {
  cart.delete(name);
  orderMessage.textContent = "";
  renderCart();
}

function renderCart() {
  cartItemsElement.innerHTML = "";

  let subtotal = 0;
  let itemCount = 0;

  if (cart.size === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart";
    emptyMessage.textContent =
      "Your cart is empty. Add something delicious from the menu.";
    cartItemsElement.appendChild(emptyMessage);
  }

  cart.forEach((item, name) => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    itemCount += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";

    const details = document.createElement("div");

    const itemName = document.createElement("div");
    itemName.className = "cart-item-name";
    itemName.textContent = name;

    const itemPrice = document.createElement("p");
    itemPrice.className = "cart-item-price";
    itemPrice.textContent =
      `${formatRupees(item.price)} each · Total ${formatRupees(lineTotal)}`;

    details.append(itemName, itemPrice);

    const actions = document.createElement("div");
    actions.className = "cart-actions";

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.className = "quantity-btn";
    minusButton.textContent = "−";
    minusButton.setAttribute("aria-label", `Remove one ${name}`);
    minusButton.addEventListener("click", () => {
      changeQuantity(name, -1);
    });

    const quantity = document.createElement("span");
    quantity.className = "quantity-value";
    quantity.textContent = String(item.quantity);

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.className = "quantity-btn";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", `Add one ${name}`);
    plusButton.addEventListener("click", () => {
      changeQuantity(name, 1);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeItem(name);
    });

    actions.append(
      minusButton,
      quantity,
      plusButton,
      removeButton
    );

    row.append(details, actions);
    cartItemsElement.appendChild(row);
  });

  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;

  cartCountElement.textContent = String(itemCount);
  subtotalElement.textContent = formatRupees(subtotal);
  taxElement.textContent = formatRupees(tax);
  totalElement.textContent = formatRupees(total);
}

// Demo checkout: review the total but do not claim a real order.
document.getElementById("checkout-btn").addEventListener("click", () => {
  if (cart.size === 0) {
    orderMessage.textContent =
      "Your cart is empty. Please add an item before reviewing your order.";
    return;
  }

  orderMessage.textContent =
    `Your order total is ${totalElement.textContent}. ` +
    "This is a demo review only. No order has been sent and no payment was taken.";
});

renderCart();
