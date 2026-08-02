const seedProducts = [
  {
    id: 1,
    name: "Queen Bed with Mattress",
    category: "Furniture",
    rent: 899,
    deposit: 1800,
    tenures: [3, 6, 12],
    stock: 8,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description: "Comfortable queen bed setup for students and working professionals."
  },
  {
    id: 2,
    name: "Three-Seater Sofa",
    category: "Furniture",
    rent: 1099,
    deposit: 2200,
    tenures: [3, 6, 12],
    stock: 5,
    image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=900&q=80",
    description: "A compact sofa for apartments, shared flats, and rented homes."
  },
  {
    id: 3,
    name: "Study Table",
    category: "Furniture",
    rent: 349,
    deposit: 700,
    tenures: [1, 3, 6],
    stock: 12,
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
    description: "Simple work table for remote work, study, and exam preparation."
  },
  {
    id: 4,
    name: "Single Door Fridge",
    category: "Appliance",
    rent: 799,
    deposit: 1600,
    tenures: [3, 6, 12],
    stock: 7,
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80",
    description: "Energy-efficient fridge suitable for singles and small families."
  },
  {
    id: 5,
    name: "Washing Machine",
    category: "Appliance",
    rent: 999,
    deposit: 2000,
    tenures: [3, 6, 12],
    stock: 4,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80",
    description: "Fully automatic washing machine with maintenance support included."
  },
  {
    id: 6,
    name: "Smart TV",
    category: "Appliance",
    rent: 1199,
    deposit: 2400,
    tenures: [3, 6, 12],
    stock: 6,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80",
    description: "Large screen smart TV for entertainment without the purchase cost."
  }
];

const demoAdmin = {
  id: "rentease-demo-admin",
  name: "RentEase Admin",
  email: "admin@rentease.demo",
  password: "Admin@123",
  role: "admin"
};

let selectedCategory = "All";
let products = [];
let cart = load("renteaseCart", []);
let rentals = [];
let requests = [];
let users = [];
let serviceAreas = [];
let analytics = null;
let currentUser = load("renteaseCurrentUser", null);
let authToken = localStorage.getItem("renteaseToken");
let selectedProductId = null;
const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && window.location.port !== "3000";
const API_BASE = isLocalDevelopment ? "http://localhost:3000/api" : "/api";

if (!authToken) currentUser = null;

const productGrid = document.querySelector("#productGrid");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const rentalsList = document.querySelector("#rentalsList");
const requestList = document.querySelector("#requestList");
const maintenanceItem = document.querySelector("#maintenanceItem");
const inventoryTable = document.querySelector("#inventoryTable");
const adminRentals = document.querySelector("#adminRentals");
const adminRequests = document.querySelector("#adminRequests");
const adminUsers = document.querySelector("#adminUsers");
const serviceAreasList = document.querySelector("#serviceAreas");
const adminAnalytics = document.querySelector("#adminAnalytics");
const adminGrid = document.querySelector("#adminGrid");
const adminAccessMessage = document.querySelector("#adminAccessMessage");
const productFormTitle = document.querySelector("#productFormTitle");
const productSubmitButton = document.querySelector("#productSubmitButton");
const cancelProductEditButton = document.querySelector("#cancelProductEdit");
const toast = document.querySelector("#toast");
const deliveryDate = document.querySelector("#deliveryDate");
const userPill = document.querySelector("#userPill");
const accountMessage = document.querySelector("#accountMessage");
const productModal = document.querySelector("#productModal");
const modalClose = document.querySelector("#modalClose");
const modalAddToCart = document.querySelector("#modalAddToCart");
const modalBackToCatalog = document.querySelector("#modalBackToCatalog");
const modalTenure = document.querySelector("#modalTenure");

deliveryDate.min = getToday();

document.querySelector("#menuToggle").addEventListener("click", () => {
  document.querySelector("#navLinks").classList.toggle("open");
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts();
  });
});

