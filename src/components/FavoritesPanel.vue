<template>
  <transition name="fade">
    <div
      v-if="isOpen"
      class="favorites-panel-overlay"
      @click.self="handleClose"
    >
      <div class="favorites-panel">
        <div class="favorites-header">
          <h3 class="favorites-title">{{ t('label.favorites') }}</h3>
          <button
            class="close-btn"
            @click="handleClose"
          >
            ×
          </button>
        </div>

        <div class="favorites-toolbar">
          <button
            v-if="hasSelected"
            class="action-btn action-small action-danger"
            @click="handleDeleteSelected"
          >
            {{ t('action.deleteSelected') }} ({{ selectedCount }})
          </button>
          <template v-else-if="items.length > 0">
            <button
              class="action-btn action-small"
              @click="handleSelectAll"
            >
              {{ allSelected ? t('action.deselectAll') : t('action.selectAll') }}
            </button>
            <button
              class="action-btn action-small"
              @click="handleExport"
            >
              {{ t('action.exportFavorites') }}
            </button>
          </template>
          <label class="action-btn action-small import-btn">
            {{ t('action.importFavorites') }}
            <input
              type="file"
              accept=".json"
              class="hidden-input"
              @change="handleImport"
            />
          </label>
        </div>

        <div class="favorites-content" v-if="items.length > 0">
          <div class="favorites-list">
            <div
              v-for="item in items"
              :key="item.id"
              class="favorite-item"
              :class="{ selected: selectedIds.has(item.id) }"
            >
              <div
                class="favorite-checkbox"
                @click="toggleSelection(item.id)"
              >
                <span v-if="selectedIds.has(item.id)" class="checkmark">✓</span>
              </div>
              <div class="favorite-preview">
                <VueColorAvatar
                  :option="item.avatarOption"
                  :size="80"
                />
              </div>
              <div class="favorite-info">
                <div class="favorite-gender">
                  <span class="gender-icon">{{ getGenderIcon(item.gender) }}</span>
                  <span>{{ t(`gender.${item.gender || Gender.NotSet}`) }}</span>
                </div>
                <div class="favorite-time">
                  {{ formatDate(item.createdAt) }}
                </div>
              </div>
              <div class="favorite-actions">
                <button
                  class="action-icon-btn"
                  :title="t('action.applyFavorite')"
                  @click="handleApply(item)"
                >
                  🎨
                </button>
                <button
                  class="action-icon-btn"
                  :title="t('action.deleteFavorite')"
                  @click="handleDelete(item.id)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="favorites-empty">
          <div class="empty-icon">⭐</div>
          <p>{{ t('label.favoritesEmpty') }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import VueColorAvatar from '@/components/VueColorAvatar.vue'
import { Gender } from '@/enums'
import { useAvatarOption } from '@/hooks'
import { useStore } from '@/store'
import {
  ADD_FAVORITE,
  CLEAR_FAVORITES,
  REMOVE_FAVORITE,
  REMOVE_FAVORITES,
  SET_FAVORITES,
  SET_SELECTED_FAVORITES,
  TOGGLE_FAVORITES_PANEL,
} from '@/store/mutation-type'
import type { AvatarOption, FavoriteItem } from '@/types'

const { t } = useI18n()
const store = useStore()
const [, setAvatarOption] = useAvatarOption()

const isOpen = computed(() => store.favorites.isPanelOpen)
const items = computed(() => store.favorites.items)
const selectedIds = computed(() => store.favorites.selectedIds)

const hasSelected = computed(() => selectedIds.value.size > 0)
const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => items.value.length > 0 && selectedIds.value.size === items.value.length)

