import { defineStore } from 'pinia'

import { WrapperShape } from '@/enums'
import type { AvatarOption, Sticker } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { SCREEN } from '@/utils/constant'

import {
  ADD_STICKER,
  CLEAR_STICKERS,
  REDO,
  REMOVE_STICKER,
  SET_AVATAR_OPTION,
  SET_SIDER_STATUS,
  UNDO,
  UPDATE_STICKER,
} from './mutation-type'

export interface State {
  history: {
    past: AvatarOption[]
    present: AvatarOption
    future: AvatarOption[]
  }
  isSiderCollapsed: boolean
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

    [ADD_STICKER](sticker: Sticker) {
      const newOption: AvatarOption = {
        ...this.history.present,
        stickers: [...this.history.present.stickers, sticker],
      }
      this[SET_AVATAR_OPTION](newOption)
    },

    [REMOVE_STICKER](stickerId: string) {
      const newOption: AvatarOption = {
        ...this.history.present,
        stickers: this.history.present.stickers.filter(
          (s) => s.id !== stickerId
        ),
      }
      this[SET_AVATAR_OPTION](newOption)
    },

    [UPDATE_STICKER](sticker: Partial<Sticker> & { id: string }) {
      const newOption: AvatarOption = {
        ...this.history.present,
        stickers: this.history.present.stickers.map((s) =>
          s.id === sticker.id ? { ...s, ...sticker } : s
        ),
      }
      this[SET_AVATAR_OPTION](newOption)
    },

    [CLEAR_STICKERS]() {
      const newOption: AvatarOption = {
        ...this.history.present,
        stickers: [],
      }
      this[SET_AVATAR_OPTION](newOption)
    },
  },
})