document.querySelector("#registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#registerName").value.trim();
  const email = document.querySelector("#registerEmail").value.trim().toLowerCase();
  const password = document.querySelector("#registerPassword").value;
  try {
    const session = await api("/auth/register", { method: "POST", body: { name, email, password } });
    await startSession(session);
    event.target.reset();
    showToast("Account created and logged in.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector("#loginEmail").value.trim().toLowerCase();
  const password = document.querySelector("#loginPassword").value;
  try {
    const session = await api("/auth/login", { method: "POST", body: { email, password } });
    await startSession(session);
    event.target.reset();
    showToast("Logged in successfully.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  currentUser = null;
  authToken = null;
  localStorage.removeItem("renteaseCurrentUser");
  localStorage.removeItem("renteaseToken");
  rentals = [];
  requests = [];
  users = [];
  serviceAreas = [];
  analytics = null;
  renderAll();
  showToast("Logged out.");
});

document.querySelector("#areaForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  try {
    await api("/areas", { method: "POST", body: { name: document.querySelector("#areaName").value.trim() } });
    event.target.reset();
    await loadRemoteData();
    renderAll();
    showToast("Service area added.");
  } catch (error) {
    showToast(error.message);
  }
});

modalClose.addEventListener("click", closeProductDetails);
modalBackToCatalog.addEventListener("click", closeProductDetails);
productModal.addEventListener("click", (event) => {
  if (event.target === productModal) {
    closeProductDetails();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProductDetails();
  }
});
modalAddToCart.addEventListener("click", () => {
  if (!selectedProductId) return;
  addToCart(selectedProductId, Number(modalTenure.value));
  closeProductDetails();
});

document.querySelector("#checkoutForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please register or login before checkout.");
    location.hash = "#account";
    return;
  }

  if (cart.length === 0) {
    showToast("Please add at least one product to the cart.");
    return;
  }

  const customerName = document.querySelector("#customerName").value.trim();
  const city = document.querySelector("#deliveryCity").value;
  const address = document.querySelector("#deliveryAddress").value.trim();
  const date = document.querySelector("#deliveryDate").value;

  try {
    await api("/rentals", {
      method: "POST",
      body: { items: cart, customerName, city, address, deliveryDate: date }
    });
    cart = [];
    save("renteaseCart", cart);
    event.target.reset();
    await loadRemoteData();
    renderAll();
    showToast("Order placed. Your rental is now active.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin()) {
    showToast("Admin access is required to manage inventory.");
    return;
  }

  const tenureValues = getTenureValues(document.querySelector("#productTenures").value);
  if (tenureValues.length === 0) {
    showToast("Enter one or more valid tenure months, such as 3, 6, 12.");
    return;
  }

  const productId = document.querySelector("#productId").value;
  const productDetails = {
    name: document.querySelector("#productName").value.trim(),
    category: document.querySelector("#productCategory").value,
    rent: Number(document.querySelector("#productRent").value),
    deposit: Number(document.querySelector("#productDeposit").value),
    tenures: tenureValues,
    stock: Number(document.querySelector("#productStock").value),
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    description: "Admin-added rental product with flexible monthly tenure options."
  };

  try {
    await api(productId ? `/products/${productId}` : "/products", {
      method: productId ? "PUT" : "POST",
      body: productDetails
    });
    resetProductForm();
    await loadRemoteData();
    renderAll();
    showToast(productId ? "Product updated." : "Product added to inventory.");
  } catch (error) {
    showToast(error.message);
  }
});

cancelProductEditButton.addEventListener("click", resetProductForm);

