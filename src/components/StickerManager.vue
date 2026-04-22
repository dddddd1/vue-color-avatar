<template>
  <div class="sticker-manager">
    <SectionWrapper :title="t('label.festivalStickers')">
      <div class="festival-tabs">
        <button
          v-for="festival in festivals"
          :key="festival"
          class="festival-tab"
          :class="{ active: selectedFestival === festival }"
          @click="selectedFestival = festival"
        >
          {{ t(`festival.${festival}`) }}
        </button>
      </div>

      <div class="sticker-preview-list">
        <div
          v-for="stickerShape in currentFestivalStickers"
          :key="stickerShape"
          class="sticker-preview-item"
          @click="addSticker(stickerShape)"
          v-html="getStickerPreview(stickerShape)"
        />
      </div>

      <div class="festival-actions">
        <button class="apply-all-btn" @click="applyAllFestivalStickers">
          {{ t('action.applyAllFestival') }}
        </button>
      </div>
    </SectionWrapper>

    <SectionWrapper
      v-if="currentStickers.length > 0"
      :title="t('label.appliedStickers')"
    >
      <div class="applied-stickers-list">
        <div
          v-for="sticker in currentStickers"
          :key="sticker.id"
          class="applied-sticker-item"
          :class="{ selected: selectedStickerId === sticker.id }"
          @click="selectSticker(sticker.id)"
        >
          <div
            class="sticker-thumb"
            v-html="getStickerPreview(sticker.shape)"
          />
          <div class="sticker-info">
            <div class="sticker-name">{{ t(`sticker.${sticker.shape}`) }}</div>
            <div class="sticker-actions">
              <button
                class="action-btn"
                @click.stop="toggleStickerVisibility(sticker)"
              >
                <svg
                  v-if="sticker.visible"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
              <button
                class="action-btn delete-btn"
                @click.stop="removeSticker(sticker.id)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedSticker" class="sticker-adjustments">
        <div class="adjustment-group">
          <label class="adjustment-label">{{ t('label.positionX') }}</label>
          <input
            type="range"
            class="adjustment-slider"
            min="-50"
            max="230"
            step="1"
            :value="selectedSticker.x"
            @input="updateStickerPosition('x', $event)"
          />
          <span class="adjustment-value">{{
            Math.round(selectedSticker.x)
          }}</span>
        </div>

        <div class="adjustment-group">
          <label class="adjustment-label">{{ t('label.positionY') }}</label>
          <input
            type="range"
            class="adjustment-slider"
            min="-50"
            max="230"
            step="1"
            :value="selectedSticker.y"
            @input="updateStickerPosition('y', $event)"
          />
          <span class="adjustment-value">{{
            Math.round(selectedSticker.y)
          }}</span>
        </div>

        <div class="adjustment-group">
          <label class="adjustment-label">{{ t('label.scale') }}</label>
          <input
            type="range"
            class="adjustment-slider"
            min="0.1"
            max="3"
            step="0.1"
            :value="selectedSticker.scale"
            @input="updateStickerScale($event)"
          />
          <span class="adjustment-value"
            >{{ selectedSticker.scale.toFixed(1) }}x</span
          >
        </div>

        <div class="adjustment-group">
          <label class="adjustment-label">{{ t('label.rotation') }}</label>
          <input
            type="range"
            class="adjustment-slider"
            min="-180"
            max="180"
            step="1"
            :value="selectedSticker.rotation"
            @input="updateStickerRotation($event)"
          />
          <span class="adjustment-value"
            >{{ Math.round(selectedSticker.rotation) }}°</span
          >
        </div>

        <div class="adjustment-actions">
          <button class="reset-btn" @click="resetStickerTransform">
            {{ t('action.reset') }}
          </button>
        </div>
      </div>
    </SectionWrapper>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import SectionWrapper from '@/components/SectionWrapper.vue'
import { FestivalType, StickerShape, WidgetType } from '@/enums'
import { useAvatarOption } from '@/hooks'
import { useStore } from '@/store'
import {
  ADD_STICKER,
  CLEAR_STICKERS,
  REMOVE_STICKER,
  UPDATE_STICKER,
} from '@/store/mutation-type'
import type { Sticker } from '@/types'
import { AVATAR_LAYER, FESTIVAL_STICKERS } from '@/utils/constant'
import { previewData } from '@/utils/dynamic-data'

const { t } = useI18n()
const store = useStore()
const [avatarOption, setAvatarOption] = useAvatarOption()

const festivals = Object.values(FestivalType)
const selectedFestival = ref<FestivalType>(FestivalType.SpringFestival)
const selectedStickerId = ref<string | null>(null)
const stickerPreviews = ref<Map<StickerShape, string>>(new Map())

const currentFestivalStickers = computed(() => {
  return FESTIVAL_STICKERS[selectedFestival.value] || []
})

const currentStickers = computed(() => {
  return avatarOption.value.stickers || []
})

const selectedSticker = computed(() => {
  return (
    currentStickers.value.find((s) => s.id === selectedStickerId.value) || null
  )
})

function getStickerPreview(shape: StickerShape): string {
  return stickerPreviews.value.get(shape) || ''
}

