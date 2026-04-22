<template>
  <div class="sticker-configurator">
    <SectionWrapper :title="t('label.stickers')">
      <div class="sticker-categories">
        <button
          v-for="category in SETTINGS.stickerCategories"
          :key="category"
          class="category-btn"
          :class="{ active: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ t(`stickerCategory.${category}`) }}
        </button>
      </div>

      <ul class="sticker-list" v-if="selectedCategory">
        <li
          v-for="stickerShape in SETTINGS.stickersByCategory[selectedCategory]"
          :key="stickerShape"
          class="sticker-item"
          @click="addSticker(selectedCategory, stickerShape)"
          v-html="getStickerPreview(selectedCategory, stickerShape)"
        />
      </ul>

      <div
        v-if="selectedSticker && stickers.length > 0"
        class="sticker-controls"
      >
        <h4 class="control-title">{{ t('label.stickerControls') }}</h4>
        
        <div class="control-group">
          <label class="control-label">{{ t('label.stickerX') }}</label>
          <input
            type="range"
            min="-50"
            max="250"
            v-model.number="stickerX"
            class="control-slider"
          />
          <span class="control-value">{{ stickerX }}</span>
        </div>

        <div class="control-group">
          <label class="control-label">{{ t('label.stickerY') }}</label>
          <input
            type="range"
            min="-50"
            max="250"
            v-model.number="stickerY"
            class="control-slider"
          />
          <span class="control-value">{{ stickerY }}</span>
        </div>

        <div class="control-group">
          <label class="control-label">{{ t('label.stickerScale') }}</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            v-model.number="stickerScale"
            class="control-slider"
          />
          <span class="control-value">{{ stickerScale.toFixed(1) }}x</span>
        </div>

        <div class="control-group">
          <label class="control-label">{{ t('label.stickerRotation') }}</label>
          <input
            type="range"
            min="-180"
            max="180"
            v-model.number="stickerRotation"
            class="control-slider"
          />
          <span class="control-value">{{ stickerRotation }}°</span>
        </div>

        <div class="control-group">
          <label class="control-label">{{ t('label.stickerOpacity') }}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model.number="stickerOpacity"
            class="control-slider"
          />
          <span class="control-value">{{ Math.round(stickerOpacity * 100) }}%</span>
        </div>

        <div class="control-group control-actions">
          <button
            type="button"
            class="action-btn action-remove"
            @click="removeSelectedSticker"
          >
            {{ t('action.removeSticker') }}
          </button>
          <button
            type="button"
            class="action-btn action-clear"
            @click="clearAllStickers"
          >
            {{ t('action.clearStickers') }}
          </button>
        </div>
      </div>

      <div v-else-if="stickers.length > 0" class="sticker-list-section">
        <h4 class="control-title">{{ t('label.appliedStickers') }}</h4>
        <ul class="applied-stickers">
          <li
            v-for="sticker in stickers"
            :key="sticker.id"
            class="applied-sticker-item"
            :class="{ selected: selectedStickerId === sticker.id }"
            @click="selectSticker(sticker.id)"
          >
            <div class="sticker-preview" v-html="getStickerPreview(sticker.category, sticker.shape)" />
            <span class="sticker-name">{{ t(`stickerShape.${sticker.shape}`) }}</span>
          </li>
        </ul>
      </div>
    </SectionWrapper>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import SectionWrapper from '@/components/SectionWrapper.vue'
import { StickerCategory, StickerShape } from '@/enums'
import type { Sticker } from '@/types'
import { SETTINGS, STICKER_LAYER } from '@/utils/constant'
import { stickerData } from '@/utils/dynamic-data'

interface StickerConfiguratorProps {
  stickers: Sticker[]
  selectedStickerId?: string | null
}

const props = withDefaults(defineProps<StickerConfiguratorProps>(), {
  selectedStickerId: null,
})

const emit = defineEmits<{
  (e: 'stickerAdd', sticker: Sticker): void
  (e: 'stickerUpdate', stickers: Sticker[]): void
  (e: 'stickerRemove', stickerId: string): void
  (e: 'stickerClear'): void
}>()

const { t } = useI18n()

const selectedCategory = ref<StickerCategory | null>(StickerCategory.SpringFestival)
const stickerPreviews = reactive<Map<string, string>>(new Map())

const selectedSticker = computed(() => {
  return props.stickers.find((s) => s.id === props.selectedStickerId) || null
})

const stickerX = computed({
  get: () => selectedSticker.value?.x ?? 0,
  set: (value) => updateSelectedSticker({ x: value }),
})

const stickerY = computed({
  get: () => selectedSticker.value?.y ?? 0,
  set: (value) => updateSelectedSticker({ y: value }),
})

const stickerScale = computed({
  get: () => selectedSticker.value?.scale ?? 1,
  set: (value) => updateSelectedSticker({ scale: value }),
})

const stickerRotation = computed({
  get: () => selectedSticker.value?.rotation ?? 0,
  set: (value) => updateSelectedSticker({ rotation: value }),
})

