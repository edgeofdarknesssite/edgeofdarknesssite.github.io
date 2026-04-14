const config = window.APP_CONFIG || {};
const authDomain = config.AUTH_USERNAME_DOMAIN || 'admin.local';
const bucketName = config.STORAGE_BUCKET || 'item-images';
const connectionTimeoutMs = 9000;

const els = {
  loadingScreen: document.getElementById('loadingScreen'),
  loadingBar: document.getElementById('loadingBar'),
  loadingPercent: document.getElementById('loadingPercent'),
  loginScreen: document.getElementById('loginScreen'),
  dashboardScreen: document.getElementById('dashboardScreen'),
  loginForm: document.getElementById('loginForm'),
  loginInput: document.getElementById('loginInput'),
  passwordInput: document.getElementById('passwordInput'),
  togglePasswordBtn: document.getElementById('togglePasswordBtn'),
  loginMessage: document.getElementById('loginMessage'),
  logoutBtn: document.getElementById('logoutBtn'),
  searchInput: document.getElementById('searchInput'),
  categoryTabs: document.getElementById('categoryTabs'),
  categoriesContainer: document.getElementById('categoriesContainer'),
  statsCategories: document.getElementById('statsCategories'),
  statsItems: document.getElementById('statsItems'),
  statsFiltered: document.getElementById('statsFiltered'),
  openCategoryModalBtn: document.getElementById('openCategoryModalBtn'),
  openItemModalBtn: document.getElementById('openItemModalBtn'),
  openConnectionModalBtn: document.getElementById('openConnectionModalBtn'),
  openTableModalBtn: document.getElementById('openTableModalBtn'),
  categoryForm: document.getElementById('categoryForm'),
  categoryName: document.getElementById('categoryName'),
  categoryColor: document.getElementById('categoryColor'),
  createItemModal: document.getElementById('createItemModal'),
  itemForm: document.getElementById('itemForm'),
  itemCategory: document.getElementById('itemCategory'),
  itemTitle: document.getElementById('itemTitle'),
  itemClassname: document.getElementById('itemClassname'),
  itemPrice: document.getElementById('itemPrice'),
  itemImageFile: document.getElementById('itemImageFile'),
  itemImageUrl: document.getElementById('itemImageUrl'),
  uploadZone: document.getElementById('uploadZone'),
  imagePreview: document.getElementById('imagePreview'),
  previewImage: document.getElementById('previewImage'),
  previewName: document.getElementById('previewName'),
  removePreviewBtn: document.getElementById('removePreviewBtn'),
  itemModal: document.getElementById('itemModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalImage: document.getElementById('modalImage'),
  modalTitle: document.getElementById('modalTitle'),
  modalClassname: document.getElementById('modalClassname'),
  modalCopyBtn: document.getElementById('modalCopyBtn'),
  modalPriceBox: document.getElementById('modalPriceBox'),
  modalPriceValue: document.getElementById('modalPriceValue'),
  modalCopyPriceBtn: document.getElementById('modalCopyPriceBtn'),
  modalRecalcBtn: document.getElementById('modalRecalcBtn'),
  modalEditItemBtn: document.getElementById('modalEditItemBtn'),
  modalDetailLayout: document.querySelector('#itemModal .detail-layout-wide'),
  modalDependenciesPanel: document.getElementById('modalDependenciesPanel'),
  modalDependenciesList: document.getElementById('modalDependenciesList'),
  renameForm: document.getElementById('renameForm'),
  renameCategoryInput: document.getElementById('renameCategoryInput'),
  renameCategoryColor: document.getElementById('renameCategoryColor'),
  editItemForm: document.getElementById('editItemForm'),
  editItemTitle: document.getElementById('editItemTitle'),
  editItemPrice: document.getElementById('editItemPrice'),
  editDependencySearch: document.getElementById('editDependencySearch'),
  editDependencyCategoryFilters: document.getElementById('editDependencyCategoryFilters'),
  dependencyEditorWrap: document.getElementById('dependencyEditorWrap'),
  editDependencyList: document.getElementById('editDependencyList'),
  priceModal: document.getElementById('priceModal'),
  calcBasePrice: document.getElementById('calcBasePrice'),
  calcQuantity: document.getElementById('calcQuantity'),
  calcPercent: document.getElementById('calcPercent'),
  calcDecreaseBtn: document.getElementById('calcDecreaseBtn'),
  calcIncreaseBtn: document.getElementById('calcIncreaseBtn'),
  calcSubtotal: document.getElementById('calcSubtotal'),
  calcDelta: document.getElementById('calcDelta'),
  calcResult: document.getElementById('calcResult'),
  calcFormula: document.getElementById('calcFormula'),
  tableModal: document.getElementById('tableModal'),
  tablePercentInput: document.getElementById('tablePercentInput'),
  tableDecreaseBtn: document.getElementById('tableDecreaseBtn'),
  tableIncreaseBtn: document.getElementById('tableIncreaseBtn'),
  tableApplyBtn: document.getElementById('tableApplyBtn'),
  tableSummaryCount: document.getElementById('tableSummaryCount'),
  tableSummaryBase: document.getElementById('tableSummaryBase'),
  tableSummaryDelta: document.getElementById('tableSummaryDelta'),
  tableSummaryAdjusted: document.getElementById('tableSummaryAdjusted'),
  itemsTableContainer: document.getElementById('itemsTableContainer'),
  toast: document.getElementById('toast'),
  connectionStatus: document.getElementById('connectionStatus'),
  connectionLatency: document.getElementById('connectionLatency'),
  connectionUrl: document.getElementById('connectionUrl'),
  connectionAnonKey: document.getElementById('connectionAnonKey'),
  connectionBucket: document.getElementById('connectionBucket'),
  connectionAuth: document.getElementById('connectionAuth'),
  connectionCategories: document.getElementById('connectionCategories'),
  connectionItems: document.getElementById('connectionItems'),
  connectionStorage: document.getElementById('connectionStorage'),
  connectionSession: document.getElementById('connectionSession'),
  connectionDetails: document.getElementById('connectionDetails'),
  testConnectionBtn: document.getElementById('testConnectionBtn'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebarToggleBtn')
};

const state = {
  categories: [],
  items: [],
  dependencies: [],
  session: null,
  search: '',
  selectedCategoryId: null,
  pendingImageFile: null,
  currentItem: null,
  currentCalcMode: 'increase',
  renameCategoryId: null,
  editItemId: null,
  loadingProgress: 0,
  dependencySearch: '',
  dependencyCategoryFilter: null,
  dependencyFilterPanelOpen: false,
  selectedDependencyIds: [],
  categoryPages: {},
  tablePercent: 0,
  tableMode: 'increase',
  isApplyingBulkPrices: false,
  supportsDependencies: true
};

let supabaseClient = null;
let toastTimer = null;
let startupFallback = null;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(num);
}

function maskValue(value = '', visibleStart = 6, visibleEnd = 4) {
  const str = String(value || '');
  if (!str) return '—';
  if (str.length <= visibleStart + visibleEnd) return '*'.repeat(Math.max(8, str.length));
  return `${str.slice(0, visibleStart)}${'*'.repeat(Math.max(8, str.length - visibleStart - visibleEnd))}${str.slice(-visibleEnd)}`;
}

function maskUrl(url = '') {
  if (!url) return '—';
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/${'*'.repeat(10)}`;
  } catch {
    return maskValue(url, 10, 0);
  }
}

function usernameToEmail(username) {
  return `${String(username || '').trim()}@${authDomain}`.toLowerCase();
}

function showToast(message, isError = false) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.style.borderColor = isError ? 'rgba(255,94,141,.28)' : 'rgba(111,244,255,.2)';
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

function setLoginMessage(message = '') {
  els.loginMessage.textContent = message;
}

function setScreen(isLoggedIn) {
  els.loginScreen.classList.toggle('active', !isLoggedIn);
  els.dashboardScreen.classList.toggle('active', isLoggedIn);
}

function openModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  });
}

function setStartupProgress(value) {
  state.loadingProgress = Math.max(0, Math.min(100, value));
  if (els.loadingBar) els.loadingBar.style.width = `${state.loadingProgress}%`;
  if (els.loadingPercent) els.loadingPercent.textContent = `${Math.round(state.loadingProgress)}%`;
}

function startStartupToast() {
  document.body.classList.remove('app-ready');
  if (!els.loadingScreen) return;
  els.loadingScreen.classList.add('active');
  let progress = 0;
  setStartupProgress(0);
  const tick = () => {
    if (!els.loadingScreen || !els.loadingScreen.classList.contains('active')) return;
    progress = Math.min(progress + Math.random() * 18, 88);
    setStartupProgress(progress);
    startupFallback = setTimeout(tick, 180);
  };
  tick();
}

function finishStartupToast() {
  clearTimeout(startupFallback);
  setStartupProgress(100);
  document.body.classList.add('app-ready');
  if (!els.loadingScreen) return;
  setTimeout(() => els.loadingScreen.classList.remove('active'), 250);
}

function withTimeout(promise, timeoutMs = connectionTimeoutMs, label = 'Request') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: timeout ${timeoutMs}ms`)), timeoutMs))
  ]);
}