function editProduct(productId) {
  if (!isAdmin()) {
    showToast("Admin access is required to edit inventory.");
    return;
  }

  const product = products.find((item) => item.id === productId);
  if (!product) return;

  document.querySelector("#productId").value = product.id;
  document.querySelector("#productName").value = product.name;
  document.querySelector("#productCategory").value = product.category;
  document.querySelector("#productRent").value = product.rent;
  document.querySelector("#productDeposit").value = product.deposit;
  document.querySelector("#productStock").value = product.stock;
  document.querySelector("#productTenures").value = product.tenures.join(", ");
  productFormTitle.textContent = "Edit Inventory Item";
  productSubmitButton.textContent = "Save Changes";
  cancelProductEditButton.hidden = false;
  document.querySelector("#productForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteProduct(productId) {
  if (!isAdmin()) {
    showToast("Admin access is required to remove inventory.");
    return;
  }

  try {
    await api(`/products/${productId}`, { method: "DELETE" });
    cart = cart.filter((item) => item.productId !== productId);
    save("renteaseCart", cart);
    resetProductForm();
    await loadRemoteData();
    renderAll();
    showToast("Product removed from inventory.");
  } catch (error) {
    showToast(error.message);
  }
}

function resetProductForm() {
  document.querySelector("#productForm").reset();
  document.querySelector("#productId").value = "";
  document.querySelector("#productTenures").value = "3, 6, 12";
  productFormTitle.textContent = "Add Inventory Item";
  productSubmitButton.textContent = "Add Product";
  cancelProductEditButton.hidden = true;
}

function getTenureValues(value) {
  return [...new Set(value.split(",")
    .map((tenure) => Number(tenure.trim()))
    .filter((tenure) => Number.isInteger(tenure) && tenure > 0))]
    .sort((first, second) => first - second);
}

document.querySelector("#maintenanceForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const visibleRentals = getCustomerRentals();

  if (!currentUser) {
    showToast("Please login before requesting support.");
    location.hash = "#account";
    return;
  }

  if (visibleRentals.length === 0) {
    showToast("You need an active rental before requesting support.");
    return;
  }

  const rental = rentals.find((item) => item.id === maintenanceItem.value);
  if (!rental) {
    showToast("Please choose an active rental item.");
    return;
  }

  try {
    await api("/requests", {
      method: "POST",
      body: {
        rentalId: rental.id,
        type: document.querySelector("#issueType").value,
        description: document.querySelector("#issueDescription").value.trim()
      }
    });
    event.target.reset();
    await loadRemoteData();
    renderAll();
    showToast("Maintenance request submitted.");
  } catch (error) {
    showToast(error.message);
  }
});

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || "Something went wrong. Please try again.");
  return data;
}

async function loadRemoteData() {
  products = await api("/products");
  serviceAreas = await api("/areas");
  cart = cart.filter((item) => products.some((product) => product.id === item.productId));
  save("renteaseCart", cart);
  if (!currentUser) return;

  const [rentalData, requestData] = await Promise.all([api("/rentals"), api("/requests")]);
  rentals = rentalData.map(normalizeRental);
  requests = requestData.map(normalizeRequest);
  if (isAdmin()) {
    [users, analytics] = await Promise.all([api("/users"), api("/analytics")]);
  }
}

function normalizeRental(rental) {
  return {
    ...rental,
    productId: rental.product_id ?? rental.productId,
    userId: rental.user_id ?? rental.userId,
    productName: rental.product_name ?? rental.productName,
    monthlyRent: rental.monthly_rent ?? rental.monthlyRent,
    customerName: rental.customer_name ?? rental.customerName,
    deliveryDate: rental.delivery_date ?? rental.deliveryDate,
    pickupDate: rental.pickup_date ?? rental.pickupDate,
    returnedDate: rental.returned_date ?? rental.returnedDate
  };
}

function normalizeRequest(request) {
  return {
    ...request,
    userId: request.user_id ?? request.userId,
    rentalId: request.rental_id ?? request.rentalId,
    productName: request.product_name ?? request.productName,
    damageCharge: request.damage_charge ?? request.damageCharge,
    createdAt: request.created_at ?? request.createdAt,
    updatedAt: request.updated_at ?? request.updatedAt
  };
}

async function startSession(session) {
  currentUser = session.user;
  authToken = session.token;
  save("renteaseCurrentUser", currentUser);
  localStorage.setItem("renteaseToken", authToken);
  await loadRemoteData();
  renderAll();
}

async function initializeApp() {
  try {
    await loadRemoteData();
  } catch (error) {
    if (authToken) {
      currentUser = null;
      authToken = null;
      localStorage.removeItem("renteaseCurrentUser");
      localStorage.removeItem("renteaseToken");
      products = await api("/products");
    }
    showToast("Unable to connect to the RentEase server.");
  }
  renderAll();
}

function renderAll() {
  renderAuth();
  renderProducts();
  renderCart();
  renderRentals();
  renderMaintenanceOptions();
  renderRequests();
  renderAdmin();
  renderMetrics();
  renderDeliveryCities();
}

