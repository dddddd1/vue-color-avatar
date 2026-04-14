<template>
  <PerfectScrollbar class="multi-configurator-scroll">
    <div class="multi-configurator">
      <SectionWrapper :title="t('label.multiAvatarMode')">
        <div class="mode-switch">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: false }"
            @click="switchToSingleMode"
          >
            {{ t('mode.single') }}
          </button>
          <button type="button" class="mode-btn" :class="{ active: true }">
            {{ t('mode.multiple') }}
          </button>
        </div>
      </SectionWrapper>

      <SectionWrapper :title="t('label.preset')">
        <div class="preset-list">
          <button
            v-for="preset in availablePresets"
            :key="preset"
            type="button"
            class="preset-btn"
            :class="{ active: multiAvatarConfig.preset === preset }"
            @click="applyPreset(preset)"
          >
            {{ t(`preset.${preset}`) }}
          </button>
        </div>
      </SectionWrapper>

      <SectionWrapper :title="t('label.avatarList')">
        <div class="avatar-list">
          <div
            v-for="(avatar, index) in multiAvatarConfig.avatars"
            :key="avatar.id"
            class="avatar-list-item"
            :class="{
              'avatar-list-item--selected': index === selectedAvatarIndex,
            }"
            @click="selectAvatar(index)"
          >
            <div class="avatar-preview">
              <VueColorAvatar :option="avatar.option" :size="60" />
            </div>
            <div class="avatar-info">
              <span class="avatar-label">
                {{ t('label.avatar') }} {{ index + 1 }}
              </span>
              <div class="avatar-actions">
                <button
                  type="button"
                  class="action-icon"
                  :title="t('action.randomize')"
                  @click.stop="randomizeAvatar(index)"
                >
                  🎲
                </button>
                <button
                  v-if="multiAvatarConfig.avatars.length > 1"
                  type="button"
                  class="action-icon"
                  :title="t('action.remove')"
                  @click.stop="removeAvatar(index)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="add-avatar-btn" @click="addAvatar">
          + {{ t('action.addAvatar') }}
        </button>
      </SectionWrapper>

      <SectionWrapper
        v-if="selectedAvatar !== null"
        :title="t('label.positionAdjust')"
      >
        <div class="position-controls">
          <div class="control-group">
            <label>{{ t('label.positionX') }}</label>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              :value="selectedAvatar.position.x"
              @input="
                updatePosition(
                  'x',
                  Number(($event.target as HTMLInputElement).value)
                )
              "
            />
            <span class="value-display">
              {{ selectedAvatar.position.x }}px
            </span>
          </div>

          <div class="control-group">
            <label>{{ t('label.positionY') }}</label>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              :value="selectedAvatar.position.y"
              @input="
                updatePosition(
                  'y',
                  Number(($event.target as HTMLInputElement).value)
                )
              "
            />
            <span class="value-display">
              {{ selectedAvatar.position.y }}px
            </span>
          </div>

          <div class="control-group">
            <label>{{ t('label.scale') }}</label>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.05"
              :value="selectedAvatar.position.scale"
              @input="
                updatePosition(
                  'scale',
                  Number(($event.target as HTMLInputElement).value)
                )
              "
            />
            <span class="value-display">
              {{ Math.round(selectedAvatar.position.scale * 100) }}%
            </span>
          </div>

          <div class="control-group">
            <label>{{ t('label.rotation') }}</label>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              :value="selectedAvatar.position.rotation"
              @input="
                updatePosition(
                  'rotation',
                  Number(($event.target as HTMLInputElement).value)
                )
              "
            />
            <span class="value-display">
              {{ selectedAvatar.position.rotation }}°
            </span>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper :title="t('label.wrapperShape')">
        <ul class="wrapper-shape">
          <li
            v-for="wrapperShape in SETTINGS.wrapperShape"
            :key="wrapperShape"
            class="wrapper-shape__item"
            :title="t(`wrapperShape.${wrapperShape}`)"
            @click="switchWrapperShape(wrapperShape)"
          >
            <div
              class="shape"
              :class="[
                wrapperShape,
                { active: wrapperShape === multiAvatarConfig.wrapperShape },
              ]"
            />
          </li>
        </ul>
      </SectionWrapper>

      <SectionWrapper :title="t('label.borderColor')">
        <ul class="color-list">
          <li
            v-for="borderColor in SETTINGS.borderColor"
            :key="borderColor"
            class="color-list__item"
            @click="switchBorderColor(borderColor)"
          >
            <div
              :style="{ background: borderColor }"
              class="bg-color"
              :class="[
                {
                  active:
                    borderColor === multiAvatarConfig.background.borderColor,
                  transparent: borderColor === 'transparent',
                },
              ]"
            />
          </li>
        </ul>
      </SectionWrapper>

      <SectionWrapper :title="t('label.backgroundColor')">
        <ul class="color-list">
          <li
            v-for="bgColor in SETTINGS.backgroundColor"
            :key="bgColor"
            class="color-list__item"
            @click="switchBgColor(bgColor)"
          >
            <div
              :style="{ background: bgColor }"
              class="bg-color"
              :class="{
                active: bgColor === multiAvatarConfig.background.color,
                transparent: bgColor === 'transparent',
              }"
            ></div>
          </li>
        </ul>
      </SectionWrapper>
    </div>
  </PerfectScrollbar>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import PerfectScrollbar from '@/components/PerfectScrollbar.vue'
