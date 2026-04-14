import { defineStore } from 'pinia'

import { MultiAvatarMode, MultiAvatarPreset, WrapperShape } from '@/enums'
import type { AvatarOption, MultiAvatarConfig, MultiAvatarItem } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { MULTI_AVATAR_PRESETS, SCREEN } from '@/utils/constant'

import {
  ADD_AVATAR,
  REDO,
  REMOVE_AVATAR,
  SET_AVATAR_OPTION,
  SET_MULTI_AVATAR_CONFIG,
  SET_MULTI_AVATAR_MODE,
  SET_SELECTED_AVATAR_INDEX,
  SET_SIDER_STATUS,
  UNDO,
  UPDATE_AVATAR_OPTION,
  UPDATE_AVATAR_POSITION,
} from './mutation-type'

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function createMultiAvatarItem(option?: AvatarOption): MultiAvatarItem {
  return {
    id: generateId(),
    option:
      option || getRandomAvatarOption({ wrapperShape: WrapperShape.Squircle }),
    position: { x: 0, y: 0, scale: 1, rotation: 0 },
    visible: true,
  }
}

function createMultiAvatarConfig(preset: MultiAvatarPreset): MultiAvatarConfig {
  const presetConfig = MULTI_AVATAR_PRESETS[preset]
  const avatars: MultiAvatarItem[] = []

  for (let i = 0; i < presetConfig.count; i++) {
    const item = createMultiAvatarItem()
    item.position = { ...presetConfig.positions[i] }
    avatars.push(item)
  }

  return {
    preset,
    avatars,
    background: {
      color: '#6BD9E9',
      borderColor: 'transparent',
    },
    wrapperShape: WrapperShape.Squircle,
  }
}

export interface State {
  history: {
    past: AvatarOption[]
    present: AvatarOption
    future: AvatarOption[]
  }
  isSiderCollapsed: boolean
  multiAvatarMode: MultiAvatarMode
  multiAvatarConfig: MultiAvatarConfig
  selectedAvatarIndex: number
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
      multiAvatarMode: MultiAvatarMode.Single,
      multiAvatarConfig: createMultiAvatarConfig(MultiAvatarPreset.Couple),
      selectedAvatarIndex: 0,
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

    [SET_MULTI_AVATAR_MODE](mode: MultiAvatarMode) {
      this.multiAvatarMode = mode
    },

    [SET_MULTI_AVATAR_CONFIG](config: MultiAvatarConfig) {
      this.multiAvatarConfig = config
    },

    [SET_SELECTED_AVATAR_INDEX](index: number) {
      if (index >= 0 && index < this.multiAvatarConfig.avatars.length) {
        this.selectedAvatarIndex = index
      }
    },

    [UPDATE_AVATAR_POSITION](payload: {
      index: number
      position: Partial<MultiAvatarItem['position']>
    }) {
      const { index, position } = payload
      if (index >= 0 && index < this.multiAvatarConfig.avatars.length) {
        this.multiAvatarConfig.avatars[index].position = {
          ...this.multiAvatarConfig.avatars[index].position,
          ...position,
        }
      }
    },

    [ADD_AVATAR]() {
      const newAvatar = createMultiAvatarItem()
      this.multiAvatarConfig.avatars.push(newAvatar)
      this.selectedAvatarIndex = this.multiAvatarConfig.avatars.length - 1
    },

    [REMOVE_AVATAR](index: number) {
      if (
        this.multiAvatarConfig.avatars.length > 1 &&
        index >= 0 &&
        index < this.multiAvatarConfig.avatars.length
      ) {
        this.multiAvatarConfig.avatars.splice(index, 1)
        if (this.selectedAvatarIndex >= this.multiAvatarConfig.avatars.length) {
          this.selectedAvatarIndex = Math.max(
            0,
            this.multiAvatarConfig.avatars.length - 1
          )
        }
      }
    },

    [UPDATE_AVATAR_OPTION](payload: { index: number; option: AvatarOption }) {
      const { index, option } = payload
      if (index >= 0 && index < this.multiAvatarConfig.avatars.length) {
        this.multiAvatarConfig.avatars[index].option = option
      }
    },
  },
})