function renderDeliveryCities() {
  const citySelect = document.querySelector("#deliveryCity");
  const selectedCity = citySelect.value;
  citySelect.innerHTML = `<option value="">Select city</option>${serviceAreas.map((area) => `<option value="${area.name}">${area.name}</option>`).join("")}`;
  citySelect.value = selectedCity;
}

function renderAuth() {
  if (!currentUser) {
    userPill.textContent = "Guest";
    accountMessage.textContent = "You are browsing as a guest.";
    return;
  }

  userPill.textContent = isAdmin() ? "Admin" : currentUser.name;
  accountMessage.textContent = isAdmin()
    ? `Logged in as ${currentUser.name} (demo admin).`
    : `Logged in as ${currentUser.name} (${currentUser.email}).`;
  document.querySelector("#customerName").value = currentUser.name;
}

function renderProducts() {
  const visibleProducts = selectedCategory === "All"
    ? products
    : products.filter((product) => product.category === selectedCategory);

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-body">
        <span class="status">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span><strong>₹${product.rent}</strong><br />per month</span>
          <span><strong>₹${product.deposit}</strong><br />deposit</span>
        </div>
        <p class="stock-label ${product.stock === 0 ? "out-of-stock" : ""}">${product.stock === 0 ? "Out of stock" : `${product.stock} unit${product.stock === 1 ? "" : "s"} available`}</p>
        <label>
          Tenure
          <select id="tenure-${product.id}">
            ${product.tenures.map((tenure) => `<option value="${tenure}">${tenure} months</option>`).join("")}
          </select>
        </label>
        <div class="product-actions">
          <button class="button outline" onclick="openProductDetails('${product.id}')">View Details</button>
          <button class="button primary" onclick="addToCart('${product.id}')" ${product.stock === 0 ? "disabled" : ""}>${product.stock === 0 ? "Unavailable" : "Add to Cart"}</button>
        </div>
      </div>
    </article>
  `).join("");
}

function openProductDetails(productId) {
  const product = products.find((productItem) => productItem.id === productId);
  selectedProductId = productId;

  document.querySelector("#modalProductImage").src = product.image;
  document.querySelector("#modalProductImage").alt = product.name;
  document.querySelector("#modalProductCategory").textContent = product.category;
  document.querySelector("#modalProductName").textContent = product.name;
  document.querySelector("#modalProductDescription").textContent = product.description;
  document.querySelector("#modalProductRent").textContent = `₹${product.rent}/month`;
  document.querySelector("#modalProductDeposit").textContent = `₹${product.deposit}`;
  document.querySelector("#modalProductStock").textContent = `${product.stock} units`;
  modalAddToCart.disabled = product.stock === 0;
  modalAddToCart.textContent = product.stock === 0 ? "Unavailable" : "Add to Cart";
  modalTenure.innerHTML = product.tenures
    .map((tenure) => `<option value="${tenure}">${tenure} months</option>`)
    .join("");

  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProductDetails() {
  selectedProductId = null;
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function addToCart(productId, selectedTenure) {
  const product = products.find((productItem) => productItem.id === productId);
  if (!product || product.stock < 1) {
    showToast("This item is currently out of stock.");
    renderAll();
    return;
  }

  const tenureSelect = document.querySelector(`#tenure-${productId}`);
  const tenure = selectedTenure || Number(tenureSelect.value);
  const alreadyInCart = cart.some((item) => item.productId === productId);

  if (alreadyInCart) {
    showToast("This product is already in your cart.");
    return;
  }

  cart = [...cart, { productId, tenure }];
  save("renteaseCart", cart);
  renderCart();
  showToast("Product added to cart.");
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  save("renteaseCart", cart);
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="muted">Your cart is empty. Add a product from the catalog.</p>`;
    cartTotal.textContent = "₹0";
    return;
  }

  cartItems.innerHTML = cart.map((item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    return `
      <div class="cart-row">
        <div>
          <strong>${product.name}</strong>
          <div class="muted">${item.tenure} months • ₹${product.rent}/month</div>
        </div>
        <button class="remove-button" onclick="removeFromCart('${product.id}')">Remove</button>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    return sum + product.rent;
  }, 0);

  cartTotal.textContent = `₹${total}`;
}