function clearPreview() {
  state.pendingImageFile = null;
  if (els.itemImageFile) els.itemImageFile.value = '';
  if (els.imagePreview) els.imagePreview.classList.add('hidden');
  if (els.previewImage) els.previewImage.removeAttribute('src');
  if (els.previewName) els.previewName.textContent = '';
}

function setPreview(file) {
  state.pendingImageFile = file;
  if (!els.previewImage || !els.previewName || !els.imagePreview) return;
  els.previewImage.src = URL.createObjectURL(file);
  els.previewName.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
  els.imagePreview.classList.remove('hidden');
}

function isImageFile(file) {
  return file && typeof file.type === 'string' && file.type.startsWith('image/');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text ?? ''));
    showToast('Скопировано');
  } catch {
    showToast('Не удалось скопировать', true);
  }
}

async function initSupabase() {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY || String(config.SUPABASE_URL).includes('PASTE_')) {
    throw new Error('Заполни config.js');
  }
  if (!window.supabase?.createClient) {
    throw new Error('Supabase SDK не загружен');
  }
  supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

function getPublicUrl(path) {
  return supabaseClient.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
}

async function uploadImage(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await withTimeout(
    supabaseClient.storage.from(bucketName).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png'
    }),
    15000,
    'Storage upload'
  );
  if (error) throw error;
  return getPublicUrl(fileName);
}

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  return state.items.filter(item => {
    const matchCategory = !state.selectedCategoryId || item.category_id === state.selectedCategoryId;
    const matchSearch = !q || [item.title, item.classname].some(v => String(v || '').toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });
}

function getCategoryById(id) {
  return state.categories.find(category => category.id === id) || null;
}

const ITEMS_PER_PAGE = 6;

function getItemById(id) {
  return state.items.find(item => item.id === id) || null;
}

function getDependenciesForItem(itemId) {
  if (!state.supportsDependencies) return [];
  return state.dependencies
    .filter(link => link.item_id === itemId)
    .map(link => getItemById(link.dependency_item_id))
    .filter(Boolean);
}

function isMissingDependenciesTableError(error) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '');
  return code === 'PGRST205' || message.includes('item_dependencies') || message.includes("could not find the table 'public.item_dependencies'");
}

function normalizeCategoryPages() {
  const filteredItems = getFilteredItems();
  const nextPages = {};
  const categoriesToCheck = state.selectedCategoryId
    ? state.categories.filter(category => category.id === state.selectedCategoryId)
    : state.categories;

  categoriesToCheck.forEach(category => {
    const totalItems = filteredItems.filter(item => item.category_id === category.id).length;
    const maxPage = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const currentPage = Number(state.categoryPages[category.id] || 1);
    nextPages[category.id] = Math.min(Math.max(currentPage, 1), maxPage);
  });

  state.categoryPages = { ...state.categoryPages, ...nextPages };
}

function getDependencyOptions(search = '') {
  const query = String(search || '').trim().toLowerCase();
  return state.items
    .filter(item => item.id !== state.editItemId)
    .filter(item => !state.dependencyCategoryFilter || item.category_id === state.dependencyCategoryFilter)
    .filter(item => !query || [item.title, item.classname].some(value => String(value || '').toLowerCase().includes(query)))
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
}