function getGenderIcon(gender?: Gender): string {
  switch (gender) {
    case Gender.Male:
      return '♂'
    case Gender.Female:
      return '♀'
    default:
      return '⚤'
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function toggleSelection(id: string) {
  const newSelected = new Set(selectedIds.value)
  if (newSelected.has(id)) {
    newSelected.delete(id)
  } else {
    newSelected.add(id)
  }
  store[SET_SELECTED_FAVORITES](Array.from(newSelected))
}

function handleSelectAll() {
  if (allSelected.value) {
    store[SET_SELECTED_FAVORITES]([])
  } else {
    store[SET_SELECTED_FAVORITES](items.value.map((item) => item.id))
  }
}

function handleClose() {
  store[TOGGLE_FAVORITES_PANEL]()
}

function handleApply(item: FavoriteItem) {
  setAvatarOption(item.avatarOption)
}

function handleDelete(id: string) {
  store[REMOVE_FAVORITE](id)
}

function handleDeleteSelected() {
  const idsToDelete = Array.from(selectedIds.value)
  store[REMOVE_FAVORITES](idsToDelete)
}

function handleExport() {
  const exportData = items.value.map((item) => ({
    ...item,
    id: undefined,
    createdAt: undefined,
  }))

  const dataStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `vue-color-avatar-favorites-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const importedItems = JSON.parse(content) as Array<{ avatarOption: AvatarOption; gender?: Gender }>

      const newItems: FavoriteItem[] = importedItems.map((item) => ({
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        avatarOption: item.avatarOption,
        createdAt: Date.now(),
        gender: item.gender || Gender.NotSet,
      }))

      const mergedItems = [...newItems, ...items.value]
      store[SET_FAVORITES](mergedItems)
    } catch (error) {
      console.error('Failed to import favorites:', error)
      alert('导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

defineExpose({
  addFavorite: (option: AvatarOption) => store[ADD_FAVORITE](option),
  removeFavorite: (id: string) => store[REMOVE_FAVORITE](id),
  clearAll: () => store[CLEAR_FAVORITES](),
})
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.fade-enter-active,
.fade-leave-active {
  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.25s ease, transform 0.2s;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.favorites-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(0.1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.favorites-panel {
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  background-color: var.$color-configurator;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  .favorites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid rgba(var.$color-text, 0.1);
    flex-shrink: 0;

    .favorites-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: bold;
      color: var.$color-text;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background-color: transparent;
      color: var.$color-text;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;

      &:hover {
        background-color: lighten(var.$color-configurator, 10);
      }
    }
  }

  .favorites-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    border-bottom: 1px solid rgba(var.$color-text, 0.05);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .favorites-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .favorites-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.8rem;
  }

  .favorite-item {
    display: flex;
    align-items: center;
    padding: 0.8rem;
    background-color: lighten(var.$color-configurator, 3);
    border-radius: 0.6rem;
    transition: all 0.2s;
    border: 2px solid transparent;

    &.selected {
      border-color: var.$color-accent;
      background-color: lighten(var.$color-configurator, 8);
    }

    .favorite-checkbox {
      width: 22px;
      height: 22px;
      border: 2px solid var.$color-text;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-right: 0.8rem;
      transition: all 0.2s;

      .checkmark {
        color: var.$color-accent;
        font-weight: bold;
        font-size: 0.8rem;
      }
    }

    .favorite-preview {
      width: 60px;
      height: 60px;
      flex-shrink: 0;
    }

    .favorite-info {
      flex: 1;
      margin-left: 0.8rem;
      min-width: 0;

      .favorite-gender {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.85rem;
        color: var.$color-text;

        .gender-icon {
          font-size: 1rem;
        }
      }

      .favorite-time {
        font-size: 0.7rem;
        color: darken(var.$color-text, 25);
        margin-top: 0.2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .favorite-actions {
      display: flex;
      gap: 0.2rem;
      flex-shrink: 0;

      .action-icon-btn {
        width: 28px;
        height: 28px;
        border: none;
        background-color: lighten(var.$color-configurator, 8);
        border-radius: 0.3rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-size: 0.9rem;

        &:hover {
          background-color: lighten(var.$color-configurator, 15);
        }
      }
    }
  }

  .favorites-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: darken(var.$color-text, 35);
    padding: 2rem;

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    p {
      margin: 0;
      font-size: 1rem;
    }
  }

  .action-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    background-color: lighten(var.$color-configurator, 8);
    color: var.$color-text;
    border-radius: 0.4rem;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      background-color: lighten(var.$color-configurator, 15);
    }

    &.action-small {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
    }

    &.action-danger {
      background-color: #ff6b6b;
      color: white;

      &:hover {
        background-color: #ff5252;
      }
    }
  }

  .import-btn {
    position: relative;

    .hidden-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      left: 0;
      top: 0;
    }
  }
}

@media screen and (max-width: var.$screen-sm) {
  .favorites-panel-overlay {
    padding: 0.5rem;
  }

  .favorites-panel {
    max-height: 95vh;

    .favorites-header {
      padding: 1rem;
    }

    .favorites-toolbar {
      padding: 0.6rem 1rem;
    }

    .favorites-list {
      grid-template-columns: 1fr;
    }
  }
}
</style>
