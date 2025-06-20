<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div v-if="$route.name !== 'Full Screen'" class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Todo List</h2>
      <div class="flex items-center gap-2">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ todoStore.todoStats.pending }} / {{ todoStore.todoStats.total }} tasks
        </div>
        <ExpandWidget widgetName="todo" displayName="Todo" />
      </div>
    </div>

    <div class="h-full overflow-y-auto">
      <!-- Progress bar -->
      <div v-if="todoStore.todoStats.total > 0" class="mb-6">
        <div
          class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2"
        >
          <span>Progress</span>
          <span>{{ todoStore.todoStats.completionRate }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${todoStore.todoStats.completionRate}%` }"
          ></div>
        </div>
      </div>

      <!-- Add new todo form -->
      <form @submit.prevent="addNewTodo" class="mb-6">
        <div class="flex gap-2">
          <input
            v-model="newTodoTitle"
            type="text"
            placeholder="Add a new task..."
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxlength="200"
          />
          <button
            type="submit"
            :disabled="!newTodoTitle.trim()"
            class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <div v-if="todoStore.error" class="text-red-500 dark:text-red-400 text-sm mt-2">
          {{ todoStore.error }}
        </div>
      </form>

      <!-- Todo list -->
      <div class="space-y-2">
        <!-- Empty state -->
        <div v-if="todoStore.todos.length === 0" class="text-center h-full overflow-y-auto">
          <div
            class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
            Stay organized with todos
          </h3>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Create and manage your tasks to stay productive. Add your first task above to get
            started.
          </p>
        </div>

        <!-- Todo items -->
        <div
          v-for="todo in sortedTodos"
          :key="todo.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'opacity-60': todo.completed }"
        >
          <!-- Checkbox -->
          <button
            @click="todoStore.toggleTodo(todo.id)"
            class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
            :class="
              todo.completed
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-400'
            "
          >
            <svg v-if="todo.completed" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Todo text -->
          <div class="flex-1 min-w-0">
            <div
              v-if="!editingId || editingId !== todo.id"
              @dblclick="startEditing(todo)"
              class="cursor-pointer text-gray-900 dark:text-gray-200"
              :class="{ 'line-through text-gray-500 dark:text-gray-400': todo.completed }"
            >
              {{ todo.title }}
            </div>
            <input
              v-else
              v-model="editingTitle"
              @blur="saveEdit(todo.id)"
              @keyup.enter="saveEdit(todo.id)"
              @keyup.escape="cancelEdit"
              class="w-full px-2 py-1 border border-blue-300 dark:border-blue-500 dark:bg-gray-700 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              ref="editInput"
              maxlength="200"
            />
          </div>

          <!-- Delete button -->
          <button
            @click="todoStore.deleteTodo(todo.id)"
            class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="todoStore.todos.length > 0" class="mt-6 flex gap-2 justify-between">
        <div class="flex gap-2">
          <button
            v-if="todoStore.completedTodos.length > 0"
            @click="todoStore.clearCompleted"
            class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear completed ({{ todoStore.completedTodos.length }})
          </button>
        </div>
        <button
          @click="showClearAllConfirm = true"
          class="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
        >
          Clear all
        </button>
      </div>

      <!-- Clear all confirmation modal -->
      <div
        v-if="showClearAllConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click="showClearAllConfirm = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4" @click.stop>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Clear all tasks?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">This action cannot be undone.</p>
          <div class="flex gap-2 justify-end">
            <button
              @click="showClearAllConfirm = false"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmClearAll"
              class="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, nextTick } from 'vue';
import { useTodoStore } from '../../stores';
import type { TodoItem } from '../../stores/types';
import ExpandWidget from './ExpandWidget.vue';

export default defineComponent({
  name: 'TodoWidget',
  components: {
    ExpandWidget,
  },
  setup() {
    const todoStore = useTodoStore();
    const newTodoTitle = ref('');
    const editingId = ref<string | null>(null);
    const editingTitle = ref('');
    const showClearAllConfirm = ref(false);
    const editInput = ref<HTMLInputElement | null>(null);

    // Sort todos: pending first, then completed, each group sorted by creation time (newest first)
    const sortedTodos = computed(() => {
      const todos = [...todoStore.todos];
      return todos.sort((a, b) => {
        // First sort by completion status (pending first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then sort by creation time (newest first)
        return b.createdAt - a.createdAt;
      });
    });

    const addNewTodo = () => {
      if (newTodoTitle.value.trim()) {
        todoStore.addTodo(newTodoTitle.value);
        newTodoTitle.value = '';
      }
    };

    const startEditing = (todo: TodoItem) => {
      if (todo.completed) return; // Don't allow editing completed todos

      editingId.value = todo.id;
      editingTitle.value = todo.title;

      nextTick(() => {
        if (editInput.value) {
          editInput.value.focus();
          editInput.value.select();
        }
      });
    };

    const saveEdit = (todoId: string) => {
      if (editingTitle.value.trim() && editingTitle.value.trim() !== '') {
        todoStore.updateTodo(todoId, { title: editingTitle.value.trim() });
      }
      cancelEdit();
    };

    const cancelEdit = () => {
      editingId.value = null;
      editingTitle.value = '';
    };

    const confirmClearAll = () => {
      todoStore.clearAllTodos();
      showClearAllConfirm.value = false;
    };

    onMounted(() => {
      todoStore.initializeFromStorage();
    });

    return {
      todoStore,
      newTodoTitle,
      editingId,
      editingTitle,
      showClearAllConfirm,
      editInput,
      sortedTodos,
      addNewTodo,
      startEditing,
      saveEdit,
      cancelEdit,
      confirmClearAll,
    };
  },
});
</script>