function renderDependencyCategoryFilters() {
  if (!els.editDependencyCategoryFilters) return;
  const isVisible = state.dependencyFilterPanelOpen || Boolean(state.dependencySearch.trim()) || Boolean(state.dependencyCategoryFilter);
  els.editDependencyCategoryFilters.classList.toggle('hidden', !isVisible);
  if (!isVisible) {
    els.editDependencyCategoryFilters.innerHTML = '';
    return;
  }

  const allCount = state.items.filter(item => item.id !== state.editItemId).length;
  const chips = [`
    <button type="button" class="dependency-filter-chip ${state.dependencyCategoryFilter ? '' : 'active'}" data-dependency-category-filter="all">Все (${allCount})</button>
  `];

  state.categories.forEach(category => {
    const count = state.items.filter(item => item.id !== state.editItemId && item.category_id === category.id).length;
    chips.push(`
      <button type="button" class="dependency-filter-chip ${state.dependencyCategoryFilter === category.id ? 'active' : ''}" data-dependency-category-filter="${category.id}" style="--category-color:${escapeHtml(category.color || '#6ff4ff')}">${escapeHtml(category.name)} (${count})</button>
    `);
  });

  els.editDependencyCategoryFilters.innerHTML = chips.join('');
}


function getTablePercent() {
  return Math.min(100, Math.max(0, Number(state.tablePercent || 0)));
}

function calculateAdjustedPrice(price, percent = getTablePercent(), mode = state.tableMode) {
  const base = Number(price || 0);
  const safePercent = Math.min(100, Math.max(0, Number(percent || 0)));
  const delta = base * (safePercent / 100);
  const adjusted = mode === 'decrease' ? Math.max(0, base - delta) : base + delta;
  return {
    base,
    delta,
    adjusted,
    safePercent
  };
}

function getTableItems() {
  return getFilteredItems();
}

function updateTableSummary() {
  if (!els.tableSummaryCount) return;
  const pricedItems = getTableItems().filter(item => item.price !== null && item.price !== undefined && item.price !== '');
  const totals = pricedItems.reduce((acc, item) => {
    const calc = calculateAdjustedPrice(item.price);
    acc.count += 1;
    acc.base += calc.base;
    acc.adjusted += calc.adjusted;
    return acc;
  }, { count: 0, base: 0, adjusted: 0 });

  const delta = totals.adjusted - totals.base;
  els.tableSummaryCount.textContent = String(totals.count);
  els.tableSummaryBase.textContent = `₽ ${formatPrice(totals.base)}`;
  els.tableSummaryAdjusted.textContent = `₽ ${formatPrice(totals.adjusted)}`;
  els.tableSummaryDelta.textContent = `${delta >= 0 ? '+' : '-'} ₽ ${formatPrice(Math.abs(delta))}`;
}

