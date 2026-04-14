import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  Lock,
  X,
  Image as ImageIcon,
  Search,
  Maximize2,
  LogOut,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Globe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

// Интерфейсы данных
interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface ItemData {
  id: string;
  categoryId: string;
  image: string;
  title: string;
  className: string;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Стандартные категории для старта
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Персонажи', emoji: '🎭', color: 'bg-indigo-500' },
  { id: '2', name: 'Локации', emoji: '🌆', color: 'bg-purple-500' },
  { id: '3', name: 'Оружие и предметы', emoji: '⚔️', color: 'bg-rose-500' },
];

// Стандартные элементы
const DEFAULT_ITEMS: ItemData[] = [
  {
    id: '1',
    categoryId: '1',
    image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=600&q=80',
    title: 'Кибер-Воин',
    className: 'cyber_warrior_01'
  },
  {
    id: '2',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=80',
    title: 'Неоновые Улицы',
    className: 'location_neon_city'
  }
];

export default function App() {
  // Состояние авторизации
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('is_admin') === 'true';
  });
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Состояние Firebase
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(() => {
    const saved = localStorage.getItem('firebase_config');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
  });

  const [dbInstance, setDbInstance] = useState<any>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string>('');
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Данные приложения
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('site_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [items, setItems] = useState<ItemData[]>(() => {
    const saved = localStorage.getItem('site_items');
    return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Модальные окна и редактирование
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemData | null>(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Форма добавления/редактирования элемента
  const [itemForm, setItemForm] = useState({
    title: '',
    className: '',
    image: '',
    categoryId: ''
  });

  // Форма добавления/редактирования категории
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    emoji: '📁',
    color: 'bg-indigo-500'
  });

  // Полноэкранный просмотр
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Попытка инициализации Firebase при загрузке или изменении конфига
  useEffect(() => {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        setDbInstance(db);
        setFirebaseConnected(true);
        setFirebaseError('');
      } catch (err: any) {
        setFirebaseConnected(false);
        setFirebaseError('Ошибка инициализации Firebase: ' + err.message);
      }
    } else {
      setFirebaseConnected(false);
    }
  }, [firebaseConfig]);

  // Загрузка данных из Firebase
  const syncFromFirebase = async () => {
    if (!dbInstance) return;
    setIsSyncing(true);
    try {
      // Загружаем категории
      const catSnap = await getDocs(collection(dbInstance, 'categories'));
      if (!catSnap.empty) {
        const loadedCats: Category[] = [];
        catSnap.forEach(doc => {
          loadedCats.push(doc.data() as Category);
        });
        setCategories(loadedCats);
      }

      // Загружаем файлы
      const itemsSnap = await getDocs(collection(dbInstance, 'items'));
      if (!itemsSnap.empty) {
        const loadedItems: ItemData[] = [];
        itemsSnap.forEach(doc => {
          loadedItems.push(doc.data() as ItemData);
        });
        setItems(loadedItems);
      }

      setFirebaseError('');
    } catch (err: any) {
      setFirebaseError('Ошибка синхронизации: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Сохранение в LocalStorage при каждом изменении
  useEffect(() => {
    localStorage.setItem('site_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('site_items', JSON.stringify(items));
  }, [items]);

  // Сохранение в Firebase
  const syncToFirebase = async (collectionName: string, id: string, data: any) => {
    if (!dbInstance) return;
    try {
      const docRef = doc(dbInstance, collectionName, id);
      await setDoc(docRef, data);
    } catch (err: any) {
      console.error("Ошибка сохранения в Firebase:", err);
    }
  };

  // Обработка авторизации
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === 'boss' && passwordInput === 'GJ(*g345k') {
      setIsAdmin(true);
      localStorage.setItem('is_admin', 'true');
      setShowAuthModal(false);
      setLoginInput('');
      setPasswordInput('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('is_admin');
  };

  // Загрузка картинки и конвертация в Base64 для сохранения
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Сохранение элемента
  const saveItem = async () => {
    if (!itemForm.title || !itemForm.categoryId) return;

    let updatedItems = [];
    let savedItem: ItemData;

    if (editingItem) {
      savedItem = { ...editingItem, ...itemForm };
      updatedItems = items.map(item => item.id === editingItem.id ? savedItem : item);
    } else {
      savedItem = { id: Date.now().toString(), ...itemForm };
      updatedItems = [...items, savedItem];
    }

    setItems(updatedItems);
    if (firebaseConnected) {
      await syncToFirebase('items', savedItem.id, savedItem);
    }

    setShowItemModal(false);
    setEditingItem(null);
  };

  // Удаление элемента
  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить этот файл?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Сохранение категории
  const saveCategory = async () => {
    if (!categoryForm.name) return;

    let updatedCats = [];
    let savedCat: Category;

    if (editingCategory) {
      savedCat = { ...editingCategory, ...categoryForm };
      updatedCats = categories.map(cat => cat.id === editingCategory.id ? savedCat : cat);
    } else {
      savedCat = { id: Date.now().toString(), ...categoryForm };
      updatedCats = [...categories, savedCat];
    }

    setCategories(updatedCats);
    if (firebaseConnected) {
      await syncToFirebase('categories', savedCat.id, savedCat);
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  // Удаление категории
  const deleteCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить эту категорию и все связанные с ней файлы?')) {
      setCategories(categories.filter(cat => cat.id !== id));
      setItems(items.filter(item => item.categoryId !== id));
      if (selectedCategory === id) setSelectedCategory(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Верхняя навигация */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FolderPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Edge Of Darkness</h1>
              <p className="text-xs text-slate-400">Classname DB & Firebase Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Статус Firebase */}
            <button
              onClick={() => setShowFirebaseModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                firebaseConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {firebaseConnected ? 'Firebase Подключен' : 'Подключить Firebase'}
            </button>

            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium rounded-lg transition"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                Выйти
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition"
              >
                <Lock className="w-4 h-4" />
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Поиск и категории */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по названию или классу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', emoji: '📁', color: 'bg-indigo-500' });
                  setShowCategoryModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Новая Категория
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({ title: '', className: '', image: '', categoryId: categories[0]?.id || '' });
                  setShowItemModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                Добавить Файл
              </button>
            </div>
          )}
        </div>

        {/* Секция категорий */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
              selectedCategory === null
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🌐 Все файлы
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </button>

              {isAdmin && (
                <div className="absolute -top-2 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      setCategoryForm({ name: cat.name, emoji: cat.emoji, color: cat.color });
                      setShowCategoryModal(true);
                    }}
                    className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-indigo-600 hover:text-white transition shadow"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => deleteCategory(cat.id, e)}
                    className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-rose-600 hover:text-white transition shadow"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Сетка элементов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const cat = categories.find(c => c.id === item.categoryId);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div 
                    onClick={() => setActiveImage(item.image)}
                    className="relative aspect-video overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-3 right-3 p-1.5 bg-slate-900/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    <div>
                      {cat && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 mb-2">
                          <span>{cat.emoji}</span>
                          {cat.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-white leading-snug">{item.title}</h3>
                      <p className="text-xs font-mono text-indigo-400 mt-1">{item.className}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 pt-3 border-t border-slate-800 mt-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm({
                              title: item.title,
                              className: item.className,
                              image: item.image,
                              categoryId: item.categoryId
                            });
                            setShowItemModal(true);
                          }}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={(e) => deleteItem(item.id, e)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Модальное окно Авторизации */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-1">Вход для Администратора</h2>
              <p className="text-xs text-slate-400 mb-6">Только для доверенных пользователей</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Логин</label>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Логин"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Пароль</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-rose-500 font-medium">Неверный логин или пароль</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition"
                >
                  Войти
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модальное окно Настройки Firebase */}
      <AnimatePresence>
        {showFirebaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Настройка Firebase (Realtime / Firestore)</h2>
                  <p className="text-xs text-slate-400">Синхронизация данных со всеми устройствами</p>
                </div>
              </div>

              {/* Состояние подключения */}
              <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
                firebaseConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {firebaseConnected ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                <div>
                  <h4 className="font-semibold text-sm">
                    {firebaseConnected ? 'Успешно подключено к базе данных Firestore' : 'База данных пока не подключена'}
                  </h4>
                  <p className="text-xs opacity-90 mt-1">
                    {firebaseConnected 
                      ? 'Ваши данные автоматически синхронизируются с облаком.' 
                      : firebaseError || 'Заполните конфигурацию ниже, чтобы включить облачное хранилище. По умолчанию данные сохраняются локально.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">API Key</label>
                    <input
                      type="text"
                      value={firebaseConfig.apiKey}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, apiKey: e.target.value})}
                      placeholder="AIzaSyA..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Project ID</label>
                    <input
                      type="text"
                      value={firebaseConfig.projectId}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, projectId: e.target.value})}
                      placeholder="my-awesome-project-id"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Auth Domain</label>
                    <input
                      type="text"
                      value={firebaseConfig.authDomain}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, authDomain: e.target.value})}
                      placeholder="project.firebaseapp.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">App ID</label>
                    <input
                      type="text"
                      value={firebaseConfig.appId}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, appId: e.target.value})}
                      placeholder="1:123456789:web:abcdef"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('firebase_config', JSON.stringify(firebaseConfig));
                      alert('Конфигурация успешно сохранена!');
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить Конфигурацию
                  </button>

                  {firebaseConnected && (
                    <button
                      onClick={syncFromFirebase}
                      disabled={isSyncing}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      Загрузить из Базы
                    </button>
                  )}
                </div>
              </div>

              {/* Инструкция по безопасности */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Инструкция по настройке Firestore Database
                </h3>
                <ol className="list-decimal pl-5 text-xs text-slate-400 space-y-1.5">
                  <li>Зайдите в <a href="https://console.firebase.google.com/" target="_blank" className="text-indigo-400 hover:underline">Firebase Console</a> и создайте проект.</li>
                  <li>Перейдите в раздел <b>Firestore Database</b> и нажмите "Create database".</li>
                  <li>В разделе <b>Rules</b> (Правила) установите: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400">allow read, write: if true;</code></li>
                  <li>В настройках проекта (Project Settings) скопируйте ключи конфигурации (web app config) и вставьте их в форму выше.</li>
                </ol>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модальное окно Редактирования/Создания Файла */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowItemModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6">
                {editingItem ? 'Редактировать Файл' : 'Добавить Новый Файл'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Название</label>
                  <input
                    type="text"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    placeholder="Например: Кибер-Воин"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Имя Класса (Classname)</label>
                  <input
                    type="text"
                    value={itemForm.className}
                    onChange={(e) => setItemForm({ ...itemForm, className: e.target.value })}
                    placeholder="classname_example_01"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Категория</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Изображение (URL или Загрузить)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={itemForm.image}
                      onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                    <label className="flex items-center justify-center px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {itemForm.image && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 mt-2">
                    <img src={itemForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button
                  onClick={saveItem}
                  disabled={!itemForm.title || !itemForm.categoryId}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg transition mt-4"
                >
                  {editingItem ? 'Сохранить Изменения' : 'Добавить Файл'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модальное окно Категорий */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCategoryModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6">
                {editingCategory ? 'Изменить Категорию' : 'Новая Категория'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Эмодзи</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={categoryForm.emoji}
                    onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg text-center focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Название</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Оружие"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  onClick={saveCategory}
                  disabled={!categoryForm.name}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg transition mt-4"
                >
                  {editingCategory ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Полноэкранный просмотр изображений */}
      <AnimatePresence>
        {activeImage && (
          <div 
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg cursor-zoom-out"
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-6 right-6 p-2 bg-slate-900/80 rounded-xl text-white hover:bg-slate-800 transition shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={activeImage}
              alt="Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