import SectionWrapper from '@/components/SectionWrapper.vue'
import VueColorAvatar from '@/components/VueColorAvatar.vue'
import { MultiAvatarMode, WrapperShape } from '@/enums'
import { useStore } from '@/store'
import {
  ADD_AVATAR,
  REMOVE_AVATAR,
  SET_MULTI_AVATAR_CONFIG,
  SET_MULTI_AVATAR_MODE,
  SET_SELECTED_AVATAR_INDEX,
  UPDATE_AVATAR_OPTION,
  UPDATE_AVATAR_POSITION,
} from '@/store/mutation-type'
import type { MultiAvatarItem, MultiAvatarPreset } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { MULTI_AVATAR_PRESETS, SETTINGS } from '@/utils/constant'

const { t } = useI18n()
const store = useStore()

const multiAvatarConfig = computed(() => store.multiAvatarConfig)
const selectedAvatarIndex = computed(() => store.selectedAvatarIndex)

const selectedAvatar = computed<MultiAvatarItem | null>(() => {
  if (
    selectedAvatarIndex.value >= 0 &&
    selectedAvatarIndex.value < multiAvatarConfig.value.avatars.length
  ) {
    return multiAvatarConfig.value.avatars[selectedAvatarIndex.value]
  }
  return null
})

const availablePresets = computed<MultiAvatarPreset[]>(() => {
  return [
    'couple' as MultiAvatarPreset,
    'familyOf3' as MultiAvatarPreset,
    'familyOf4' as MultiAvatarPreset,
  ]
})

function switchToSingleMode() {
  store[SET_MULTI_AVATAR_MODE](MultiAvatarMode.Single)
}

function applyPreset(preset: MultiAvatarPreset) {
  const presetConfig = MULTI_AVATAR_PRESETS[preset]
  const avatars: MultiAvatarItem[] = []

  for (let i = 0; i < presetConfig.count; i++) {
    const item: MultiAvatarItem = {
      id: Math.random().toString(36).substring(2, 11),
      option: getRandomAvatarOption({ wrapperShape: WrapperShape.Squircle }),
      position: { ...presetConfig.positions[i] },
      visible: true,
    }
    avatars.push(item)
  }

  store[SET_MULTI_AVATAR_CONFIG]({
    preset,
    avatars,
    background: multiAvatarConfig.value.background,
    wrapperShape: multiAvatarConfig.value.wrapperShape,
  })
  store[SET_SELECTED_AVATAR_INDEX](0)
}

function selectAvatar(index: number) {
  store[SET_SELECTED_AVATAR_INDEX](index)
}

function randomizeAvatar(index: number) {
  const newOption = getRandomAvatarOption({
    wrapperShape: WrapperShape.Squircle,
  })
  store[UPDATE_AVATAR_OPTION]({ index, option: newOption })
}

function removeAvatar(index: number) {
  store[REMOVE_AVATAR](index)
}

function addAvatar() {
  store[ADD_AVATAR]()
}

function updatePosition(key: keyof MultiAvatarItem['position'], value: number) {
  store[UPDATE_AVATAR_POSITION]({
    index: selectedAvatarIndex.value,
    position: { [key]: value },
  })
}

function switchWrapperShape(wrapperShape: WrapperShape) {
  if (wrapperShape !== multiAvatarConfig.value.wrapperShape) {
    store[SET_MULTI_AVATAR_CONFIG]({
      ...multiAvatarConfig.value,
      wrapperShape,
    })
  }
}