function renderRentals() {
  const visibleRentals = getCustomerRentals();
  const activeRentals = visibleRentals.filter((rental) => rental.status !== "Returned");
  const rentalHistory = visibleRentals.filter((rental) => rental.status === "Returned");

  if (!currentUser) {
    rentalsList.innerHTML = `<p class="muted">Please login to view your rentals.</p>`;
    return;
  }

  if (activeRentals.length === 0 && rentalHistory.length === 0) {
    rentalsList.innerHTML = `<p class="muted">No rentals yet. Place a demo order to see this area update.</p>`;
    return;
  }

  rentalsList.innerHTML = `
    <div class="rental-group">
      <h3>Active rentals</h3>
      ${activeRentals.length === 0
        ? `<p class="muted">No active rentals right now.</p>`
        : activeRentals.map(renderRentalCard).join("")}
    </div>
    <div class="rental-group">
      <h3>Rental history</h3>
      ${rentalHistory.length === 0
        ? `<p class="muted">Returned rentals will appear here.</p>`
        : rentalHistory.map(renderHistoryCard).join("")}
    </div>
  `;
}

async function extendRental(rentalId) {
  try {
    await api(`/rentals/${rentalId}`, { method: "PATCH", body: { action: "extend" } });
    await loadRemoteData();
    renderAll();
    showToast("Rental extended by one month.");
  } catch (error) {
    showToast(error.message);
  }
}

async function schedulePickup(rentalId) {
  const pickupDateInput = document.querySelector(`#pickup-${rentalId}`);
  const pickupDate = pickupDateInput.value;

  if (!pickupDate) {
    showToast("Please choose a pickup date.");
    return;
  }

  try {
    await api(`/rentals/${rentalId}`, { method: "PATCH", body: { action: "schedulePickup", pickupDate } });
    await loadRemoteData();
    renderAll();
    showToast("Pickup scheduled. Admin can now mark it returned.");
  } catch (error) {
    showToast(error.message);
  }
}

async function markReturned(rentalId) {
  if (!isAdmin()) {
    showToast("Admin access is required to return rentals.");
    return;
  }

  try {
    await api(`/rentals/${rentalId}`, { method: "PATCH", body: { action: "return" } });
    await loadRemoteData();
    renderAll();
    showToast("Rental marked as returned.");
  } catch (error) {
    showToast(error.message);
  }
}

async function updateRequestStatus(requestId, status) {
  if (!isAdmin()) {
    showToast("Admin access is required to update requests.");
    return;
  }

  try {
    await api(`/requests/${requestId}`, { method: "PATCH", body: { status } });
    await loadRemoteData();
    renderAll();
    showToast(`Request marked ${status.toLowerCase()}.`);
  } catch (error) {
    showToast(error.message);
  }
}

async function resolveDamageRequest(requestId, outcome) {
  if (!isAdmin()) {
    showToast("Admin access is required to resolve damage reports.");
    return;
  }

  const chargeInput = document.querySelector(`#damageCharge-${requestId}`);
  const charge = Number(chargeInput?.value || 0);

  if (outcome === "Damage Charged" && (!Number.isFinite(charge) || charge <= 0)) {
    showToast("Enter a damage charge greater than zero.");
    return;
  }

  try {
    await api(`/requests/${requestId}`, {
      method: "PATCH",
      body: { status: outcome, damageCharge: outcome === "Damage Charged" ? charge : 0 }
    });
    await loadRemoteData();
    renderAll();
    showToast(outcome === "Damage Charged" ? "Damage charge recorded." : "Damage report closed with no charge.");
  } catch (error) {
    showToast(error.message);
  }
}

function renderRentalCard(rental) {
  const pickupLine = rental.pickupDate
    ? `<p class="muted">Pickup scheduled for ${formatDate(rental.pickupDate)}</p>`
    : "";

  return `
    <article class="rental-card">
      <div>
        <span class="status">${rental.status}</span>
        <h3>${rental.productName}</h3>
        <p class="muted">
          ${rental.customerName} • ${rental.city} • Delivery on ${formatDate(rental.deliveryDate)}
        </p>
        <p>₹${rental.monthlyRent}/month for ${rental.tenure} months</p>
        ${pickupLine}
      </div>
      <div class="rental-actions">
        <button class="button secondary" onclick="extendRental('${rental.id}')">Extend</button>
        <label>
          Pickup date
          <input type="date" id="pickup-${rental.id}" min="${getToday()}" value="${rental.pickupDate || ""}" />
        </label>
        <button class="button primary" onclick="schedulePickup('${rental.id}')">Schedule Pickup</button>
      </div>
    </article>
  `;
}

