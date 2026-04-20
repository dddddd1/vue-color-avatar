import { defineStore } from 'pinia'

import { WrapperShape } from '@/enums'
import type { AvatarOption } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { SCREEN } from '@/utils/constant'

import {
  REDO,
  SET_AVATAR_OPTION,
  SET_SIDER_STATUS,
  UNDO,
  ADD_HISTORY_RECORD,
  CLEAR_HISTORY,
  RESTORE_FROM_HISTORY,
  SET_HISTORY_SEARCH,
  SET_HISTORY_PAGE,
} from './mutation-type'

interface HistoryRecord {
  id: string
  timestamp: number
  option: AvatarOption
}

export interface State {
  history: {
    past: AvatarOption[]
    present: AvatarOption
    future: AvatarOption[]
  }
  historyRecords: HistoryRecord[]
  historySearch: string
  historyPage: number
  historyPageSize: number
  isSiderCollapsed: boolean
}

const STORAGE_KEY = 'vue-color-avatar-history'
const MAX_HISTORY_RECORDS = 100

function loadHistoryFromStorage(): HistoryRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const records = JSON.parse(stored)
      return Array.isArray(records) ? records : []
    }
  } catch (error) {
    console.error('Failed to load history from storage:', error)
  }
  return []
}

function saveHistoryToStorage(records: HistoryRecord[]): void {
  try {
    const limitedRecords = records.slice(0, MAX_HISTORY_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedRecords))
  } catch (error) {
    console.error('Failed to save history to storage:', error)
  }
}

export const useStore = defineStore('store', {
  state: () =>
    ({
      history: {
        past: [],
        present: getRandomAvatarOption({ wrapperShape: WrapperShape.Squircle }),
        future: [],
      },
      historyRecords: loadHistoryFromStorage(),
      historySearch: '',
      historyPage: 1,
      historyPageSize: 10,
      isSiderCollapsed: window.innerWidth <= SCREEN.lg,
    } as State),
  getters: {
    filteredHistoryRecords: (state) => {
      let records = [...state.historyRecords]
      
      if (state.historySearch) {
        const searchLower = state.historySearch.toLowerCase()
        records = records.filter(record => {
          const optionStr = JSON.stringify(record.option).toLowerCase()
          return optionStr.includes(searchLower)
        })
      }
      
      return records.sort((a, b) => b.timestamp - a.timestamp)
    },
    paginatedHistoryRecords: (state) => {
      const records = state.filteredHistoryRecords
      const start = (state.historyPage - 1) * state.historyPageSize
      const end = start + state.historyPageSize
      return records.slice(start, end)
    },
    totalHistoryPages: (state) => {
      const total = state.filteredHistoryRecords.length
      return Math.ceil(total / state.historyPageSize)
    },
  },
  actions: {
    [SET_AVATAR_OPTION](data: AvatarOption) {
      this.history = {
        past: [...this.history.past, this.history.present],
        present: data,
        future: [],
      }
      this[ADD_HISTORY_RECORD](data)
    },

    [UNDO]() {
      if (this.history.past.length > 0) {
        const previous = this.history.past[this.history.past.length - 1]
        const newPast = this.history.past.slice(0, this.history.past.length - 1)
        this.history = {
          past: newPast,
          present: previous,
          future: [this.history.present, ...this.history.future],
        }
      }
    },

    [REDO]() {
      if (this.history.future.length > 0) {
        const next = this.history.future[0]
        const newFuture = this.history.future.slice(1)
        this.history = {
          past: [...this.history.past, this.history.present],
          present: next,
          future: newFuture,
        }
      }
    },

    [SET_SIDER_STATUS](collapsed: boolean) {
      if (collapsed !== this.isSiderCollapsed) {
        this.isSiderCollapsed = collapsed
      }
    },

    [ADD_HISTORY_RECORD](option: AvatarOption) {
      const record: HistoryRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        option: JSON.parse(JSON.stringify(option)),
      }
      
      this.historyRecords = [record, ...this.historyRecords]
      saveHistoryToStorage(this.historyRecords)
    },

    [CLEAR_HISTORY]() {
      this.historyRecords = []
      this.historySearch = ''
      this.historyPage = 1
      saveHistoryToStorage(this.historyRecords)
    },

    [RESTORE_FROM_HISTORY](record: HistoryRecord) {
      this[SET_AVATAR_OPTION](record.option)
    },

    [SET_HISTORY_SEARCH](search: string) {
      this.historySearch = search
      this.historyPage = 1
    },

    [SET_HISTORY_PAGE](page: number) {
      this.historyPage = page
    },
  },
})