function switchBorderColor(borderColor: string) {
  if (borderColor !== multiAvatarConfig.value.background.borderColor) {
    store[SET_MULTI_AVATAR_CONFIG]({
      ...multiAvatarConfig.value,
      background: { ...multiAvatarConfig.value.background, borderColor },
    })
  }
}

function switchBgColor(bgColor: string) {
  if (bgColor !== multiAvatarConfig.value.background.color) {
    store[SET_MULTI_AVATAR_CONFIG]({
      ...multiAvatarConfig.value,
      background: { ...multiAvatarConfig.value.background, color: bgColor },
    })
  }
}
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.multi-configurator-scroll {
  width: var.$layout-sider-width;
  height: 100%;

  @media screen and (max-width: var.$screen-lg) {
    background-color: var.$color-configurator;
  }
}

.multi-configurator {
  width: 100%;
  color: var.$color-text;

  .mode-switch {
    display: flex;
    gap: 0.5rem;
  }

  .mode-btn {
    flex: 1;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background-color: var.$color-gray;
    color: var.$color-text;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;

    &.active {
      background-color: var.$color-accent;
      color: white;
    }

    &:hover:not(.active) {
      background-color: lighten(var.$color-gray, 5);
    }
  }

  .preset-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-btn {
    padding: 0.5rem 1rem;
    border: 2px solid var.$color-gray;
    border-radius: 0.5rem;
    background-color: transparent;
    color: var.$color-text;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      border-color: var.$color-accent;
      background-color: rgba(var.$color-accent, 0.1);
    }

    &:hover:not(.active) {
      border-color: lighten(var.$color-gray, 10);
    }
  }

  .avatar-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .avatar-list-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: lighten(var.$color-configurator, 3);
    }

    &--selected {
      background-color: lighten(var.$color-configurator, 6);
      box-shadow: 0 0 0 2px var.$color-accent;
    }
  }

  .avatar-preview {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
  }

  .avatar-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .avatar-label {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .avatar-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-icon {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: var.$color-gray;
    }
  }

  .add-avatar-btn {
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    border: 2px dashed var.$color-gray;
    border-radius: 0.5rem;
    background-color: transparent;
    color: var.$color-text;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var.$color-accent;
      color: var.$color-accent;
    }
  }

  .position-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
      font-size: 0.85rem;
      color: darken(var.$color-text, 10);
    }

    input[type='range'] {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var.$color-gray;
      outline: none;
      -webkit-appearance: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var.$color-accent;
        cursor: pointer;
      }
    }
  }

  .value-display {
    font-size: 0.8rem;
    color: darken(var.$color-text, 20);
    text-align: right;
  }

  .wrapper-shape {
    display: flex;
    align-items: center;

    .wrapper-shape__item {
      padding: 0.4rem 0.5rem;
      cursor: pointer;

      .shape {
        display: inline-block;
        width: 1.5rem;
        height: 1.5rem;
        background-color: var.$color-text;
        transition: background-color 0.2s;

        &.circle {
          border-radius: 50%;
        }

        &.squircle {
          border-radius: 20%;
        }

        &.active {
          background-color: var.$color-accent;
        }
      }
    }
  }

  .color-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .color-list__item {
      position: relative;
      z-index: 1;
      width: calc(100% / 7);
      padding: 0.6rem 0;
      cursor: pointer;
      transition: transform 0.2s;

      .bg-color {
        position: relative;
        box-sizing: content-box;
        width: 1.3em;
        height: 1.3em;
        margin: 0 auto;
        font-size: 16px;
        border-radius: 50%;
        box-shadow: 0 0 0.05em 0.2em var.$color-configurator;

        &.transparent {
          background: #fff !important;

          &::after {
            position: absolute;
            top: 50%;
            left: 50%;
            z-index: 1;
            color: #ff4757;
            font-weight: bold;
            font-size: 1.8rem;
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
            content: '\\';
          }
        }

        &::before {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: -1;
          width: 100%;
          height: 100%;
          background: inherit;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.5;
          transition: width 0.15s, height 0.15s;
          content: '';
        }

        &::after {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 1;
          color: var.$color-configurator;
          font-size: 1.5rem;
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
          transition: opacity 0.15s;
          content: '\2714';
        }

        &.active::before {
          width: 160%;
          height: 160%;
        }

        &.active::after {
          opacity: 1;
        }
      }
    }
  }
}
</style>