const stickerOpacity = computed({
  get: () => selectedSticker.value?.opacity ?? 1,
  set: (value) => updateSelectedSticker({ opacity: value }),
})

onMounted(async () => {
  await loadAllStickerPreviews()
})

async function loadAllStickerPreviews() {
  for (const category of SETTINGS.stickerCategories) {
    for (const shape of SETTINGS.stickersByCategory[category]) {
      const key = `${category}-${shape}`
      if (!stickerPreviews.has(key)) {
        try {
          if (stickerData?.[category]?.[shape]) {
            const raw = (await stickerData[category][shape]()).default
            stickerPreviews.set(key, raw)
          }
        } catch (e) {
          console.error(`Failed to load sticker preview: ${category}/${shape}`, e)
        }
      }
    }
  }
}

function getStickerPreview(category: StickerCategory, shape: StickerShape): string {
  const key = `${category}-${shape}`
  return stickerPreviews.get(key) || ''
}

function generateStickerId(): string {
  return `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function addSticker(category: StickerCategory, shape: StickerShape) {
  const existingStickersCount = props.stickers.length
  const newSticker: Sticker = {
    id: generateStickerId(),
    shape,
    category,
    x: 20 + existingStickersCount * 30,
    y: 20 + existingStickersCount * 30,
    scale: 1,
    rotation: 0,
    zIndex: STICKER_LAYER.baseZIndex + existingStickersCount,
    opacity: 1,
  }

  emit('stickerAdd', newSticker)
}

function updateSelectedSticker(data: Partial<Sticker>) {
  if (!selectedSticker.value) return

  const updatedStickers = props.stickers.map((sticker) =>
    sticker.id === props.selectedStickerId ? { ...sticker, ...data } : sticker
  )

  emit('stickerUpdate', updatedStickers)
}

function selectSticker(stickerId: string) {
  const updatedStickers = props.stickers.map((sticker, index) => {
    if (sticker.id === stickerId) {
      return {
        ...sticker,
        zIndex: STICKER_LAYER.baseZIndex + props.stickers.length,
      }
    }
    if (sticker.zIndex > STICKER_LAYER.baseZIndex) {
      return {
        ...sticker,
        zIndex: Math.max(STICKER_LAYER.baseZIndex, sticker.zIndex - 1),
      }
    }
    return sticker
  })

  emit('stickerUpdate', updatedStickers)
}

function removeSelectedSticker() {
  if (props.selectedStickerId) {
    emit('stickerRemove', props.selectedStickerId)
  }
}

function clearAllStickers() {
  emit('stickerClear')
}
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.sticker-configurator {
  .sticker-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .category-btn {
    padding: 0.4rem 0.8rem;
    background-color: var.$color-gray;
    border: none;
    border-radius: 0.4rem;
    color: var.$color-text;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: lighten(var.$color-gray, 5);
    }

    &.active {
      background-color: var.$color-accent;
      color: #fff;
    }
  }

  .sticker-list {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .sticker-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(100% / 4);
    height: 5rem;
    padding: 0.8rem;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: lighten(var.$color-configurator, 3);
    }

    & > :deep(svg) {
      width: 100% !important;
      height: 100% !important;
    }
  }

  .sticker-controls {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(var.$color-text, 0.1);
  }

  .control-title {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: darken(var.$color-text, 10);
  }

  .control-group {
    display: flex;
    align-items: center;
    margin-bottom: 0.8rem;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.85rem;
    color: darken(var.$color-text, 5);
    min-width: 4rem;
  }

  .control-slider {
    flex: 1;
    height: 0.3rem;
    -webkit-appearance: none;
    appearance: none;
    background: var.$color-gray;
    border-radius: 0.15rem;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 1rem;
      height: 1rem;
      background: var.$color-accent;
      border-radius: 50%;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 1rem;
      height: 1rem;
      background: var.$color-accent;
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }
  }

  .control-value {
    font-size: 0.8rem;
    color: darken(var.$color-text, 10);
    min-width: 3rem;
    text-align: right;
  }

  .control-actions {
    margin-top: 1rem;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.4rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }

    &.action-remove {
      background-color: #ff4757;
      color: #fff;
    }

    &.action-clear {
      background-color: var.$color-gray;
      color: var.$color-text;
    }
  }

  .sticker-list-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(var.$color-text, 0.1);
  }

  .applied-stickers {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 0.5rem;
  }

  .applied-sticker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(100% / 4 - 0.4rem);
    padding: 0.5rem;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border: 2px solid transparent;

    &:hover {
      background-color: lighten(var.$color-configurator, 3);
    }

    &.selected {
      border-color: var.$color-accent;
      background-color: lighten(var.$color-configurator, 5);
    }

    .sticker-preview {
      width: 2.5rem;
      height: 2.5rem;
      margin-bottom: 0.3rem;

      :deep(svg) {
        width: 100%;
        height: 100%;
      }
    }

    .sticker-name {
      font-size: 0.7rem;
      color: darken(var.$color-text, 10);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
  }
}
</style>