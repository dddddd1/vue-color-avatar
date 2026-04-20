<template>
  <div
    v-if="props.visible"
    class="history-modal-wrapper"
    @click="emit('close')"
  >
    <div class="history-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ t('action.historyDialogTitle') }}</h3>
        <div class="header-actions">
          <input
            v-model="searchInput"
            type="text"
            class="search-input"
            :placeholder="t('action.searchPlaceholder')"
            @input="handleSearch"
          />
          <button
            v-if="historyStore.historyItems.length > 0"
            type="button"
            class="clear-all-btn"
            @click="handleClearAll"
          >
            {{ t('action.clearAll') }}
          </button>
        </div>
      </div>

      <div class="modal-body">
        <div v-if="isLoading" class="loading-container">
          <p>Loading...</p>
        </div>

        <div v-else-if="historyStore.filteredItems.length === 0" class="empty-container">
          <p v-if="historyStore.searchKeyword">{{ t('action.noSearchResults') }}</p>
          <p v-else>{{ t('action.noHistory') }}</p>
        </div>

        <div v-else class="history-grid">
          <div
            v-for="item in historyStore.currentPageItems"
            :key="item.id"
            class="history-item"
          >
            <div class="item-preview">
              <img :src="item.preview" :alt="item.name" class="preview-img" />
            </div>
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-date">{{ formatDate(item.createdAt) }}</p>
            </div>
            <div class="item-actions">
              <button
                type="button"
                class="action-btn restore-btn"
                :title="t('action.restore')"
                @click="handleRestore(item)"
              >
                <span class="btn-text">{{ t('action.restore') }}</span>
              </button>
              <button
                type="button"
                class="action-btn delete-btn"
                :title="t('action.delete')"
                @click="handleDelete(item.id)"
              >
                <span class="btn-text">{{ t('action.delete') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="historyStore.totalPages > 1" class="modal-footer">
        <div class="pagination">
          <button
            type="button"
            class="pagination-btn"
            :disabled="historyStore.currentPage === 1"
            @click="handlePageChange(historyStore.currentPage - 1)"
          >
            ←
          </button>
          <span class="pagination-info">
            {{ historyStore.currentPage }} / {{ historyStore.totalPages }}
          </span>
          <button
            type="button"
            class="pagination-btn"
            :disabled="historyStore.currentPage === historyStore.totalPages"
            @click="handlePageChange(historyStore.currentPage + 1)"
          >
            →
          </button>
        </div>
      </div>

      <button type="button" class="close-btn" @click="emit('close')">
        {{ t('action.close') }}
      </button>
    </div>
  </div>
<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useHistoryStore } from '@/store/history-store'
import type { AvatarHistoryItem } from '@/types'

const props = defineProps<{
  visible?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restore', option: AvatarHistoryItem['option']): void
}>()

const { t } = useI18n()
const historyStore = useHistoryStore()

const searchInput = ref('')
const isLoading = ref(false)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      isLoading.value = true
      searchInput.value = ''
      historyStore.setSearchKeyword('')
      historyStore.setCurrentPage(1)
      historyStore.loadFromStorage()
      setTimeout(() => {
        isLoading.value = false
      }, 300)
    }
  }
)

function handleSearch() {
  historyStore.setSearchKeyword(searchInput.value)
}

function handlePageChange(page: number) {
  historyStore.setCurrentPage(page)
}

function handleRestore(item: AvatarHistoryItem) {
  emit('restore', item.option)
  emit('close')
}

function handleDelete(id: string) {
  if (confirm(t('action.confirmDelete'))) {
    historyStore.deleteHistoryItem(id)
  }
}

