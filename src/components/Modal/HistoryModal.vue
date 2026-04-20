<template>
  <div
    v-if="props.visible"
    class="history-modal-wrapper"
    @click="emit('close')"
  >
    <div class="history-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('history.title') }}</h2>
        <button type="button" class="close-btn" @click="emit('close')">
          ×
        </button>
      </div>

      <div class="modal-body">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="{{ t('history.searchPlaceholder') }}"
            class="search-input"
            @input="handleSearch"
          />
          <button type="button" class="clear-btn" @click="handleClearHistory">
            {{ t('history.clear') }}
          </button>
        </div>

        <div class="history-list" v-if="paginatedRecords.length > 0">
          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="history-item"
            @click="handleRestore(record)"
          >
            <div class="history-avatar">
              <VueColorAvatar :option="record.option" :size="80" />
            </div>
            <div class="history-info">
              <div class="history-time">{{ formatTime(record.timestamp) }}</div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>{{ t('history.empty') }}</p>
        </div>

        <div class="pagination" v-if="totalPages > 1">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            {{ t('history.previous') }}
          </button>
          <span class="page-info">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            {{ t('history.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import VueColorAvatar from '@/components/VueColorAvatar.vue'
import { useStore } from '@/store'
import {
  CLEAR_HISTORY,
  RESTORE_FROM_HISTORY,
  SET_HISTORY_PAGE,
  SET_HISTORY_SEARCH,
} from '@/store/mutation-type'

const props = defineProps<{ visible?: boolean }>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useStore()
const { t } = useI18n()

const searchQuery = ref('')

const paginatedRecords = computed(() => store.paginatedHistoryRecords)
const totalPages = computed(() => store.totalHistoryPages)
const currentPage = computed(() => store.historyPage)

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function handleSearch() {
  store[SET_HISTORY_SEARCH](searchQuery.value)
}

function handleClearHistory() {
  if (confirm(t('history.confirmClear'))) {
    store[CLEAR_HISTORY]()
  }
}

function handleRestore(record: any) {
  store[RESTORE_FROM_HISTORY](record)
  emit('close')
}

function handlePageChange(page: number) {
  store[SET_HISTORY_PAGE](page)
}

watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      // Reset search and page when opening modal
      searchQuery.value = ''
      store[SET_HISTORY_SEARCH]('')
      store[SET_HISTORY_PAGE](1)
    }
  }
)
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.history-modal-wrapper {
  position: fixed;
  bottom: 0;
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
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background-color: darken(var.$color-dark, 1);
  border: 0.15rem solid rgba(var.$color-accent, 0.8);
  border-radius: 1rem;
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
      gap: 1rem;

      .search-input {
        flex: 1;
        height: 2.5rem;
        padding: 0 1rem;
        color: var.$color-text;
        background-color: rgba(var.$color-text, 0.1);
        border: 1px solid rgba(var.$color-text, 0.2);
        border-radius: 0.6rem;
        outline: none;

        &::placeholder {
          color: rgba(var.$color-text, 0.5);
        }

        &:focus {
          border-color: rgba(var.$color-accent, 0.8);
        }
      }

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
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
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
          }
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(var.$color-text, 0.5);
      font-size: 1rem;
    }

    .pagination {
      display: flex;
      align-items: center;
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
          cursor: not-allowed;
        }
      }

      .page-info {
        color: var.$color-text;
        font-size: 0.9rem;
      }
    }
  }
}
</style>