function renderHistoryCard(rental) {
  return `
    <article class="rental-card history-card">
      <div>
        <span class="status">${rental.status}</span>
        <h3>${rental.productName}</h3>
        <p class="muted">
          Delivered ${formatDate(rental.deliveryDate)} • Returned ${formatDate(rental.returnedDate)}
        </p>
        <p>Final tenure: ${rental.tenure} months • ₹${rental.monthlyRent}/month</p>
      </div>
    </article>
  `;
}

function renderMaintenanceOptions() {
  const visibleRentals = getCustomerRentals().filter((rental) => rental.status !== "Returned");

  if (!currentUser) {
    maintenanceItem.innerHTML = `<option value="">Login required</option>`;
    return;
  }

  if (visibleRentals.length === 0) {
    maintenanceItem.innerHTML = `<option value="">No active rentals</option>`;
    return;
  }

  maintenanceItem.innerHTML = `
    <option value="">Choose rental item</option>
    ${visibleRentals.map((rental) => `<option value="${rental.id}">${rental.productName}</option>`).join("")}
  `;
}

function renderRequests() {
  const visibleRequests = currentUser
    ? requests.filter((request) => request.userId === currentUser.id)
    : [];

  if (!currentUser) {
    requestList.innerHTML = `<p class="muted">Please login to view support requests.</p>`;
    return;
  }

  if (visibleRequests.length === 0) {
    requestList.innerHTML = `<p class="muted">No maintenance requests yet.</p>`;
    return;
  }

  requestList.innerHTML = visibleRequests.map((request) => `
    <div class="request-row">
      <strong>${request.type}</strong>
      <p class="muted">${request.productName} • ${request.createdAt} • ${request.status}</p>
      <p>${request.description}</p>
      ${request.status === "Damage Charged" ? `<p class="damage-charge">Damage charge: ₹${request.damageCharge}</p>` : ""}
    </div>
  `).join("");
}

function renderAdmin() {
  const hasAdminAccess = isAdmin();
  adminGrid.hidden = !hasAdminAccess;
  adminAccessMessage.hidden = hasAdminAccess;

  if (!hasAdminAccess) return;

  inventoryTable.innerHTML = products.map((product) => {
    const activeCount = rentals.filter((rental) => {
      return rental.productId === product.id && rental.status !== "Returned";
    }).length;
    return `
      <div class="table-row">
        <strong>${product.name}</strong>
        <div class="inventory-actions">
          <button class="button outline compact-button" onclick="editProduct('${product.id}')">Edit</button>
          <button class="remove-button" onclick="deleteProduct('${product.id}')">Remove</button>
        </div>
        <small>${product.category} • Stock ${product.stock} • Active ${activeCount}</small>
      </div>
    `;
  }).join("");

  adminRentals.innerHTML = rentals.length === 0
    ? `<p class="muted">No active rentals yet.</p>`
    : rentals.map((rental) => `
        <div class="table-row">
          <strong>${rental.productName}</strong>
          <small>
            ${rental.customerName} • ${rental.city} • ${rental.status} • ₹${rental.monthlyRent}/month
            ${rental.pickupDate ? `• Pickup ${formatDate(rental.pickupDate)}` : ""}
          </small>
          ${rental.status === "Pickup Scheduled"
            ? `<button class="button primary compact-button" onclick="markReturned('${rental.id}')">Mark Returned</button>`
            : ""}
        </div>
      `).join("");

  adminRequests.innerHTML = requests.length === 0
    ? `<p class="muted">No open requests.</p>`
    : requests.map(renderAdminRequest).join("");
  adminUsers.innerHTML = users.length === 0
    ? `<p class="muted">No registered users yet.</p>`
    : users.map((user) => {
      const rentalCount = rentals.filter((rental) => rental.userId === user.id).length;
      return `<div class="table-row"><strong>${user.name}</strong><small>${user.email} &bull; ${user.role} &bull; ${rentalCount} rental${rentalCount === 1 ? "" : "s"}</small></div>`;
    }).join("");

  serviceAreasList.innerHTML = serviceAreas.map((area) => `
    <div class="area-row"><span>${area.name}</span><button class="remove-button" onclick="removeServiceArea('${area.id}')">Remove</button></div>
  `).join("") || `<p class="muted">No service areas configured.</p>`;

  adminAnalytics.innerHTML = analytics ? `
    <article><strong>${analytics.retentionRate}%</strong><span>Customer retention</span></article>
    <article><strong>${analytics.averageResolutionHours}h</strong><span>Avg. resolution time</span></article>
    <article><strong>${analytics.activeRentals}</strong><span>Active rentals</span></article>
    <article><strong>₹${analytics.mrr}</strong><span>Monthly recurring revenue</span></article>
  ` : `<p class="muted">Analytics will appear after data is available.</p>`;

  /* requests.map((request) => `
        <div class="table-row">
          <strong>${request.type}</strong>
          <small>${request.productName} • ${request.status}</small>
        </div>
      `).join(""); */
}

