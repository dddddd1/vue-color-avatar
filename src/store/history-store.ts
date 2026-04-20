import { defineStore } from 'pinia'

import type {
  AvatarHistoryItem,
  AvatarHistorySearchParams,
  AvatarHistoryPaginationResult,
} from '@/types'

const HISTORY_STORAGE_KEY = 'vue-color-avatar-history'
const MAX_HISTORY_ITEMS = 100
const DEFAULT_PAGE_SIZE = 12

export const useHistoryStore = defineStore('history', {
  state: () => ({
    historyItems: [] as AvatarHistoryItem[],
    searchKeyword: '',
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  }),

  getters: {
    filteredItems: (state): AvatarHistoryItem[] => {
      if (!state.searchKeyword) {
        return state.historyItems
      }
      const keyword = state.searchKeyword.toLowerCase()
      return state.historyItems.filter((item) =>
        item.name.toLowerCase().includes(keyword)
      )
    },

    totalItems: (state): number => {
      const filtered = state.searchKeyword
        ? state.historyItems.filter((item) =>
            item.name.toLowerCase().includes(state.searchKeyword.toLowerCase())
          )
        : state.historyItems
      return filtered.length
    },

    totalPages: (state): number => {
      const filtered = state.searchKeyword
        ? state.historyItems.filter((item) =>
            item.name.toLowerCase().includes(state.searchKeyword.toLowerCase())
          )
        : state.historyItems
      return Math.ceil(filtered.length / state.pageSize)
    },

    currentPageItems: (state): AvatarHistoryItem[] => {
      const filtered = state.searchKeyword
        ? state.historyItems.filter((item) =>
            item.name.toLowerCase().includes(state.searchKeyword.toLowerCase())
          )
        : state.historyItems
      const start = (state.currentPage - 1) * state.pageSize
      const end = start + state.pageSize
      return filtered.slice(start, end)
    },
  },

  actions: {
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
        if (stored) {
          this.historyItems = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Failed to load history from storage:', error)
        this.historyItems = []
      }
    },

    saveToStorage() {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.historyItems))
      } catch (error) {
        console.error('Failed to save history to storage:', error)
      }
    },

    addHistoryItem(item: Omit<AvatarHistoryItem, 'id' | 'createdAt'>) {
      const newItem: AvatarHistoryItem = {
        ...item,
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      }

      if (this.historyItems.length >= MAX_HISTORY_ITEMS) {
        this.historyItems.pop()
      }

      this.historyItems.unshift(newItem)
      this.saveToStorage()
      return newItem
    },

    updateHistoryItem(id: string, updates: Partial<AvatarHistoryItem>) {
      const index = this.historyItems.findIndex((item) => item.id === id)
      if (index !== -1) {
        this.historyItems[index] = {
          ...this.historyItems[index],
          ...updates,
        }
        this.saveToStorage()
        return this.historyItems[index]
      }
      return null
    },

    deleteHistoryItem(id: string) {
      const index = this.historyItems.findIndex((item) => item.id === id)
      if (index !== -1) {
        this.historyItems.splice(index, 1)
        this.saveToStorage()

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages
        }
        return true
      }
      return false
    },

    clearHistory() {
      this.historyItems = []
      this.searchKeyword = ''
      this.currentPage = 1
      this.saveToStorage()
    },

    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
      this.currentPage = 1
    },

    setCurrentPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    setPageSize(size: number) {
      this.pageSize = size
      this.currentPage = 1
    },

    search(
      params: AvatarHistorySearchParams = {}
    ): AvatarHistoryPaginationResult {
      const { keyword = '', page = 1, pageSize = DEFAULT_PAGE_SIZE } = params

      let items = this.historyItems

      if (keyword) {
        const lowerKeyword = keyword.toLowerCase()
        items = items.filter((item) =>
          item.name.toLowerCase().includes(lowerKeyword)
        )
      }

      const total = items.length
      const totalPages = Math.ceil(total / pageSize)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedItems = items.slice(start, end)

      return {
        items: paginatedItems,
        total,
        page,
        pageSize,
        totalPages,
      }
    },

    getHistoryItemById(id: string): AvatarHistoryItem | undefined {
      return this.historyItems.find((item) => item.id === id)
    },
  },
})