function handleClearAll() {
  if (confirm(t('action.confirmClearAll'))) {
    historyStore.clearHistory()
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.history-modal-wrapper {
  position: fixed;
<<<<<<< HEAD
  bottom: 0;
=======
  top: 0;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
  left: 50%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem 0;
  overflow: hidden;
  transform: translate(-50%, 0);
  backdrop-filter: blur(0.3rem);

  @supports not (backdrop-filter: blur(0.3rem)) {
    background-color: rgba(var.$color-dark, 0.8);
  }
}

.history-modal {
  position: relative;
<<<<<<< HEAD
  width: 90%;
  max-width: 800px;
=======
  width: 80%;
  min-width: 320px;
  max-width: 900px;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
  max-height: 80vh;
  background-color: darken(var.$color-dark, 1);
  border: 0.15rem solid rgba(var.$color-accent, 0.8);
  border-radius: 1rem;
<<<<<<< HEAD
  overflow: hidden;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(var.$color-text, 0.1);

    h2 {
      margin: 0;
      color: var.$color-text;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .close-btn {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var.$color-text;
      font-size: 1.5rem;
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(var.$color-text, 0.1);
      }
    }
  }

  .modal-body {
    padding: 1.5rem;
    max-height: calc(80vh - 80px);
    overflow-y: auto;

    .search-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
=======
  display: flex;
  flex-direction: column;

  .modal-header {
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid rgba(var.$color-accent, 0.2);

    .modal-title {
      margin: 0 0 1rem 0;
      color: var.$color-text;
      font-size: 1.2rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
      gap: 1rem;

      .search-input {
        flex: 1;
<<<<<<< HEAD
        height: 2.5rem;
        padding: 0 1rem;
        color: var.$color-text;
        background-color: rgba(var.$color-text, 0.1);
        border: 1px solid rgba(var.$color-text, 0.2);
        border-radius: 0.6rem;
        outline: none;
=======
        padding: 0.5rem 1rem;
        background-color: lighten(var.$color-gray, 5);
        border: 1px solid rgba(var.$color-accent, 0.3);
        border-radius: 0.5rem;
        color: var.$color-text;
        font-size: 0.9rem;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)

        &::placeholder {
          color: rgba(var.$color-text, 0.5);
        }

        &:focus {
<<<<<<< HEAD
=======
          outline: none;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
          border-color: rgba(var.$color-accent, 0.8);
        }
      }

<<<<<<< HEAD
      .clear-btn {
        min-width: 6rem;
        height: 2.5rem;
        padding: 0 1rem;
        color: var.$color-text;
        font-weight: bold;
        background: var.$color-gray;
        border-radius: 0.6rem;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: lighten(var.$color-text, 10);
        }
      }
    }

    .history-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;

      .history-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background-color: rgba(var.$color-text, 0.05);
        border: 1px solid rgba(var.$color-text, 0.1);
        border-radius: 0.6rem;
=======
      .clear-all-btn {
        padding: 0.5rem 1rem;
        background-color: var.$color-gray;
        border: 1px solid rgba(var.$color-accent, 0.3);
        border-radius: 0.5rem;
        color: var.$color-text;
        font-size: 0.85rem;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
<<<<<<< HEAD
          border-color: rgba(var.$color-accent, 0.8);
          transform: translateY(-0.2rem);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .history-avatar {
          margin-bottom: 0.5rem;
        }

        .history-info {
          text-align: center;

          .history-time {
            font-size: 0.7rem;
            color: rgba(var.$color-text, 0.6);
=======
          background-color: lighten(var.$color-gray, 5);
          border-color: rgba(var.$color-accent, 0.8);
        }
      }
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;

    .loading-container,
    .empty-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var.$color-text;
      font-size: 1rem;
    }

    .history-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;

      @media screen and (max-width: var.$screen-md) {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }

      @media screen and (max-width: var.$screen-sm) {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }

      .history-item {
        background-color: lighten(var.$color-gray, 5);
        border: 1px solid rgba(var.$color-accent, 0.2);
        border-radius: 0.8rem;
        overflow: hidden;
        transition: all 0.2s;

        &:hover {
          border-color: rgba(var.$color-accent, 0.6);
          transform: translateY(-2px);
        }

        .item-preview {
          width: 100%;
          aspect-ratio: 1;
          background-color: var.$color-dark;
          display: flex;
          align-items: center;
          justify-content: center;

          .preview-img {
            width: 80%;
            height: 80%;
            object-fit: contain;
          }
        }

        .item-info {
          padding: 0.75rem;

          .item-name {
            margin: 0 0 0.25rem 0;
            color: var.$color-text;
            font-size: 0.9rem;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .item-date {
            margin: 0;
            color: rgba(var.$color-text, 0.6);
            font-size: 0.75rem;
          }
        }

        .item-actions {
          display: flex;
          padding: 0 0.75rem 0.75rem 0.75rem;
          gap: 0.5rem;

          .action-btn {
            flex: 1;
            padding: 0.4rem 0.6rem;
            border: 1px solid rgba(var.$color-accent, 0.3);
            border-radius: 0.4rem;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;

            .btn-text {
              white-space: nowrap;
            }

            &.restore-btn {
              background-color: var.$color-gray;
              color: var.$color-text;

              &:hover {
                background-color: lighten(var.$color-gray, 10);
                border-color: rgba(var.$color-accent, 0.8);
              }
            }

            &.delete-btn {
              background-color: rgba(255, 68, 68, 0.1);
              color: #ff6868;

              &:hover {
                background-color: rgba(255, 68, 68, 0.2);
                border-color: rgba(255, 68, 68, 0.6);
              }
            }
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
          }
        }
      }
    }
<<<<<<< HEAD

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(var.$color-text, 0.5);
      font-size: 1rem;
    }
=======
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(var.$color-accent, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)

    .pagination {
      display: flex;
      align-items: center;
<<<<<<< HEAD
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;

      .page-btn {
        min-width: 6rem;
        height: 2.5rem;
        padding: 0 1rem;
        color: var.$color-text;
        font-weight: bold;
        background: var.$color-gray;
        border-radius: 0.6rem;
        cursor: pointer;
        transition: color 0.2s;

        &:hover:not(:disabled) {
          color: lighten(var.$color-text, 10);
        }

        &:disabled {
          color: rgba(var.$color-text, 0.3);
=======
      gap: 1rem;

      .pagination-btn {
        width: 2.5rem;
        height: 2.5rem;
        background-color: var.$color-gray;
        border: 1px solid rgba(var.$color-accent, 0.3);
        border-radius: 0.5rem;
        color: var.$color-text;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background-color: lighten(var.$color-gray, 5);
          border-color: rgba(var.$color-accent, 0.8);
        }

        &:disabled {
          opacity: 0.5;
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
          cursor: not-allowed;
        }
      }

<<<<<<< HEAD
      .page-info {
=======
      .pagination-info {
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
        color: var.$color-text;
        font-size: 0.9rem;
      }
    }
  }
<<<<<<< HEAD
=======

  .close-btn {
    position: absolute;
    right: 1rem;
    bottom: -1rem;
    min-width: 5rem;
    height: 2.5rem;
    margin: 0 1rem;
    margin-left: auto;
    padding: 0 1rem;
    color: var.$color-text;
    font-weight: bold;
    background: var.$color-gray;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    user-select: none;

    &:hover {
      color: lighten(var.$color-text, 10);
      transform: translateY(-0.3rem);
    }
  }
>>>>>>> 3f12b42 (feat: 添加头像历史记录功能)
}
</style>