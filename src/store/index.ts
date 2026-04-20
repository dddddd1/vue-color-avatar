import { defineStore } from 'pinia'

import { Gender, WrapperShape } from '@/enums'
import type { AvatarOption, FavoriteItem, FavoritesState } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { SCREEN } from '@/utils/constant'

import {
  ADD_FAVORITE,
  CLEAR_FAVORITES,
  REDO,
  REMOVE_FAVORITE,
  REMOVE_FAVORITES,
  SET_AVATAR_OPTION,
  SET_FAVORITES,
  SET_SELECTED_FAVORITES,
  SET_SIDER_STATUS,
  TOGGLE_FAVORITES_PANEL,
  UNDO,
} from './mutation-type'

const FAVORITES_STORAGE_KEY = 'vue-color-avatar-favorites'

function loadFavoritesFromStorage(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load favorites from storage:', e)
  }
  return []
}

function saveFavoritesToStorage(items: FavoriteItem[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save favorites to storage:', e)
  }
}

export interface State {
  history: {
    past: AvatarOption[]
    present: AvatarOption
    future: AvatarOption[]
  }
  isSiderCollapsed: boolean
  favorites: FavoritesState
}

export const useStore = defineStore('store', {
  state: () =>
    ({
      history: {
        past: [],
        present: getRandomAvatarOption({ wrapperShape: WrapperShape.Squircle }),
        future: [],
      },
      isSiderCollapsed: window.innerWidth <= SCREEN.lg,
      favorites: {
        items: loadFavoritesFromStorage(),
        isPanelOpen: false,
        selectedIds: new Set<string>(),
      },
    } as State),
  actions: {
    [SET_AVATAR_OPTION](data: AvatarOption) {
      this.history = {
        past: [...this.history.past, this.history.present],
        present: data,
        future: [],
      }
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

    [ADD_FAVORITE](avatarOption: AvatarOption) {
      const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newItem: FavoriteItem = {
        id,
        avatarOption,
        createdAt: Date.now(),
        gender: avatarOption.gender || Gender.NotSet,
      }
      this.favorites.items = [newItem, ...this.favorites.items]
      saveFavoritesToStorage(this.favorites.items)
    },

    [REMOVE_FAVORITE](id: string) {
      this.favorites.items = this.favorites.items.filter((item) => item.id !== id)
      this.favorites.selectedIds.delete(id)
      saveFavoritesToStorage(this.favorites.items)
    },

    [REMOVE_FAVORITES](ids: string[]) {
      this.favorites.items = this.favorites.items.filter(
        (item) => !ids.includes(item.id)
      )
      ids.forEach((id) => this.favorites.selectedIds.delete(id))
      saveFavoritesToStorage(this.favorites.items)
    },

    [CLEAR_FAVORITES]() {
      this.favorites.items = []
      this.favorites.selectedIds.clear()
      saveFavoritesToStorage(this.favorites.items)
    },

    [SET_FAVORITES](items: FavoriteItem[]) {
      this.favorites.items = items
      this.favorites.selectedIds.clear()
      saveFavoritesToStorage(this.favorites.items)
    },

    [TOGGLE_FAVORITES_PANEL]() {
      this.favorites.isPanelOpen = !this.favorites.isPanelOpen
    },

    [SET_SELECTED_FAVORITES](ids: string[]) {
      this.favorites.selectedIds = new Set(ids)
    },
  },
})