function renderTableView() {
  if (!els.itemsTableContainer) return;
  const items = getTableItems();
  const activeCategories = state.selectedCategoryId
    ? state.categories.filter(category => category.id === state.selectedCategoryId)
    : state.categories;

  if (!items.length) {
    els.itemsTableContainer.innerHTML = '<div class="excel-empty">Нет предметов для отображения</div>';
    updateTableSummary();
    return;
  }

  els.itemsTableContainer.innerHTML = activeCategories.map(category => {
    const categoryItems = items.filter(item => item.category_id === category.id);
    if (!categoryItems.length) return '';
    const rows = categoryItems.map(item => {
      const hasPrice = item.price !== null && item.price !== undefined && item.price !== '';
      const calc = calculateAdjustedPrice(item.price || 0);
      return `
        <div class="excel-row">
          <div>${escapeHtml(category.name)}</div>
          <div><div class="excel-image"><img src="${escapeHtml(item.image_url || '')}" alt="${escapeHtml(item.title)}" loading="lazy"></div></div>
          <div>
            <div class="excel-code">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.classname)}</span>
            </div>
          </div>
          <div>
            <div class="excel-price-old">
              <span>Текущая цена</span>
              <strong>${hasPrice ? `₽ ${formatPrice(item.price)}` : '—'}</strong>
            </div>
          </div>
          <div>
            <div class="excel-price-new">
              <span>${hasPrice ? (state.tableMode === 'decrease' ? 'После уменьшения' : 'После увеличения') : 'Новая цена'}</span>
              <strong class="${state.tableMode === 'decrease' ? 'is-negative' : 'is-positive'}">${hasPrice ? `₽ ${formatPrice(calc.adjusted)}` : '—'}</strong>
            </div>
          </div>
          <div>
            <div class="excel-row-actions">
              <button class="mini-btn" type="button" data-table-open-item="${item.id}">Открыть</button>
              <button class="mini-btn" type="button" data-table-copy-class="${item.id}">Копировать</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="excel-category-row" style="--category-color:${escapeHtml(category.color || '#6ff4ff')}"><div>${escapeHtml(category.name)} · ${categoryItems.length}</div></div>
      ${rows}
    `;
  }).join('');

  updateTableSummary();
}

function openTableModal() {
  state.tablePercent = Number(els.tablePercentInput?.value || state.tablePercent || 0);
  if (els.tablePercentInput) els.tablePercentInput.value = String(getTablePercent());
  renderTableView();
  updateTableModeButtons();
  openModalById('tableModal');
}

function updateTableModeButtons() {
  els.tableIncreaseBtn?.classList.toggle('is-active', state.tableMode === 'increase');
  els.tableDecreaseBtn?.classList.toggle('is-active', state.tableMode === 'decrease');
}

function setTableMode(mode) {
  state.tableMode = mode;
  updateTableModeButtons();
  renderTableView();
}

async function applyBulkPriceUpdate() {
  const pricedItems = getTableItems().filter(item => item.price !== null && item.price !== undefined && item.price !== '');
  if (!pricedItems.length) {
    showToast('Нет предметов с ценой для массового изменения', true);
    return;
  }
  const percent = getTablePercent();
  const actionName = state.tableMode === 'decrease' ? 'уменьшить' : 'увеличить';
  if (!window.confirm(`Точно ${actionName} цены у ${pricedItems.length} предметов на ${formatPrice(percent)}%?`)) return;

  state.isApplyingBulkPrices = true;
  if (els.tableApplyBtn) {
    els.tableApplyBtn.disabled = true;
    els.tableApplyBtn.textContent = 'Сохраняю...';
  }

  try {
    await Promise.all(pricedItems.map(item => {
      const nextPrice = Number(calculateAdjustedPrice(item.price, percent, state.tableMode).adjusted.toFixed(2));
      return supabaseClient.from('items').update({ price: nextPrice }).eq('id', item.id).then(({ error }) => {
        if (error) throw error;
      });
    }));
    await loadData();
    if (state.currentItem?.id) {
      const freshCurrent = getItemById(state.currentItem.id);
      if (freshCurrent) state.currentItem = freshCurrent;
    }
    renderTableView();
    showToast('Цены обновлены массово');
  } catch (error) {
    showToast(error.message || 'Не удалось массово обновить цены', true);
  } finally {
    state.isApplyingBulkPrices = false;
    if (els.tableApplyBtn) {
      els.tableApplyBtn.disabled = false;
      els.tableApplyBtn.textContent = 'Применить ко всем';
    }
  }
}

function renderDependencyEditor() {
  if (!els.editDependencyList) return;

  renderDependencyCategoryFilters();

  if (!state.supportsDependencies) {
    els.editDependencyList.innerHTML = '<div class="empty-state">Связи временно недоступны, пока не выполнена SQL-миграция для item_dependencies.</div>';
    return;
  }

  const options = getDependencyOptions(state.dependencySearch);

  if (!state.editItemId) {
    els.editDependencyList.innerHTML = '<div class="empty-state">Сначала выбери карточку</div>';
    return;
  }

  if (!options.length) {
    els.editDependencyList.innerHTML = '<div class="empty-state">Ничего не найдено среди уже созданных карточек</div>';
    return;
  }

  els.editDependencyList.innerHTML = options.map(item => {
    const category = getCategoryById(item.category_id);
    const checked = state.selectedDependencyIds.includes(item.id) ? 'checked' : '';
    return `
      <label class="dependency-option">
        <input type="checkbox" data-dependency-checkbox="${item.id}" ${checked} />
        <img class="dependency-option-image" src="${escapeHtml(item.image_url || '')}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <span class="dependency-option-main">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.classname)}</small>
        </span>
        <span class="dependency-option-tag">${escapeHtml(category?.name || 'Без категории')}</span>
      </label>
    `;
  }).join('');
}

function renderModalDependencies(item) {
  if (!els.modalDependenciesPanel || !els.modalDependenciesList) return false;
  if (!item || !state.supportsDependencies) {
    els.modalDependenciesPanel.classList.add('hidden');
    els.modalDependenciesList.innerHTML = '';
    return false;
  }

  const directDependencies = getDependenciesForItem(item.id);

  if (!directDependencies.length) {
    els.modalDependenciesPanel.classList.add('hidden');
    els.modalDependenciesList.innerHTML = '';
    return false;
  }

  els.modalDependenciesList.innerHTML = directDependencies.map(dep => `
    <article class="dependency-card compact">
      <div class="dependency-card-head">
        <img class="dependency-card-image" src="${escapeHtml(dep.image_url || '')}" alt="${escapeHtml(dep.title)}" loading="lazy" />
        <div class="dependency-card-copy">
          <button class="dependency-open" type="button" data-open-related-item="${dep.id}">${escapeHtml(dep.title)}</button>
          <div class="dependency-meta">${escapeHtml(dep.classname)}</div>
        </div>
      </div>
      <div class="dependency-actions compact">
        <button class="mini-btn" type="button" data-copy-related-class="${dep.id}">Скопировать</button>
        <button class="mini-btn" type="button" data-open-related-item="${dep.id}">Перейти</button>
      </div>
    </article>
  `).join('');
  els.modalDependenciesPanel.classList.remove('hidden');
  return true;
}

function renderCategoryTabs() {
  els.categoryTabs.innerHTML = '';

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = `category-chip ${state.selectedCategoryId ? '' : 'active'}`;
  allButton.textContent = 'Все категории';
  allButton.addEventListener('click', () => {
    state.selectedCategoryId = null;
    render();
  });
  els.categoryTabs.appendChild(allButton);

  state.categories.forEach(category => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-chip ${state.selectedCategoryId === category.id ? 'active' : ''}`;
    btn.textContent = category.name;
    btn.style.setProperty('--category-color', category.color || '#6ff4ff');
    btn.addEventListener('click', () => {
      state.selectedCategoryId = category.id;
      render();
      if (window.innerWidth <= 980) els.sidebar?.classList.remove('is-open');
    });
    els.categoryTabs.appendChild(btn);
  });
}

function renderCategoryOptions() {
  els.itemCategory.innerHTML = state.categories
    .map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
}

function renderContent() {
  normalizeCategoryPages();
  const filteredItems = getFilteredItems();
  const activeCategories = state.selectedCategoryId
    ? state.categories.filter(category => category.id === state.selectedCategoryId)
    : state.categories;

  els.categoriesContainer.innerHTML = activeCategories.map(category => {
    const color = category.color || '#6ff4ff';
    const items = filteredItems.filter(item => item.category_id === category.id);
    const currentPage = Number(state.categoryPages[category.id] || 1);
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    state.categoryPages[category.id] = safePage;
    const pageStart = (safePage - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(pageStart, pageStart + ITEMS_PER_PAGE);

    const cards = pageItems.length
      ? pageItems.map(item => {
          const hasPrice = item.price !== null && item.price !== undefined && item.price !== '';
          const dependencyCount = state.supportsDependencies ? getDependenciesForItem(item.id).length : 0;
          return `
            <article class="item-card" style="--category-color:${escapeHtml(color)}">
              <div class="item-main">
                <div class="item-click-zone" data-item-open="${item.id}">
                  <div class="item-image"><img src="${escapeHtml(item.image_url || '')}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
                  <div class="item-info">
                    <div class="item-title">${escapeHtml(item.title)}</div>
                    <div class="item-code">${escapeHtml(item.classname)}</div>
                    <div class="item-badges">
                      ${hasPrice ? `<div class="item-price-tag">₽ ${formatPrice(item.price)}</div>` : ''}
                      ${dependencyCount ? `<div class="item-link-tag">Связи: ${dependencyCount}</div>` : ''}
                    </div>
                  </div>
                </div>
                <div class="item-side-actions">
                  <button class="mini-btn" type="button" data-copy-class="${item.id}">Скопировать</button>
                  ${state.supportsDependencies ? `<button class="mini-btn" type="button" data-manage-links="${item.id}">Связи</button>` : ''}
                  ${hasPrice ? `<button class="mini-btn" type="button" data-calc-open="${item.id}">%</button>` : ''}
                  <button class="square-btn" type="button" data-edit-item="${item.id}" aria-label="Редактировать">✎</button>
                  <button class="square-btn danger" type="button" data-delete-item="${item.id}" aria-label="Удалить">🗑</button>
                </div>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="panel" style="padding:18px;color:var(--muted)">Пусто</div>';

    const pagination = totalPages > 1
      ? `
        <div class="category-pagination">
          <button class="button button-ghost" type="button" data-page-nav="prev" data-category-page="${category.id}" ${safePage === 1 ? 'disabled' : ''}>← Назад</button>
          <div class="pagination-status">Страница ${safePage} / ${totalPages}</div>
          <button class="button button-ghost" type="button" data-page-nav="next" data-category-page="${category.id}" ${safePage === totalPages ? 'disabled' : ''}>Вперёд →</button>
        </div>
      `
      : '';

    return `
      <section class="category-block panel" style="--category-color:${escapeHtml(color)}">
        <div class="category-header">
          <div class="category-title-wrap">
            <div class="category-title">${escapeHtml(category.name)}</div>
            <div class="category-count">${items.length}</div>
          </div>
          <div class="row-actions">
            <button class="mini-btn" type="button" data-rename-category="${category.id}">Редактировать</button>
            <button class="square-btn danger" type="button" data-delete-category="${category.id}" aria-label="Удалить категорию">🗑</button>
          </div>
        </div>
        <div class="card-grid">${cards}</div>
        ${pagination}
      </section>
    `;
  }).join('');

  if (!activeCategories.length) {
    els.categoriesContainer.innerHTML = '<section class="panel" style="padding:22px;color:var(--muted)">Категорий пока нет</section>';
  }
}

function updateStats() {
  els.statsCategories.textContent = state.categories.length;
  els.statsItems.textContent = state.items.length;
  els.statsFiltered.textContent = getFilteredItems().length;
}

function render() {
  renderCategoryTabs();
  renderCategoryOptions();
  renderContent();
  updateStats();
  if (els.tableModal && !els.tableModal.classList.contains('hidden')) renderTableView();
}

async function loadData() {
  const categoryPromise = supabaseClient.from('categories').select('*').order('created_at', { ascending: true });
  const itemsPromise = supabaseClient.from('items').select('*').order('created_at', { ascending: false });
  const dependenciesPromise = supabaseClient.from('item_dependencies').select('*').order('created_at', { ascending: true });

  const [{ data: categories, error: catError }, { data: items, error: itemError }, { data: dependencies, error: depError }] = await Promise.all([
    categoryPromise,
    itemsPromise,
    dependenciesPromise
  ]);

  if (catError) throw catError;
  if (itemError) throw itemError;

  if (depError) {
    if (isMissingDependenciesTableError(depError)) {
      state.supportsDependencies = false;
      state.dependencies = [];
    } else {
      throw depError;
    }
  } else {
    state.supportsDependencies = true;
    state.dependencies = dependencies || [];
  }

  state.categories = categories || [];
  state.items = items || [];

  if (state.selectedCategoryId && !state.categories.some(category => category.id === state.selectedCategoryId)) {
    state.selectedCategoryId = null;
  }

  normalizeCategoryPages();
  render();
}

async function login(event) {
  event.preventDefault();
  setLoginMessage('');
  try {
    const email = usernameToEmail(els.loginInput.value);
    const password = els.passwordInput.value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.session = data.session;
    setScreen(true);
    await loadData();
    showToast('Вход выполнен');
  } catch (error) {
    setLoginMessage(error.message || 'Ошибка входа');
  }
}

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } finally {
    state.session = null;
    setScreen(false);
    closeAllModals();
    showToast('Вы вышли');
  }
}