async function removeServiceArea(areaId) {
  if (!isAdmin()) return;
  try {
    await api(`/areas/${areaId}`, { method: "DELETE" });
    await loadRemoteData();
    renderAll();
    showToast("Service area removed.");
  } catch (error) {
    showToast(error.message);
  }
}

function renderAdminRequest(request) {
  const customer = users.find((user) => user.id === request.userId);
  const customerName = customer ? customer.name : "Customer";
  const isDamageReport = request.type === "Damage report";
  const action = isDamageReport
    ? renderDamageActions(request)
    : request.status === "Open"
    ? `<button class="button secondary compact-button" onclick="updateRequestStatus('${request.id}', 'In Progress')">Start Work</button>`
    : request.status === "In Progress"
      ? `<button class="button primary compact-button" onclick="updateRequestStatus('${request.id}', 'Resolved')">Mark Resolved</button>`
      : `<button class="button outline compact-button" onclick="updateRequestStatus('${request.id}', 'Open')">Reopen</button>`;

  return `
    <div class="table-row">
      <div class="request-admin-summary">
        <strong>${request.type}</strong>
        <span class="request-status status-${request.status.toLowerCase().replace(/\s+/g, "-")}">${request.status}</span>
      </div>
      <small>${request.productName} &bull; ${customerName} &bull; Submitted ${request.createdAt}</small>
      <p class="request-description">${request.description}</p>
      ${request.updatedAt ? `<small>Last updated ${request.updatedAt}</small>` : ""}
      <div class="request-actions">${action}</div>
    </div>
  `;
}

function renderDamageActions(request) {
  if (request.status === "Open") {
    return `<button class="button secondary compact-button" onclick="updateRequestStatus('${request.id}', 'Under Review')">Start Assessment</button>`;
  }

  if (request.status === "Under Review") {
    return `
      <label class="damage-charge-input">
        Damage charge (₹)
        <input type="number" id="damageCharge-${request.id}" min="1" placeholder="Example: 500" />
      </label>
      <button class="button primary compact-button" onclick="resolveDamageRequest('${request.id}', 'Damage Charged')">Confirm Damage</button>
      <button class="button outline compact-button" onclick="resolveDamageRequest('${request.id}', 'No Damage Found')">No Damage Found</button>
    `;
  }

  return `<button class="button outline compact-button" onclick="updateRequestStatus('${request.id}', 'Open')">Reopen</button>`;
}

function renderMetrics() {
  const activeRentals = rentals.filter((rental) => rental.status !== "Returned");
  const monthlyRevenue = activeRentals.reduce((sum, rental) => sum + rental.monthlyRent, 0);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const utilization = totalStock === 0 ? 0 : Math.round((activeRentals.length / totalStock) * 100);

  document.querySelector("#activeRentalCount").textContent = activeRentals.length;
  document.querySelector("#mrrValue").textContent = `₹${monthlyRevenue}`;
  document.querySelector("#utilizationValue").textContent = `${utilization}%`;
}

function getCustomerRentals() {
  if (!currentUser) return [];
  return rentals.filter((rental) => rental.userId === currentUser.id);
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function formatDate(dateString) {
  if (!dateString) return "not scheduled";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

initializeApp();
