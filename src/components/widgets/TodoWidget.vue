<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ListTodo, Plus, Check, Trash2, ListChecks } from 'lucide-vue-next';
import { useTodoStore } from '../../stores';
import type { TodoItem } from '../../stores/types';
import WidgetCard from './WidgetCard.vue';
import UiButton from '../ui/UiButton.vue';
import EmptyState from '../ui/EmptyState.vue';
import Modal from '../ui/Modal.vue';

const todoStore = useTodoStore();
const newTodoTitle = ref('');
const editingId = ref<string | null>(null);
const editingTitle = ref('');
const showClearAllConfirm = ref(false);
const editInput = ref<HTMLInputElement | null>(null);

const sortedTodos = computed(() => {
  return [...todoStore.todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
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
  if (todo.completed) return;
  editingId.value = todo.id;
  editingTitle.value = todo.title;
  nextTick(() => {
    editInput.value?.focus();
    editInput.value?.select();
  });
};

const saveEdit = (todoId: string) => {
  if (editingTitle.value.trim()) {
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

onMounted(() => todoStore.initializeFromStorage());
</script>

<template>
  <WidgetCard title="Tasks" :icon="ListTodo" widgetName="todo" displayName="Todo">
    <template #actions>
      <span class="text-xs text-[color:var(--color-fg-muted)] tabular-nums">
        {{ todoStore.todoStats.pending }} / {{ todoStore.todoStats.total }}
      </span>
    </template>

    <div v-if="todoStore.todoStats.total > 0" class="mb-4">
      <div class="flex items-center justify-between text-xs text-[color:var(--color-fg-muted)] mb-1.5">
        <span>Progress</span>
        <span class="tabular-nums">{{ todoStore.todoStats.completionRate }}%</span>
      </div>
      <div class="w-full bg-[color:var(--color-surface-2)] rounded-full h-1.5 overflow-hidden">
        <div
          class="h-full rounded-full bg-[color:var(--color-brand-600)] transition-all duration-300 ease-out"
          :style="{ width: `${todoStore.todoStats.completionRate}%` }"
        ></div>
      </div>
    </div>

    <form @submit.prevent="addNewTodo" class="mb-4">
      <div class="flex gap-2">
        <input
          v-model="newTodoTitle"
          type="text"
          placeholder="Add a task…"
          maxlength="200"
          class="ui-input flex-1"
        />
        <UiButton
          type="submit"
          variant="primary"
          :disabled="!newTodoTitle.trim()"
          :leading-icon="Plus"
        >
          Add
        </UiButton>
      </div>
      <p v-if="todoStore.error" class="text-xs text-[color:var(--color-danger)] mt-2">
        {{ todoStore.error }}
      </p>
    </form>

    <EmptyState
      v-if="todoStore.todos.length === 0"
      :icon="ListChecks"
      title="No tasks yet"
      description="Add your first task above to start tracking what needs to get done."
    />

    <TransitionGroup
      v-else
      name="ui-list"
      tag="div"
      class="space-y-1.5"
    >
      <div
        v-for="todo in sortedTodos"
        :key="todo.id"
        class="group flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 transition-colors hover:bg-[color:var(--color-surface-2)]"
        :class="{ 'opacity-60': todo.completed }"
      >
        <button
          class="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
          :class="
            todo.completed
              ? 'bg-[color:var(--color-brand-600)] border-[color:var(--color-brand-600)] text-white'
              : 'border-[color:var(--color-border-strong)] hover:border-[color:var(--color-brand-500)]'
          "
          :aria-label="todo.completed ? 'Mark as incomplete' : 'Mark as complete'"
          @click="todoStore.toggleTodo(todo.id)"
        >
          <Check v-if="todo.completed" class="h-3 w-3" stroke-width="3" />
        </button>

        <div class="flex-1 min-w-0">
          <div
            v-if="!editingId || editingId !== todo.id"
            class="cursor-pointer text-sm text-[color:var(--color-fg)] truncate"
            :class="{ 'line-through text-[color:var(--color-fg-subtle)]': todo.completed }"
            @dblclick="startEditing(todo)"
          >
            {{ todo.title }}
          </div>
          <input
            v-else
            ref="editInput"
            v-model="editingTitle"
            class="ui-input w-full"
            maxlength="200"
            @blur="saveEdit(todo.id)"
            @keyup.enter="saveEdit(todo.id)"
            @keyup.escape="cancelEdit"
          />
        </div>

        <button
          class="ui-icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
          :aria-label="`Delete ${todo.title}`"
          @click="todoStore.deleteTodo(todo.id)"
        >
          <Trash2 class="text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-danger)]" />
        </button>
      </div>
    </TransitionGroup>

    <div
      v-if="todoStore.todos.length > 0"
      class="mt-5 flex gap-2 justify-between border-t border-[color:var(--color-border)] pt-4"
    >
      <UiButton
        v-if="todoStore.completedTodos.length > 0"
        variant="ghost"
        size="sm"
        @click="todoStore.clearCompleted"
      >
        Clear completed ({{ todoStore.completedTodos.length }})
      </UiButton>
      <span v-else />
      <UiButton variant="danger" size="sm" @click="showClearAllConfirm = true">
        Clear all
      </UiButton>
    </div>

    <Modal :open="showClearAllConfirm" title="Clear all tasks?" @close="showClearAllConfirm = false">
      <p class="text-sm text-[color:var(--color-fg-muted)] mb-5">
        This will permanently delete all tasks. This action can't be undone.
      </p>
      <div class="flex gap-2 justify-end">
        <UiButton variant="ghost" @click="showClearAllConfirm = false">Cancel</UiButton>
        <UiButton variant="primary" @click="confirmClearAll">Clear all</UiButton>
      </div>
    </Modal>
  </WidgetCard>
</template>

<style scoped>
.ui-list-enter-active,
.ui-list-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.ui-list-enter-from,
.ui-list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.ui-list-leave-active {
  position: absolute;
}
</style>