async function createCategory(event) {
  event.preventDefault();
  try {
    const payload = {
      name: els.categoryName.value.trim(),
      color: els.categoryColor.value || '#6ff4ff'
    };
    const { error } = await supabaseClient.from('categories').insert([payload]);
    if (error) throw error;
    els.categoryForm.reset();
    els.categoryColor.value = '#6ff4ff';
    closeModalById('categoryModal');
    await loadData();
    showToast('Категория создана');
  } catch (error) {
    showToast(error.message || 'Не удалось создать категорию', true);
  }
}

async function createItem(event) {
  event.preventDefault();
  try {
    let imageUrl = els.itemImageUrl.value.trim();
    if (state.pendingImageFile) {
      imageUrl = await uploadImage(state.pendingImageFile);
    }
    if (!imageUrl) {
      throw new Error('Добавь изображение');
    }
    const priceValue = els.itemPrice.value.trim();
    const payload = {
      category_id: els.itemCategory.value,
      title: els.itemTitle.value.trim(),
      classname: els.itemClassname.value.trim(),
      image_url: imageUrl,
      price: priceValue ? Number(priceValue) : null
    };
    const { error } = await supabaseClient.from('items').insert([payload]);
    if (error) throw error;
    els.itemForm.reset();
    clearPreview();
    closeModalById('createItemModal');
    await loadData();
    showToast('Карточка создана');
  } catch (error) {
    showToast(error.message || 'Не удалось создать карточку', true);
  }
}

function openItemModal(itemId) {
  const item = state.items.find(entry => entry.id === itemId);
  if (!item) return;
  state.currentItem = item;
  els.modalImage.src = item.image_url || '';
  els.modalImage.alt = item.title ? `Изображение карточки ${item.title}` : 'Изображение карточки';
  els.modalTitle.textContent = item.title;
  els.modalClassname.textContent = item.classname;
  if (item.price !== null && item.price !== undefined && item.price !== '') {
    els.modalPriceValue.textContent = `₽ ${formatPrice(item.price)}`;
    els.modalPriceBox.classList.remove('hidden');
  } else {
    els.modalPriceValue.textContent = '';
    els.modalPriceBox.classList.add('hidden');
  }
  const hasDependencies = renderModalDependencies(item);
  els.modalDetailLayout?.classList.toggle('no-deps', !hasDependencies);
  openModalById('itemModal');
}

