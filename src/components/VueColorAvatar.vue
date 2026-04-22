<template>
  <div
    ref="avatarRef"
    class="vue-color-avatar"
    :style="{
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      ...getWrapperShapeStyle(),
    }"
    :class="getWrapperShapeClassName()"
  >
    <Background :color="avatarOption.background.color" />

    <div class="avatar-payload" v-html="svgContent" />

    <div class="stickers-layer">
      <StickerComponent
        v-for="sticker in sortedStickers"
        :key="sticker.id"
        :sticker="sticker"
        :is-selected="selectedStickerId === sticker.id"
        :avatar-size="avatarSize"
        @update="(data) => handleStickerUpdate(sticker.id, data)"
        @select="handleStickerSelect"
        @remove="handleStickerRemove"
      />
    </div>

    <Border
      :color="avatarOption.background.borderColor"
      :radius="getWrapperShapeStyle().borderRadius"
    />
  </div>
</template>

<script lang="ts">
export interface VueColorAvatarRef {
  avatarRef: HTMLDivElement
}
</script>

<script lang="ts" setup>
import { computed, ref, toRefs, watchEffect } from 'vue'

import { WidgetType, WrapperShape } from '@/enums'
import type { AvatarOption, Sticker } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { AVATAR_LAYER, NONE, SHAPE_STYLE_SET } from '@/utils/constant'
import { widgetData } from '@/utils/dynamic-data'

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'
import StickerComponent from './stickers/Sticker.vue'

interface VueColorAvatarProps {
  option: AvatarOption
  size?: number
}

const props = withDefaults(defineProps<VueColorAvatarProps>(), {
  option: () => getRandomAvatarOption(),
  size: 280,
})

const { option: avatarOption, size: avatarSize } = toRefs(props)

const avatarRef = ref<VueColorAvatarRef['avatarRef']>()
const selectedStickerId = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'stickerUpdate', stickers: Sticker[]): void
  (e: 'stickerSelect', stickerId: string | null): void
}>()

defineExpose({ avatarRef })

const sortedStickers = computed(() => {
  return [...(avatarOption.value.stickers || [])].sort(
    (a, b) => a.zIndex - b.zIndex
  )
})

function getWrapperShapeClassName() {
  return {
    [WrapperShape.Circle]:
      avatarOption.value.wrapperShape === WrapperShape.Circle,
    [WrapperShape.Square]:
      avatarOption.value.wrapperShape === WrapperShape.Square,
    [WrapperShape.Squircle]:
      avatarOption.value.wrapperShape === WrapperShape.Squircle,
  }
}

function getWrapperShapeStyle() {
  return SHAPE_STYLE_SET[avatarOption.value.wrapperShape ?? WrapperShape.Circle]
}

function handleStickerUpdate(stickerId: string, data: Partial<Sticker>) {
  const updatedStickers = avatarOption.value.stickers.map((sticker) =>
    sticker.id === stickerId ? { ...sticker, ...data } : sticker
  )
  emit('stickerUpdate', updatedStickers)
}

function handleStickerSelect(stickerId: string) {
  selectedStickerId.value = stickerId
  emit('stickerSelect', stickerId)
}

function handleStickerRemove(stickerId: string) {
  const updatedStickers = avatarOption.value.stickers.filter(
    (s) => s.id !== stickerId
  )
  emit('stickerUpdate', updatedStickers)
  if (selectedStickerId.value === stickerId) {
    selectedStickerId.value = null
    emit('stickerSelect', null)
  }
}

const svgContent = ref('')

watchEffect(async () => {
  const sortedList = Object.entries(avatarOption.value.widgets).sort(
    ([prevShape, prev], [nextShape, next]) => {
      const ix = prev.zIndex ?? AVATAR_LAYER[prevShape]?.zIndex ?? 0
      const iix = next.zIndex ?? AVATAR_LAYER[nextShape]?.zIndex ?? 0
      return ix - iix
    }
  )

  const promises: Promise<string>[] = sortedList.map(
    async ([widgetType, opt]) => {
      if (opt.shape !== NONE && widgetData?.[widgetType]?.[opt.shape]) {
        return (await widgetData[widgetType][opt.shape]()).default
      }
      return ''
    }
  )

  let skinColor: string | undefined

  const svgRawList = await Promise.all(promises).then((raw) => {
    return raw.map((svgRaw, i) => {
      const [widgetType, widget] = sortedList[i]
      let widgetFillColor = widget.fillColor

      if (widgetType === WidgetType.Face) {
        skinColor = widgetFillColor
      }
      if (skinColor && widgetType === WidgetType.Ear) {
        widgetFillColor = skinColor
      }

      const content = svgRaw
        .slice(svgRaw.indexOf('>', svgRaw.indexOf('<svg')) + 1)
        .replace('</svg>', '')
        .replaceAll('$fillColor', widgetFillColor || 'transparent')

      return `
        <g id="vue-color-avatar-${sortedList[i][0]}">
          ${content}
        </g>
      `
    })
  })

  svgContent.value = `
    <svg
      width="${avatarSize.value}"
      height="${avatarSize.value}"
      viewBox="0 0 ${avatarSize.value / 0.7} ${avatarSize.value / 0.7}"
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(100, 65)">
        ${svgRawList.join('')}
      </g>
    </svg>
  `
})
</script>

<style lang="scss" scoped>
.vue-color-avatar {
  position: relative;
  overflow: hidden;

  .avatar-payload {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }

  .stickers-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }
}
</style>
