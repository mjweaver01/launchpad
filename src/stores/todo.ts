import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TodoData, TodoItem, CacheEntry } from './types';
import { TODO_CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

const TODO_CACHE_KEY = 'todo_data';

export const useTodoStore = defineStore('todo', () => {
  // State
  const todoCache = ref<CacheEntry<TodoData> | null>(null);
  const loading = ref(false);
  const error = ref('');

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    const storedTodos = CacheStorage.get<TodoData>(TODO_CACHE_KEY);
    if (storedTodos) {
      todoCache.value = storedTodos;
    } else {
      // Initialize with empty todo list if no cache exists
      const emptyTodoData: TodoData = { items: [] };
      const emptyEntry: CacheEntry<TodoData> = {
        data: emptyTodoData,
        timestamp: Date.now(),
        expiresAt: Date.now() + TODO_CACHE_DURATION,
      };
      todoCache.value = emptyEntry;
      CacheStorage.set(TODO_CACHE_KEY, emptyEntry);
    }
  };

  // Computed
  const isTodoCacheValid = computed(() => {
    if (!todoCache.value) return false;
    return Date.now() < todoCache.value.expiresAt;
  });

  const todos = computed(() => {
    return todoCache.value?.data.items || [];
  });

  const completedTodos = computed(() => {
    return todos.value.filter(todo => todo.completed);
  });

  const pendingTodos = computed(() => {
    return todos.value.filter(todo => !todo.completed);
  });

  const todoStats = computed(() => {
    const total = todos.value.length;
    const completed = completedTodos.value.length;
    const pending = pendingTodos.value.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  });

  // Helper function to save todos to cache
  const saveTodosToCache = (todoData: TodoData) => {
    const entry: CacheEntry<TodoData> = {
      data: todoData,
      timestamp: Date.now(),
      expiresAt: Date.now() + TODO_CACHE_DURATION,
    };

    todoCache.value = entry;
    CacheStorage.set(TODO_CACHE_KEY, entry);
  };

  // Actions
  const loadTodos = () => {
    // Initialize from storage if needed
    if (!todoCache.value) {
      initializeFromStorage();
    }
    return todoCache.value?.data || { items: [] };
  };

  const addTodo = (title: string) => {
    if (!title.trim()) {
      error.value = 'Todo title cannot be empty';
      return;
    }

    error.value = '';
    const currentData = loadTodos();

    const newTodo: TodoItem = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedData: TodoData = {
      items: [...currentData.items, newTodo],
    };

    saveTodosToCache(updatedData);
    return newTodo;
  };

  const updateTodo = (id: string, updates: Partial<Pick<TodoItem, 'title' | 'completed'>>) => {
    const currentData = loadTodos();
    const todoIndex = currentData.items.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
      error.value = 'Todo not found';
      return;
    }

    error.value = '';
    const updatedItems = [...currentData.items];
    updatedItems[todoIndex] = {
      ...updatedItems[todoIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    const updatedData: TodoData = {
      items: updatedItems,
    };

    saveTodosToCache(updatedData);
    return updatedItems[todoIndex];
  };

  const deleteTodo = (id: string) => {
    const currentData = loadTodos();
    const updatedItems = currentData.items.filter(todo => todo.id !== id);

    const updatedData: TodoData = {
      items: updatedItems,
    };

    saveTodosToCache(updatedData);
  };

  const toggleTodo = (id: string) => {
    const currentData = loadTodos();
    const todo = currentData.items.find(todo => todo.id === id);

    if (todo) {
      return updateTodo(id, { completed: !todo.completed });
    }
  };

  const clearCompleted = () => {
    const currentData = loadTodos();
    const updatedItems = currentData.items.filter(todo => !todo.completed);

    const updatedData: TodoData = {
      items: updatedItems,
    };

    saveTodosToCache(updatedData);
  };

  const clearAllTodos = () => {
    const updatedData: TodoData = {
      items: [],
    };

    saveTodosToCache(updatedData);
  };

  const clearCache = () => {
    todoCache.value = null;
    CacheStorage.remove(TODO_CACHE_KEY);
  };

  return {
    // State
    loading,
    error,

    // Computed
    isTodoCacheValid,
    todos,
    completedTodos,
    pendingTodos,
    todoStats,

    // Actions
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    clearCompleted,
    clearAllTodos,
    clearCache,
    initializeFromStorage,
  };
});