function openRenameModal(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return;
  state.renameCategoryId = category.id;
  els.renameCategoryInput.value = category.name;
  els.renameCategoryColor.value = category.color || '#6ff4ff';
  openModalById('renameModal');
}

function openEditItemModal(itemId) {
  const item = state.items.find(entry => entry.id === itemId);
  if (!item) return;
  state.editItemId = item.id;
  state.dependencySearch = '';
  state.dependencyCategoryFilter = null;
  state.dependencyFilterPanelOpen = false;
  state.selectedDependencyIds = getDependenciesForItem(item.id).map(dep => dep.id);
  els.editItemTitle.value = item.title;
  els.editItemPrice.value = item.price ?? '';
  if (els.editDependencySearch) els.editDependencySearch.value = '';
  renderDependencyEditor();
  openModalById('editItemModal');
}

function updateCalculator(mode = state.currentCalcMode) {
  state.currentCalcMode = mode;
  const basePrice = Number(state.currentItem?.price || 0);
  const qty = Math.max(1, Number(els.calcQuantity.value || 1));
  const percent = Math.max(0, Number(els.calcPercent.value || 0));
  const subtotal = basePrice * qty;
  const delta = subtotal * (percent / 100);
  const result = mode === 'decrease' ? subtotal - delta : subtotal + delta;

  els.calcBasePrice.textContent = `₽ ${formatPrice(basePrice)}`;
  els.calcSubtotal.textContent = `₽ ${formatPrice(subtotal)}`;
  els.calcDelta.textContent = `${mode === 'decrease' ? '-' : '+'} ₽ ${formatPrice(delta)}`;
  els.calcResult.textContent = `₽ ${formatPrice(result)}`;
  const op = mode === 'decrease' ? '-' : '+';
  els.calcFormula.textContent = `(${formatPrice(basePrice)} × ${qty}) ${op} ${percent}% = ${formatPrice(result)}`;
  els.calcIncreaseBtn.classList.toggle('is-active', mode === 'increase');
  els.calcDecreaseBtn.classList.toggle('is-active', mode === 'decrease');
}

function openCalcModal(itemId) {
  const item = state.items.find(entry => entry.id === itemId);
  if (!item || item.price === null || item.price === undefined || item.price === '') return;
  state.currentItem = item;
  els.calcQuantity.value = '1';
  els.calcPercent.value = '0';
  updateCalculator('increase');
  openModalById('priceModal');
}

async function handleRenameCategory(event) {
  event.preventDefault();
  try {
    const payload = {
      name: els.renameCategoryInput.value.trim(),
      color: els.renameCategoryColor.value || '#6ff4ff'
    };
    const { error } = await supabaseClient.from('categories').update(payload).eq('id', state.renameCategoryId);
    if (error) throw error;
    closeModalById('renameModal');
    await loadData();
    showToast('Категория обновлена');
  } catch (error) {
    showToast(error.message || 'Не удалось обновить категорию', true);
  }
}

async function syncItemDependencies(itemId) {
  if (!state.supportsDependencies) return;

  const { error: deleteError } = await supabaseClient.from('item_dependencies').delete().eq('item_id', itemId);
  if (deleteError) {
    if (isMissingDependenciesTableError(deleteError)) {
      state.supportsDependencies = false;
      state.dependencies = [];
      return;
    }
    throw deleteError;
  }

  if (!state.selectedDependencyIds.length) return;

  const payload = state.selectedDependencyIds.map(dependencyId => ({
    item_id: itemId,
    dependency_item_id: dependencyId
  }));

  const { error: insertError } = await supabaseClient.from('item_dependencies').insert(payload);
  if (insertError) {
    if (isMissingDependenciesTableError(insertError)) {
      state.supportsDependencies = false;
      state.dependencies = [];
      return;
    }
    throw insertError;
  }
}

async function handleEditItem(event) {
  event.preventDefault();
  try {
    const payload = {
      title: els.editItemTitle.value.trim(),
      price: els.editItemPrice.value.trim() ? Number(els.editItemPrice.value) : null
    };
    const { error } = await supabaseClient.from('items').update(payload).eq('id', state.editItemId);
    if (error) throw error;
    await syncItemDependencies(state.editItemId);
    closeModalById('editItemModal');
    await loadData();
    if (state.currentItem?.id === state.editItemId) {
      openItemModal(state.editItemId);
    }
    showToast('Карточка обновлена');
  } catch (error) {
    showToast(error.message || 'Не удалось обновить карточку', true);
  }
}

async function deleteCategory(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return;
  if (!window.confirm(`Удалить категорию «${category.name}» и все её карточки?`)) return;
  try {
    const { error } = await supabaseClient.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
    await loadData();
    showToast('Категория удалена');
  } catch (error) {
    showToast(error.message || 'Не удалось удалить категорию', true);
  }
}

async function deleteItem(itemId) {
  const item = state.items.find(entry => entry.id === itemId);
  if (!item) return;
  if (!window.confirm(`Удалить карточку «${item.title}»?`)) return;
  try {
    if (state.supportsDependencies) {
      const { error: depDeleteError } = await supabaseClient.from('item_dependencies').delete().or(`item_id.eq.${itemId},dependency_item_id.eq.${itemId}`);
      if (depDeleteError && !isMissingDependenciesTableError(depDeleteError)) throw depDeleteError;
      if (depDeleteError && isMissingDependenciesTableError(depDeleteError)) {
        state.supportsDependencies = false;
        state.dependencies = [];
      }
    }
    const { error } = await supabaseClient.from('items').delete().eq('id', itemId);
    if (error) throw error;
    if (state.currentItem?.id === itemId) closeModalById('itemModal');
    await loadData();
    showToast('Карточка удалена');
  } catch (error) {
    showToast(error.message || 'Не удалось удалить карточку', true);
  }
}

