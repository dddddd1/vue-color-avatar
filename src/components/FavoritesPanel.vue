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
          <p class="empty-hint">{{ t('label.favoritesHint') }}</p>
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
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.favorites-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

.favorites-panel {
  width: 100%;
  max-width: 1000px;
  max-height: 85vh;
  background-color: var.$color-configurator;
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);

  .favorites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);

    .favorites-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: var.$color-text;
      display: flex;
      align-items: center;
      gap: 0.6rem;

      &::before {
        content: '⭐';
        font-size: 1.2rem;
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background-color: rgba(255, 255, 255, 0.08);
      color: var.$color-text;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.6rem;
      transition: all 0.2s ease;
      line-height: 1;

      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
        transform: rotate(90deg);
      }
    }
  }

  .favorites-toolbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 1.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    flex-wrap: wrap;
    background-color: rgba(255, 255, 255, 0.02);
  }

  .favorites-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .favorites-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .favorite-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.04);
    border-radius: 0.8rem;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    position: relative;
    cursor: pointer;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
    }

    &.selected {
      border-color: var.$color-accent;
      background-color: rgba(var.$color-accent, 0.1);
      box-shadow: 0 0 0 3px rgba(var.$color-accent, 0.2);
    }

    .favorite-checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-right: 1rem;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        border-color: var.$color-accent;
        background-color: rgba(var.$color-accent, 0.1);
      }

      .checkmark {
        color: var.$color-accent;
        font-weight: bold;
        font-size: 0.9rem;
      }
    }

    .favorite-preview {
      width: 70px;
      height: 70px;
      flex-shrink: 0;
      border-radius: 0.6rem;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .favorite-info {
      flex: 1;
      margin-left: 1rem;
      min-width: 0;

      .favorite-gender {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: var.$color-text;

        .gender-icon {
          font-size: 1.1rem;
        }
      }

      .favorite-time {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0.3rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .favorite-actions {
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.2s ease;

      .action-icon-btn {
        width: 32px;
        height: 32px;
        border: none;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-size: 1rem;

        &:hover {
          background-color: var.$color-accent;
          transform: scale(1.05);
        }

        &:last-child:hover {
          background-color: #ff6b6b;
        }
      }
    }

    &:hover .favorite-actions {
      opacity: 1;
    }
  }

  .favorites-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
    padding: 3rem;
    text-align: center;

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.6;
    }

    p {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .empty-hint {
      font-size: 0.85rem;
      margin-top: 0.5rem;
      opacity: 0.7;
    }
  }

  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    background-color: rgba(255, 255, 255, 0.08);
    color: var.$color-text;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    &.action-small {
      padding: 0.35rem 0.7rem;
      font-size: 0.8rem;
    }

    &.action-danger {
      background-color: rgba(255, 107, 107, 0.2);
      color: #ff6b6b;

      &:hover {
        background-color: #ff6b6b;
        color: white;
      }
    }

    &.action-primary {
      background-color: var.$color-accent;
      color: white;

      &:hover {
        background-color: lighten(var.$color-accent, 10);
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
    padding: 0.8rem;
  }

  .favorites-panel {
    max-height: 95vh;
    border-radius: 1rem;

    .favorites-header {
      padding: 1rem 1.2rem;

      .favorites-title {
        font-size: 1.2rem;
      }
    }

    .favorites-toolbar {
      padding: 0.8rem 1.2rem;
    }

    .favorites-content {
      padding: 1rem;
    }

    .favorites-list {
      grid-template-columns: 1fr;
    }

    .favorite-item {
      .favorite-actions {
        opacity: 1;
      }
    }
  }
}
</style>