function generateStickerId(): string {
  return `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function addSticker(shape: StickerShape) {
  const festival = selectedFestival.value
  const sticker: Sticker = {
    id: generateStickerId(),
    shape,
    festival,
    x: 90,
    y: 90,
    scale: 1,
    rotation: 0,
    zIndex:
      AVATAR_LAYER[WidgetType.Stickers].zIndex + currentStickers.value.length,
    visible: true,
  }
  store[ADD_STICKER](sticker)
  selectedStickerId.value = sticker.id
}

function removeSticker(stickerId: string) {
  store[REMOVE_STICKER](stickerId)
  if (selectedStickerId.value === stickerId) {
    selectedStickerId.value = null
  }
}

function selectSticker(stickerId: string) {
  selectedStickerId.value = stickerId
}

function toggleStickerVisibility(sticker: Sticker) {
  store[UPDATE_STICKER]({
    id: sticker.id,
    visible: !sticker.visible,
  })
}

function updateStickerPosition(axis: 'x' | 'y', event: Event) {
  if (!selectedStickerId.value) return
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  store[UPDATE_STICKER]({
    id: selectedStickerId.value,
    [axis]: value,
  })
}

function updateStickerScale(event: Event) {
  if (!selectedStickerId.value) return
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  store[UPDATE_STICKER]({
    id: selectedStickerId.value,
    scale: value,
  })
}

function updateStickerRotation(event: Event) {
  if (!selectedStickerId.value) return
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  store[UPDATE_STICKER]({
    id: selectedStickerId.value,
    rotation: value,
  })
}

function resetStickerTransform() {
  if (!selectedStickerId.value) return
  store[UPDATE_STICKER]({
    id: selectedStickerId.value,
    x: 90,
    y: 90,
    scale: 1,
    rotation: 0,
  })
}

function applyAllFestivalStickers() {
  const stickers = currentFestivalStickers.value
  stickers.forEach((shape, index) => {
    const sticker: Sticker = {
      id: generateStickerId(),
      shape,
      festival: selectedFestival.value,
      x: 50 + index * 30,
      y: 50 + index * 20,
      scale: 0.8,
      rotation: index * 10 - 10,
      zIndex:
        AVATAR_LAYER[WidgetType.Stickers].zIndex +
        currentStickers.value.length +
        index,
      visible: true,
    }
    store[ADD_STICKER](sticker)
  })
}

watchEffect(async () => {
  const allShapes = Object.values(StickerShape)
  for (const shape of allShapes) {
    if (!stickerPreviews.value.has(shape)) {
      if (previewData?.[WidgetType.Stickers]?.[shape]) {
        const svgRaw = (await previewData[WidgetType.Stickers][shape]()).default
        stickerPreviews.value.set(shape, svgRaw)
      }
    }
  }
})

defineExpose({
  selectedStickerId,
})
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.sticker-manager {
  .festival-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;

    .festival-tab {
      padding: 0.5rem 1rem;
      border: 1px solid var.$color-border;
      border-radius: 0.5rem;
      background: transparent;
      color: var.$color-text;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: lighten(var.$color-configurator, 5);
      }

      &.active {
        background: var.$color-accent;
        border-color: var.$color-accent;
        color: #fff;
      }
    }
  }

  .sticker-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;

    .sticker-preview-item {
      width: calc(100% / 4);
      height: 5rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: lighten(var.$color-configurator, 5);
      }

      :deep(svg) {
        width: 100% !important;
        height: 100% !important;
      }
    }
  }

  .festival-actions {
    margin-top: 1rem;
    text-align: center;

    .apply-all-btn {
      padding: 0.75rem 1.5rem;
      background: var.$color-accent;
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;

      &:hover {
        background: darken(var.$color-accent, 10);
      }
    }
  }

  .applied-stickers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;

    .applied-sticker-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
      border: 2px solid transparent;

      &:hover {
        background-color: lighten(var.$color-configurator, 5);
      }

      &.selected {
        border-color: var.$color-accent;
        background-color: lighten(var.$color-configurator, 8);
      }

      .sticker-thumb {
        width: 3rem;
        height: 3rem;
        margin-right: 1rem;
        flex-shrink: 0;

        :deep(svg) {
          width: 100% !important;
          height: 100% !important;
        }
      }

      .sticker-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .sticker-name {
          font-size: 0.9rem;
          color: var.$color-text;
        }

        .sticker-actions {
          display: flex;
          gap: 0.5rem;

          .action-btn {
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 0.25rem;
            background: transparent;
            color: var.$color-text;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: lighten(var.$color-configurator, 10);
            }

            &.delete-btn:hover {
              background: #ff4757;
              color: #fff;
            }
          }
        }
      }
    }
  }

  .sticker-adjustments {
    padding-top: 1rem;
    border-top: 1px solid var.$color-border;

    .adjustment-group {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      gap: 0.5rem;

      .adjustment-label {
        width: 4rem;
        font-size: 0.85rem;
        color: var.$color-text;
        flex-shrink: 0;
      }

      .adjustment-slider {
        flex: 1;
        height: 0.5rem;
        border-radius: 0.25rem;
        background: lighten(var.$color-configurator, 10);
        outline: none;
        -webkit-appearance: none;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: var.$color-accent;
          cursor: pointer;
        }

        &::-moz-range-thumb {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: var.$color-accent;
          cursor: pointer;
          border: none;
        }
      }

      .adjustment-value {
        width: 3rem;
        text-align: right;
        font-size: 0.85rem;
        color: var.$color-text;
        flex-shrink: 0;
      }
    }

    .adjustment-actions {
      text-align: center;
      margin-top: 1rem;

      .reset-btn {
        padding: 0.5rem 1rem;
        background: transparent;
        border: 1px solid var.$color-border;
        border-radius: 0.25rem;
        color: var.$color-text;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: lighten(var.$color-configurator, 5);
        }
      }
    }
  }
}
</style>