async function testConnection() {
  openModalById('connectionModal');
  els.connectionStatus.textContent = 'Проверка...';
  els.connectionLatency.textContent = '—';
  els.connectionUrl.textContent = maskUrl(config.SUPABASE_URL);
  els.connectionAnonKey.textContent = maskValue(config.SUPABASE_ANON_KEY);
  els.connectionBucket.textContent = bucketName;
  els.connectionDetails.textContent = '';

  const start = performance.now();
  const lines = [];
  try {
    const [sessionResult, catResult, itemResult, storageResult] = await Promise.all([
      withTimeout(supabaseClient.auth.getSession(), connectionTimeoutMs, 'Auth session'),
      withTimeout(supabaseClient.from('categories').select('id', { count: 'exact', head: true }), connectionTimeoutMs, 'Categories'),
      withTimeout(supabaseClient.from('items').select('id', { count: 'exact', head: true }), connectionTimeoutMs, 'Items'),
      withTimeout(supabaseClient.storage.from(bucketName).list('', { limit: 1 }), connectionTimeoutMs, 'Storage')
    ]);

    const latency = Math.round(performance.now() - start);
    els.connectionLatency.textContent = `${latency} ms`;
    els.connectionStatus.textContent = 'Подключено';
    els.connectionAuth.textContent = sessionResult.error ? 'Ошибка' : 'OK';
    els.connectionSession.textContent = sessionResult.data?.session ? 'Активна' : 'Нет';
    els.connectionCategories.textContent = String(catResult.count ?? 0);
    els.connectionItems.textContent = String(itemResult.count ?? 0);
    els.connectionStorage.textContent = storageResult.error ? 'Ошибка' : 'OK';

    if (sessionResult.error) lines.push(`Auth: ${sessionResult.error.message}`);
    if (catResult.error) lines.push(`Categories: ${catResult.error.message}`);
    if (itemResult.error) lines.push(`Items: ${itemResult.error.message}`);
    if (storageResult.error) lines.push(`Storage: ${storageResult.error.message}`);
    if (!lines.length) lines.push('Все проверки прошли успешно.');
    els.connectionDetails.textContent = lines.join('\n');
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    els.connectionLatency.textContent = `${latency} ms`;
    els.connectionStatus.textContent = 'Ошибка подключения';
    els.connectionAuth.textContent = 'Ошибка';
    els.connectionDetails.textContent = error.message || 'Не удалось проверить подключение';
    showToast(error.message || 'Не удалось проверить подключение', true);
  }
}

function handleContentClick(event) {
  const relatedOpenBtn = event.target.closest('[data-open-related-item]');
  if (relatedOpenBtn) return openItemModal(relatedOpenBtn.dataset.openRelatedItem);

  const relatedCopyBtn = event.target.closest('[data-copy-related-class]');
  if (relatedCopyBtn) {
    const relatedItem = getItemById(relatedCopyBtn.dataset.copyRelatedClass);
    if (relatedItem) copyText(relatedItem.classname);
    return;
  }

  const tableOpenBtn = event.target.closest('[data-table-open-item]');
  if (tableOpenBtn) return openItemModal(tableOpenBtn.dataset.tableOpenItem);

  const tableCopyBtn = event.target.closest('[data-table-copy-class]');
  if (tableCopyBtn) {
    const tableItem = getItemById(tableCopyBtn.dataset.tableCopyClass);
    if (tableItem) copyText(tableItem.classname);
    return;
  }

  const paginationBtn = event.target.closest('[data-category-page]');
  if (paginationBtn) {
    const categoryId = paginationBtn.dataset.categoryPage;
    const direction = paginationBtn.dataset.pageNav;
    const nextPage = Number(state.categoryPages[categoryId] || 1) + (direction === 'next' ? 1 : -1);
    state.categoryPages[categoryId] = Math.max(1, nextPage);
    render();
    return;
  }

  const openBtn = event.target.closest('[data-item-open]');
  if (openBtn) return openItemModal(openBtn.dataset.itemOpen);

  const copyBtn = event.target.closest('[data-copy-class]');
  if (copyBtn) {
    const item = state.items.find(entry => entry.id === copyBtn.dataset.copyClass);
    if (item) copyText(item.classname);
    return;
  }

  const calcBtn = event.target.closest('[data-calc-open]');
  if (calcBtn) return openCalcModal(calcBtn.dataset.calcOpen);

  const manageLinksBtn = event.target.closest('[data-manage-links]');
  if (manageLinksBtn) return openEditItemModal(manageLinksBtn.dataset.manageLinks);

  const editBtn = event.target.closest('[data-edit-item]');
  if (editBtn) return openEditItemModal(editBtn.dataset.editItem);

  const deleteItemBtn = event.target.closest('[data-delete-item]');
  if (deleteItemBtn) return deleteItem(deleteItemBtn.dataset.deleteItem);

  const renameCategoryBtn = event.target.closest('[data-rename-category]');
  if (renameCategoryBtn) return openRenameModal(renameCategoryBtn.dataset.renameCategory);

  const deleteCategoryBtn = event.target.closest('[data-delete-category]');
  if (deleteCategoryBtn) return deleteCategory(deleteCategoryBtn.dataset.deleteCategory);
}

function setupUploadZone() {
  els.uploadZone.addEventListener('click', () => els.itemImageFile.click());
  els.uploadZone.addEventListener('dragover', event => {
    event.preventDefault();
    els.uploadZone.classList.add('is-dragover');
  });
  els.uploadZone.addEventListener('dragleave', () => els.uploadZone.classList.remove('is-dragover'));
  els.uploadZone.addEventListener('drop', event => {
    event.preventDefault();
    els.uploadZone.classList.remove('is-dragover');
    const file = event.dataTransfer?.files?.[0];
    if (isImageFile(file)) setPreview(file);
  });
  document.addEventListener('paste', event => {
    if (!els.createItemModal || els.createItemModal.classList.contains('hidden')) return;
    const file = [...(event.clipboardData?.files || [])].find(isImageFile);
    if (file) setPreview(file);
  });
  els.itemImageFile.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (isImageFile(file)) setPreview(file);
  });
  els.removePreviewBtn.addEventListener('click', clearPreview);
}

