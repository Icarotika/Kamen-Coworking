/* ========================================
   CoWork Manager - JavaScript Logic
   ======================================== */

// ========================================
// Data Store (Simulated Database)
// ========================================

const store = {
  users: [
    { id: "MGR-001", name: "Carlos Gerente", role: "manager" },
    { id: "USR-001", name: "Maria Silva", role: "user" },
    { id: "USR-002", name: "João Santos", role: "user" },
  ],

  spaces: [
    {
      id: "SPC-001",
      name: "Sala de Reunião A",
      capacity: 8,
      pricePerHour: 20,
      description: "Sala equipada com TV e quadro branco",
      occupied: false,
    },
    {
      id: "SPC-002",
      name: "Sala de Reunião B",
      capacity: 12,
      pricePerHour: 30,
      description: "Sala ampla com videoconferência",
      occupied: false,
    },
    {
      id: "SPC-003",
      name: "Escritório Individual",
      capacity: 1,
      pricePerHour: 15,
      description: "Estação de trabalho privativa",
      occupied: true,
    },
    {
      id: "SPC-004",
      name: "Sala de Treinamento",
      capacity: 20,
      pricePerHour: 50,
      description: "Sala para eventos e workshops",
      occupied: false,
    },
    {
      id: "SPC-005",
      name: "Cabine Telefônica",
      capacity: 1,
      pricePerHour: 10,
      description: "Cabine acústica para chamadas",
      occupied: true,
    },
  ],

  resources: [
    { id: "RES-001", name: "Projetor HD", total: 5, available: 3 },
    { id: "RES-002", name: "Webcam Logitech", total: 8, available: 5 },
    { id: "RES-003", name: "Notebook Dell", total: 10, available: 7 },
    { id: "RES-004", name: "Monitor Extra", total: 6, available: 4 },
    { id: "RES-005", name: "Headset USB", total: 15, available: 12 },
  ],

  requests: [],

  history: [
    {
      id: "HIS-001",
      userId: "USR-001",
      userName: "Maria Silva",
      spaceId: "SPC-001",
      spaceName: "Sala de Reunião A",
      duration: 120,
      price: 40,
      date: "2025-04-01",
      status: "completed",
    },
    {
      id: "HIS-002",
      userId: "USR-002",
      userName: "João Santos",
      spaceId: "SPC-003",
      spaceName: "Escritório Individual",
      duration: 240,
      price: 60,
      date: "2025-04-02",
      status: "completed",
    },
  ],

  currentUser: null,
};

// Counters for ID generation
let requestCounter = 1;
let historyCounter = 3;
let userCounter = 3;
let spaceCounter = 6;
let resourceCounter = 6;

// ========================================
// Utility Functions
// ========================================

function generateId(prefix) {
  const counters = {
    REQ: () => requestCounter++,
    HIS: () => historyCounter++,
    USR: () => userCounter++,
    SPC: () => spaceCounter++,
    RES: () => resourceCounter++,
  };
  const num = counters[prefix]();
  return `${prefix}-${String(num).padStart(3, "0")}`;
}

function calculatePrice(durationMinutes, pricePerHour) {
  return (durationMinutes / 60) * pricePerHour;
}

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

// Toast notification
function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toast.className = `toast ${type}`;
  toastMessage.textContent = message;

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// ========================================
// Screen Management
// ========================================

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

function showTab(tabId, navContainer) {
  // Hide all tab contents in the current dashboard
  const dashboard = navContainer.closest(".screen");
  dashboard.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all nav buttons
  navContainer.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab and activate button
  document.getElementById(`tab-${tabId}`).classList.add("active");
  navContainer.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
}

// ========================================
// Authentication
// ========================================

function loginAsManager() {
  store.currentUser = store.users.find((u) => u.role === "manager");
  document.getElementById("manager-name").textContent = store.currentUser.name;
  showScreen("manager-dashboard");
  renderManagerDashboard();
}