function setupEffects() {
  const glyphRain = document.getElementById('glyphRain');
  if (glyphRain && !glyphRain.childElementCount) {
    const glyphs = '01アカサタナハマヤラワ0123456789';
    for (let i = 0; i < 22; i += 1) {
      const col = document.createElement('div');
      col.className = 'glyph-column';
      col.style.left = `${(i / 22) * 100}%`;
      col.style.animationDuration = `${7 + Math.random() * 8}s`;
      col.style.animationDelay = `${Math.random() * 4}s`;
      col.textContent = Array.from({ length: 30 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(' ');
      glyphRain.appendChild(col);
    }
  }

  const canvas = document.getElementById('fxCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5));
    canvas.height = Math.floor(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.5));
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 24 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    r: 1 + Math.random() * 2.6
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = 0.7;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 12);
      glow.addColorStop(0, 'rgba(111,244,255,0.35)');
      glow.addColorStop(1, 'rgba(111,244,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 12, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    requestAnimationFrame(draw);
  };
  draw();
}

function bindEvents() {
  els.togglePasswordBtn?.addEventListener('click', () => {
    const isPassword = els.passwordInput.type === 'password';
    els.passwordInput.type = isPassword ? 'text' : 'password';
  });
  els.loginForm.addEventListener('submit', login);
  els.logoutBtn.addEventListener('click', logout);
  els.searchInput.addEventListener('input', event => {
    state.search = event.target.value;
    render();
  });
  els.openCategoryModalBtn.addEventListener('click', () => openModalById('categoryModal'));
  els.openItemModalBtn.addEventListener('click', () => {
    if (!state.categories.length) {
      showToast('Сначала создай категорию', true);
      return;
    }
    openModalById('createItemModal');
  });
  els.openConnectionModalBtn.addEventListener('click', testConnection);
  els.openTableModalBtn?.addEventListener('click', openTableModal);
  els.categoryForm.addEventListener('submit', createCategory);
  els.itemForm.addEventListener('submit', createItem);
  els.renameForm.addEventListener('submit', handleRenameCategory);
  els.editItemForm.addEventListener('submit', handleEditItem);
  els.editDependencySearch?.addEventListener('focus', () => {
    state.dependencyFilterPanelOpen = true;
    renderDependencyEditor();
  });
  els.editDependencySearch?.addEventListener('input', event => {
    state.dependencySearch = event.target.value;
    state.dependencyFilterPanelOpen = true;
    renderDependencyEditor();
  });
  els.editDependencyCategoryFilters?.addEventListener('click', event => {
    const chip = event.target.closest('[data-dependency-category-filter]');
    if (!chip) return;
    state.dependencyCategoryFilter = chip.dataset.dependencyCategoryFilter === 'all' ? null : chip.dataset.dependencyCategoryFilter;
    state.dependencyFilterPanelOpen = true;
    renderDependencyEditor();
  });
  els.editDependencyList?.addEventListener('change', event => {
    const checkbox = event.target.closest('[data-dependency-checkbox]');
    if (!checkbox) return;
    const dependencyId = checkbox.dataset.dependencyCheckbox;
    if (checkbox.checked) {
      state.selectedDependencyIds = [...new Set([...state.selectedDependencyIds, dependencyId])];
    } else {
      state.selectedDependencyIds = state.selectedDependencyIds.filter(id => id !== dependencyId);
    }
  });
  els.modalCopyBtn.addEventListener('click', () => state.currentItem && copyText(state.currentItem.classname));
  els.modalCopyPriceBtn?.addEventListener('click', () => state.currentItem && copyText(String(state.currentItem.price ?? '')));
  els.modalRecalcBtn?.addEventListener('click', () => state.currentItem && openCalcModal(state.currentItem.id));
  els.modalEditItemBtn?.addEventListener('click', () => state.currentItem && openEditItemModal(state.currentItem.id));
  els.calcIncreaseBtn?.addEventListener('click', () => updateCalculator('increase'));
  els.calcDecreaseBtn?.addEventListener('click', () => updateCalculator('decrease'));
  els.calcQuantity?.addEventListener('input', () => updateCalculator());
  els.calcPercent?.addEventListener('input', () => updateCalculator());
  els.testConnectionBtn?.addEventListener('click', testConnection);
  els.tablePercentInput?.addEventListener('input', event => {
    state.tablePercent = Math.min(100, Math.max(0, Number(event.target.value || 0)));
    renderTableView();
  });
  els.tableIncreaseBtn?.addEventListener('click', () => setTableMode('increase'));
  els.tableDecreaseBtn?.addEventListener('click', () => setTableMode('decrease'));
  els.tableApplyBtn?.addEventListener('click', applyBulkPriceUpdate);
  els.categoriesContainer.addEventListener('click', handleContentClick);
  els.modalDependenciesList?.addEventListener('click', handleContentClick);
  els.closeModalBtn?.addEventListener('click', () => closeModalById('itemModal'));
  document.addEventListener('click', event => {
    if (!state.dependencyFilterPanelOpen) return;
    const insideDependencyEditor = event.target.closest('#dependencyEditorWrap');
    if (insideDependencyEditor) return;
    state.dependencyFilterPanelOpen = false;
    renderDependencyCategoryFilters();
  });
  document.addEventListener('click', event => {
    const backdrop = event.target.closest('[data-close-modal="true"]');
    if (backdrop) {
      const modal = backdrop.parentElement;
      if (modal?.id) closeModalById(modal.id);
      return;
    }
    const closeTarget = event.target.closest('[data-close-target]');
    if (closeTarget) closeModalById(closeTarget.dataset.closeTarget);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAllModals();
  });
  els.sidebarToggleBtn?.addEventListener('click', () => els.sidebar.classList.toggle('is-open'));
  setupUploadZone();
}

async function init() {
  startStartupToast();
  try {
    await initSupabase();
    bindEvents();
    setupEffects();

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    state.session = data.session || null;
    setScreen(Boolean(state.session));
    if (state.session) {
      await loadData();
    }
  } catch (error) {
    console.error(error);
    setLoginMessage(error.message || 'Ошибка инициализации');
    showToast(error.message || 'Ошибка инициализации', true);
    setScreen(false);
  } finally {
    finishStartupToast();
  }
}

init();