function loginAsUser() {
  // Create a new user or use existing
  const newUserId = generateId("USR");
  const newUser = {
    id: newUserId,
    name: `Usuário ${newUserId}`,
    role: "user",
  };
  store.users.push(newUser);
  store.currentUser = newUser;

  document.getElementById("user-name").textContent = store.currentUser.name;
  document.getElementById("user-id-badge").textContent = store.currentUser.id;
  showScreen("user-dashboard");
  renderUserDashboard();
}

function logout() {
  store.currentUser = null;
  showScreen("login-screen");
}

// ========================================
// Manager Dashboard Rendering
// ========================================

function renderManagerDashboard() {
  renderRequests();
  renderHistory();
  renderSpaces();
  renderResources();
  renderOccupancy();
  populateServiceSelects();
}

function renderRequests() {
  const container = document.getElementById("requests-list");
  const pendingRequests = store.requests.filter(
    (r) => r.status === "pending" || r.status === "extension-pending",
  );

  document.getElementById("pending-count").textContent = pendingRequests.length;

  if (pendingRequests.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Nenhuma solicitação pendente</p>';
    return;
  }

  container.innerHTML = pendingRequests
    .map(
      (request) => `
    <div class="request-card" data-id="${request.id}">
      <div class="request-card-header">
        <h4>${request.spaceName}</h4>
        <span class="status-badge ${request.status === "extension-pending" ? "status-extension" : "status-pending"}">
          ${request.status === "extension-pending" ? "Extensão Solicitada" : "Pendente"}
        </span>
      </div>
      <div class="request-card-body">
        <div class="request-detail">
          <span class="request-detail-label">Solicitante:</span>
          <span class="request-detail-value">${request.userName} (${request.userId})</span>
        </div>
        <div class="request-detail">
          <span class="request-detail-label">Duração:</span>
          <span class="request-detail-value">${request.duration} minutos</span>
        </div>
        <div class="request-detail">
          <span class="request-detail-label">Valor:</span>
          <span class="request-detail-value">${formatCurrency(request.price)}</span>
        </div>
        ${
          request.notes
            ? `
        <div class="request-detail">
          <span class="request-detail-label">Observações:</span>
          <span class="request-detail-value">${request.notes}</span>
        </div>
        `
            : ""
        }
        ${
          request.extensionDuration
            ? `
        <div class="request-detail">
          <span class="request-detail-label">Extensão:</span>
          <span class="request-detail-value">+${request.extensionDuration} min (${formatCurrency(request.extensionPrice)})</span>
        </div>
        `
            : ""
        }
      </div>
      <div class="request-card-footer">
        <button class="btn btn-success btn-small" onclick="approveRequest('${request.id}')">Aprovar</button>
        <button class="btn btn-danger btn-small" onclick="denyRequest('${request.id}')">Recusar</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderHistory() {
  const tbody = document.getElementById("history-table-body");

  if (store.history.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="6">Nenhum registro encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = store.history
    .map(
      (entry) => `
    <tr data-id="${entry.id}">
      <td>${formatDate(entry.date)}</td>
      <td>${entry.userName}</td>
      <td>${entry.spaceName}</td>
      <td>${entry.duration} min</td>
      <td>${formatCurrency(entry.price)}</td>
      <td class="table-actions">
        <button class="btn btn-outline btn-small" onclick="openEditHistoryModal('${entry.id}')">Editar</button>
        <button class="btn btn-danger btn-small" onclick="deleteHistory('${entry.id}')">Excluir</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function renderSpaces() {
  const container = document.getElementById("spaces-list");

  if (store.spaces.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum espaço cadastrado</p>';
    return;
  }

  container.innerHTML = store.spaces
    .map(
      (space) => `
    <div class="space-card" data-id="${space.id}">
      <div class="space-card-header">
        <h4>${space.name}</h4>
        <span class="status-badge ${space.occupied ? "status-denied" : "status-approved"}">
          ${space.occupied ? "Ocupado" : "Disponível"}
        </span>
      </div>
      <p>${space.description || "Sem descrição"}</p>
      <div class="space-card-info">
        <span>Capacidade: ${space.capacity}</span>
        <span>${formatCurrency(space.pricePerHour)}/hora</span>
      </div>
      <div class="space-card-actions">
        <button class="btn btn-outline btn-small" onclick="editSpace('${space.id}')">Editar</button>
        <button class="btn btn-danger btn-small" onclick="deleteSpace('${space.id}')">Excluir</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderResources() {
  const container = document.getElementById("resources-list");

  if (store.resources.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Nenhum recurso cadastrado</p>';
    return;
  }

  container.innerHTML = store.resources
    .map(
      (resource) => `
    <div class="resource-card" data-id="${resource.id}">
      <div class="resource-card-header">
        <h4>${resource.name}</h4>
      </div>
      <div class="resource-card-info">
        <span>Total: ${resource.total}</span>
        <span>Disponível: ${resource.available}</span>
      </div>
      <div class="resource-card-actions">
        <button class="btn btn-outline btn-small" onclick="editResource('${resource.id}')">Editar</button>
        <button class="btn btn-danger btn-small" onclick="deleteResource('${resource.id}')">Excluir</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderOccupancy() {
  const totalSpaces = store.spaces.length;
  const occupiedSpaces = store.spaces.filter((s) => s.occupied).length;
  const availableSpaces = totalSpaces - occupiedSpaces;
  const occupancyRate =
    totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

  document.getElementById("total-spaces").textContent = totalSpaces;
  document.getElementById("occupied-spaces").textContent = occupiedSpaces;
  document.getElementById("available-spaces").textContent = availableSpaces;
  document.getElementById("occupancy-rate").textContent = `${occupancyRate}%`;

  const detailsContainer = document.getElementById("occupancy-details");
  detailsContainer.innerHTML = store.spaces
    .map(
      (space) => `
    <div class="occupancy-item">
      <div class="occupancy-item-info">
        <h4>${space.name}</h4>
        <p>Capacidade: ${space.capacity} pessoas</p>
      </div>
      <span class="occupancy-status ${space.occupied ? "occupancy-occupied" : "occupancy-available"}">
        ${space.occupied ? "Ocupado" : "Disponível"}
      </span>
    </div>
  `,
    )
    .join("");
}

// ========================================
// Manager Actions
// ========================================

function approveRequest(requestId) {
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return;

  // Calculate total price including extension
  let totalPrice = request.price;
  let totalDuration = request.duration;

  if (request.extensionDuration) {
    totalPrice += request.extensionPrice;
    totalDuration += request.extensionDuration;
  }

  // Add to history
  const historyEntry = {
    id: generateId("HIS"),
    userId: request.userId,
    userName: request.userName,
    spaceId: request.spaceId,
    spaceName: request.spaceName,
    duration: totalDuration,
    price: totalPrice,
    date: getCurrentDate(),
    status: "completed",
  };
  store.history.push(historyEntry);

  // Mark space as occupied
  const space = store.spaces.find((s) => s.id === request.spaceId);
  if (space) space.occupied = true;

  // Update request status
  request.status = "approved";

  renderManagerDashboard();
  showToast("Solicitação aprovada com sucesso!", "success");
}

function denyRequest(requestId) {
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return;

  request.status = "denied";
  renderRequests();
  showToast("Solicitação recusada.", "error");
}

// Manual History Entry
function showManualHistoryForm() {
  document.getElementById("manual-history-form").classList.remove("hidden");
  document.getElementById("history-form").reset();
  document.getElementById("history-price").value = "";
}

function hideManualHistoryForm() {
  document.getElementById("manual-history-form").classList.add("hidden");
}

function submitManualHistory(e) {
  e.preventDefault();

  const userName = document.getElementById("history-user").value;
  const spaceId = document.getElementById("history-service").value;
  const duration = parseInt(document.getElementById("history-duration").value);

  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return;

  const price = calculatePrice(duration, space.pricePerHour);

  const entry = {
    id: generateId("HIS"),
    userId: "MANUAL",
    userName: userName,
    spaceId: spaceId,
    spaceName: space.name,
    duration: duration,
    price: price,
    date: getCurrentDate(),
    status: "completed",
  };

  store.history.push(entry);
  hideManualHistoryForm();
  renderHistory();
  showToast("Registro adicionado com sucesso!", "success");
}

// Edit History Modal
function openEditHistoryModal(historyId) {
  const entry = store.history.find((h) => h.id === historyId);
  if (!entry) return;

  document.getElementById("edit-history-id").value = entry.id;
  document.getElementById("edit-history-user").value = entry.userName;
  document.getElementById("edit-history-duration").value = entry.duration;

  // Populate service select
  const select = document.getElementById("edit-history-service");
  select.innerHTML = store.spaces
    .map(
      (s) =>
        `<option value="${s.id}" ${s.id === entry.spaceId ? "selected" : ""}>${s.name}</option>`,
    )
    .join("");

  updateEditHistoryPrice();
  document.getElementById("edit-history-modal").classList.remove("hidden");
}

function closeEditHistoryModal() {
  document.getElementById("edit-history-modal").classList.add("hidden");
}

function updateEditHistoryPrice() {
  const spaceId = document.getElementById("edit-history-service").value;
  const duration =
    parseInt(document.getElementById("edit-history-duration").value) || 0;
  const space = store.spaces.find((s) => s.id === spaceId);

  if (space && duration > 0) {
    const price = calculatePrice(duration, space.pricePerHour);
    document.getElementById("edit-history-price").value = formatCurrency(price);
  }
}

function submitEditHistory(e) {
  e.preventDefault();

  const historyId = document.getElementById("edit-history-id").value;
  const entry = store.history.find((h) => h.id === historyId);
  if (!entry) return;

  const spaceId = document.getElementById("edit-history-service").value;
  const space = store.spaces.find((s) => s.id === spaceId);
  const duration = parseInt(
    document.getElementById("edit-history-duration").value,
  );

  entry.userName = document.getElementById("edit-history-user").value;
  entry.spaceId = spaceId;
  entry.spaceName = space.name;
  entry.duration = duration;
  entry.price = calculatePrice(duration, space.pricePerHour);

  closeEditHistoryModal();
  renderHistory();
  showToast("Registro atualizado com sucesso!", "success");
}

function deleteHistory(historyId) {
  if (!confirm("Tem certeza que deseja excluir este registro?")) return;

  store.history = store.history.filter((h) => h.id !== historyId);
  renderHistory();
  showToast("Registro excluído.", "error");
}

// Space Management
function showSpaceForm(isEdit = false) {
  document.getElementById("space-form-container").classList.remove("hidden");
  document.getElementById("space-form-title").textContent = isEdit
    ? "Editar Espaço"
    : "Adicionar Espaço";

  if (!isEdit) {
    document.getElementById("space-form").reset();
    document.getElementById("space-id").value = "";
  }
}

function hideSpaceForm() {
  document.getElementById("space-form-container").classList.add("hidden");
}

function editSpace(spaceId) {
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return;

  document.getElementById("space-id").value = space.id;
  document.getElementById("space-name").value = space.name;
  document.getElementById("space-capacity").value = space.capacity;
  document.getElementById("space-price").value = space.pricePerHour;
  document.getElementById("space-description").value = space.description || "";

  showSpaceForm(true);
}

function submitSpace(e) {
  e.preventDefault();

  const spaceId = document.getElementById("space-id").value;
  const spaceData = {
    name: document.getElementById("space-name").value,
    capacity: parseInt(document.getElementById("space-capacity").value),
    pricePerHour: parseFloat(document.getElementById("space-price").value),
    description: document.getElementById("space-description").value,
  };

  if (spaceId) {
    // Update existing
    const space = store.spaces.find((s) => s.id === spaceId);
    Object.assign(space, spaceData);
    showToast("Espaço atualizado com sucesso!", "success");
  } else {
    // Add new
    const newSpace = {
      id: generateId("SPC"),
      ...spaceData,
      occupied: false,
    };
    store.spaces.push(newSpace);
    showToast("Espaço adicionado com sucesso!", "success");
  }

  hideSpaceForm();
  renderSpaces();
  renderOccupancy();
  populateServiceSelects();
}

function deleteSpace(spaceId) {
  if (!confirm("Tem certeza que deseja excluir este espaço?")) return;

  store.spaces = store.spaces.filter((s) => s.id !== spaceId);
  renderSpaces();
  renderOccupancy();
  populateServiceSelects();
  showToast("Espaço excluído.", "error");
}

// Resource Management
function showResourceForm(isEdit = false) {
  document.getElementById("resource-form-container").classList.remove("hidden");
  document.getElementById("resource-form-title").textContent = isEdit
    ? "Editar Recurso"
    : "Adicionar Recurso";

  if (!isEdit) {
    document.getElementById("resource-form").reset();
    document.getElementById("resource-id").value = "";
  }
}

function hideResourceForm() {
  document.getElementById("resource-form-container").classList.add("hidden");
}

function editResource(resourceId) {
  const resource = store.resources.find((r) => r.id === resourceId);
  if (!resource) return;

  document.getElementById("resource-id").value = resource.id;
  document.getElementById("resource-name").value = resource.name;
  document.getElementById("resource-quantity").value = resource.total;
  document.getElementById("resource-available").value = resource.available;

  showResourceForm(true);
}

function submitResource(e) {
  e.preventDefault();

  const resourceId = document.getElementById("resource-id").value;
  const resourceData = {
    name: document.getElementById("resource-name").value,
    total: parseInt(document.getElementById("resource-quantity").value),
    available: parseInt(document.getElementById("resource-available").value),
  };

  if (resourceId) {
    // Update existing
    const resource = store.resources.find((r) => r.id === resourceId);
    Object.assign(resource, resourceData);
    showToast("Recurso atualizado com sucesso!", "success");
  } else {
    // Add new
    const newResource = {
      id: generateId("RES"),
      ...resourceData,
    };
    store.resources.push(newResource);
    showToast("Recurso adicionado com sucesso!", "success");
  }

  hideResourceForm();
  renderResources();
}

function deleteResource(resourceId) {
  if (!confirm("Tem certeza que deseja excluir este recurso?")) return;

  store.resources = store.resources.filter((r) => r.id !== resourceId);
  renderResources();
  showToast("Recurso excluído.", "error");
}

// ========================================
// User Dashboard Rendering
// ========================================

function renderUserDashboard() {
  renderAvailableServices();
  renderMyRequests();
  populateUserServiceSelect();
}

function renderAvailableServices() {
  const container = document.getElementById("available-services-list");
  const availableSpaces = store.spaces.filter((s) => !s.occupied);

  if (availableSpaces.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Nenhum espaço disponível no momento</p>';
    return;
  }

  container.innerHTML = availableSpaces
    .map(
      (space) => `
    <div class="service-card" data-id="${space.id}" onclick="selectService('${space.id}')">
      <h4>${space.name}</h4>
      <p>${space.description || "Sem descrição"}</p>
      <div class="price">${formatCurrency(space.pricePerHour)}/hora</div>
      <div class="capacity">Capacidade: ${space.capacity} pessoas</div>
    </div>
  `,
    )
    .join("");
}

function selectService(spaceId) {
  // Remove selected class from all cards
  document.querySelectorAll(".service-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selected class to clicked card
  const selectedCard = document.querySelector(
    `.service-card[data-id="${spaceId}"]`,
  );
  if (selectedCard) {
    selectedCard.classList.add("selected");
  }

  // Update select dropdown
  document.getElementById("selected-service").value = spaceId;

  // Update price
  updateCalculatedPrice();
}

function populateUserServiceSelect() {
  const select = document.getElementById("selected-service");
  const availableSpaces = store.spaces.filter((s) => !s.occupied);

  select.innerHTML =
    '<option value="">Selecione um serviço...</option>' +
    availableSpaces
      .map(
        (s) =>
          `<option value="${s.id}">${s.name} - ${formatCurrency(s.pricePerHour)}/hora</option>`,
      )
      .join("");
}

function populateServiceSelects() {
  // For manager manual history form
  const historySelect = document.getElementById("history-service");
  historySelect.innerHTML = store.spaces
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");
}

function updateCalculatedPrice() {
  const spaceId = document.getElementById("selected-service").value;
  const duration =
    parseInt(document.getElementById("request-duration").value) || 0;
  const space = store.spaces.find((s) => s.id === spaceId);

  if (space && duration > 0) {
    const price = calculatePrice(duration, space.pricePerHour);
    document.getElementById("calculated-price").textContent =
      formatCurrency(price);
  } else {
    document.getElementById("calculated-price").textContent = "R$ 0,00";
  }
}

function renderMyRequests() {
  const container = document.getElementById("my-requests-list");
  const myRequests = store.requests.filter(
    (r) => r.userId === store.currentUser?.id,
  );

  if (myRequests.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Você ainda não fez nenhuma solicitação</p>';
    return;
  }

  container.innerHTML = myRequests
    .map((request) => {
      const statusClass = {
        pending: "status-pending",
        approved: "status-approved",
        denied: "status-denied",
        "extension-pending": "status-extension",
      }[request.status];

      const statusText = {
        pending: "Pendente",
        approved: "Aprovado",
        denied: "Recusado",
        "extension-pending": "Extensão Pendente",
      }[request.status];

      return `
      <div class="request-card" data-id="${request.id}">
        <div class="request-card-header">
          <h4>${request.spaceName}</h4>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="request-card-body">
          <div class="request-detail">
            <span class="request-detail-label">Duração:</span>
            <span class="request-detail-value">${request.duration} minutos</span>
          </div>
          <div class="request-detail">
            <span class="request-detail-label">Valor:</span>
            <span class="request-detail-value">${formatCurrency(request.price)}</span>
          </div>
          ${
            request.extensionDuration
              ? `
          <div class="request-detail">
            <span class="request-detail-label">Extensão:</span>
            <span class="request-detail-value">+${request.extensionDuration} min (${formatCurrency(request.extensionPrice)})</span>
          </div>
          `
              : ""
          }
        </div>
        ${
          request.status === "approved" && !request.extensionDuration
            ? `
        <div class="request-card-footer">
          <button class="btn btn-primary btn-small btn-block" onclick="openExtensionModal('${request.id}')">Solicitar Extensão</button>
        </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
}

// ========================================
// User Actions
// ========================================

function submitServiceRequest(e) {
  e.preventDefault();

  const spaceId = document.getElementById("selected-service").value;
  const duration = parseInt(document.getElementById("request-duration").value);
  const notes = document.getElementById("request-notes").value;

  if (!spaceId) {
    showToast("Por favor, selecione um serviço.", "error");
    return;
  }

  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return;

  const price = calculatePrice(duration, space.pricePerHour);

  const request = {
    id: generateId("REQ"),
    userId: store.currentUser.id,
    userName: store.currentUser.name,
    spaceId: spaceId,
    spaceName: space.name,
    duration: duration,
    price: price,
    pricePerHour: space.pricePerHour,
    notes: notes,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  store.requests.push(request);

  // Reset form
  document.getElementById("service-request-form").reset();
  document.getElementById("request-duration").value = 60;
  document
    .querySelectorAll(".service-card")
    .forEach((card) => card.classList.remove("selected"));
  updateCalculatedPrice();

  renderMyRequests();
  showToast("Solicitação enviada com sucesso!", "success");
}

// Extension Request
function openExtensionModal(requestId) {
  document.getElementById("extension-request-id").value = requestId;
  document.getElementById("extension-duration").value = 30;
  updateExtensionPrice(requestId);
  document.getElementById("extension-modal").classList.remove("hidden");
}

function closeExtensionModal() {
  document.getElementById("extension-modal").classList.add("hidden");
}

function updateExtensionPrice(requestId) {
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return;

  const duration =
    parseInt(document.getElementById("extension-duration").value) || 0;
  const price = calculatePrice(duration, request.pricePerHour);
  document.getElementById("extension-price").textContent =
    formatCurrency(price);
}

function submitExtension(e) {
  e.preventDefault();

  const requestId = document.getElementById("extension-request-id").value;
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return;

  const extensionDuration = parseInt(
    document.getElementById("extension-duration").value,
  );
  const extensionPrice = calculatePrice(
    extensionDuration,
    request.pricePerHour,
  );

  request.extensionDuration = extensionDuration;
  request.extensionPrice = extensionPrice;
  request.status = "extension-pending";

  closeExtensionModal();
  renderMyRequests();
  showToast("Solicitação de extensão enviada!", "success");
}

// ========================================
// Event Listeners
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // Login buttons
  document
    .getElementById("login-manager")
    .addEventListener("click", loginAsManager);
  document.getElementById("login-user").addEventListener("click", loginAsUser);

  // Logout buttons
  document.getElementById("logout-manager").addEventListener("click", logout);
  document.getElementById("logout-user").addEventListener("click", logout);

  // Navigation tabs - Manager
  document
    .querySelector("#manager-dashboard .dashboard-nav")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("nav-btn")) {
        showTab(e.target.dataset.tab, this);
      }
    });

  // Navigation tabs - User
  document
    .querySelector("#user-dashboard .dashboard-nav")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("nav-btn")) {
        showTab(e.target.dataset.tab, this);
      }
    });

  // Manual History Form
  document
    .getElementById("add-history-btn")
    .addEventListener("click", showManualHistoryForm);
  document
    .getElementById("cancel-history")
    .addEventListener("click", hideManualHistoryForm);
  document
    .getElementById("history-form")
    .addEventListener("submit", submitManualHistory);

  // History duration change - update price
  document
    .getElementById("history-duration")
    .addEventListener("input", function () {
      const spaceId = document.getElementById("history-service").value;
      const duration = parseInt(this.value) || 0;
      const space = store.spaces.find((s) => s.id === spaceId);

      if (space && duration > 0) {
        const price = calculatePrice(duration, space.pricePerHour);
        document.getElementById("history-price").value = formatCurrency(price);
      }
    });

  document
    .getElementById("history-service")
    .addEventListener("change", function () {
      const duration =
        parseInt(document.getElementById("history-duration").value) || 0;
      const space = store.spaces.find((s) => s.id === this.value);

      if (space && duration > 0) {
        const price = calculatePrice(duration, space.pricePerHour);
        document.getElementById("history-price").value = formatCurrency(price);
      }
    });

  // Edit History Modal
  document
    .getElementById("close-edit-history-modal")
    .addEventListener("click", closeEditHistoryModal);
  document
    .getElementById("cancel-edit-history")
    .addEventListener("click", closeEditHistoryModal);
  document
    .getElementById("edit-history-form")
    .addEventListener("submit", submitEditHistory);
  document
    .getElementById("edit-history-duration")
    .addEventListener("input", updateEditHistoryPrice);
  document
    .getElementById("edit-history-service")
    .addEventListener("change", updateEditHistoryPrice);

  // Space Form
  document
    .getElementById("add-space-btn")
    .addEventListener("click", () => showSpaceForm(false));
  document
    .getElementById("cancel-space")
    .addEventListener("click", hideSpaceForm);
  document.getElementById("space-form").addEventListener("submit", submitSpace);

  // Resource Form
  document
    .getElementById("add-resource-btn")
    .addEventListener("click", () => showResourceForm(false));
  document
    .getElementById("cancel-resource")
    .addEventListener("click", hideResourceForm);
  document
    .getElementById("resource-form")
    .addEventListener("submit", submitResource);

  // User Service Request
  document
    .getElementById("service-request-form")
    .addEventListener("submit", submitServiceRequest);
  document
    .getElementById("selected-service")
    .addEventListener("change", function () {
      // Update visual selection on cards
      document.querySelectorAll(".service-card").forEach((card) => {
        card.classList.remove("selected");
        if (card.dataset.id === this.value) {
          card.classList.add("selected");
        }
      });
      updateCalculatedPrice();
    });
  document
    .getElementById("request-duration")
    .addEventListener("input", updateCalculatedPrice);

  // Extension Modal
  document
    .getElementById("close-extension-modal")
    .addEventListener("click", closeExtensionModal);
  document
    .getElementById("cancel-extension")
    .addEventListener("click", closeExtensionModal);
  document
    .getElementById("extension-form")
    .addEventListener("submit", submitExtension);
  document
    .getElementById("extension-duration")
    .addEventListener("input", function () {
      const requestId = document.getElementById("extension-request-id").value;
      updateExtensionPrice(requestId);
    });

  // Close modals on backdrop click
  document
    .getElementById("extension-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeExtensionModal();
    });
  document
    .getElementById("edit-history-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeEditHistoryModal();
    });
});
