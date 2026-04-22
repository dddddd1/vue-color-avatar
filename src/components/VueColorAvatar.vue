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

    <div
      v-for="sticker in visibleStickers"
      :key="sticker.id"
      class="sticker"
      :class="{ 'sticker-selected': selectedStickerId === sticker.id }"
      :style="getStickerStyle(sticker)"
      @mousedown="startDragSticker(sticker, $event)"
    >
      <div class="sticker-content" v-html="getStickerSvg(sticker)" />
      <div
        v-if="selectedStickerId === sticker.id"
        class="sticker-handle sticker-handle-nw"
        @mousedown.stop="startResizeSticker(sticker, 'nw', $event)"
      />
      <div
        v-if="selectedStickerId === sticker.id"
        class="sticker-handle sticker-handle-ne"
        @mousedown.stop="startResizeSticker(sticker, 'ne', $event)"
      />
      <div
        v-if="selectedStickerId === sticker.id"
        class="sticker-handle sticker-handle-sw"
        @mousedown.stop="startResizeSticker(sticker, 'sw', $event)"
      />
      <div
        v-if="selectedStickerId === sticker.id"
        class="sticker-handle sticker-handle-se"
        @mousedown.stop="startResizeSticker(sticker, 'se', $event)"
      />
      <div
        v-if="selectedStickerId === sticker.id"
        class="sticker-rotate-handle"
        @mousedown.stop="startRotateSticker(sticker, $event)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
            fill="#666"
          />
          <path d="M10 4l3 3h-2v3H9V7H7l3-3z" fill="#666" />
        </svg>
      </div>
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
import type { StickerShape } from '@/enums'
import type { AvatarOption, Sticker } from '@/types'
import { getRandomAvatarOption } from '@/utils'
import { AVATAR_LAYER, NONE, SHAPE_STYLE_SET } from '@/utils/constant'
import { widgetData } from '@/utils/dynamic-data'

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'

interface VueColorAvatarProps {
  option: AvatarOption
  size?: number
}

const props = withDefaults(defineProps<VueColorAvatarProps>(), {
  option: () => getRandomAvatarOption(),
  size: 280,
})

const emit = defineEmits<{
  (e: 'update:sticker', sticker: Partial<Sticker> & { id: string }): void
  (e: 'select:sticker', stickerId: string | null): void
}>()

const { option: avatarOption, size: avatarSize } = toRefs(props)

const avatarRef = ref<VueColorAvatarRef['avatarRef']>()
const selectedStickerId = ref<string | null>(null)
const stickerSvgs = ref<Map<string, string>>(new Map())

const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const currentSticker = ref<Sticker | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const stickerStartX = ref(0)
const stickerStartY = ref(0)
const resizeHandle = ref<string>('')
const initialScale = ref(1)
const initialRotation = ref(0)
const initialAngle = ref(0)

const visibleStickers = computed(() => {
  return avatarOption.value.stickers.filter((sticker) => sticker.visible)
})

defineExpose({ avatarRef })

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

function getStickerStyle(sticker: Sticker) {
  return {
    left: `${sticker.x}px`,
    top: `${sticker.y}px`,
    transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
    zIndex: sticker.zIndex,
  }
}

function getStickerSvg(sticker: Sticker): string {
  return stickerSvgs.value.get(sticker.id) || ''
}

function startDragSticker(sticker: Sticker, event: MouseEvent) {
  event.preventDefault()
  selectedStickerId.value = sticker.id
  emit('select:sticker', sticker.id)

  isDragging.value = true
  currentSticker.value = sticker
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  stickerStartX.value = sticker.x
  stickerStartY.value = sticker.y

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value || !currentSticker.value) return

  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value

  const newX = stickerStartX.value + deltaX
  const newY = stickerStartY.value + deltaY

  emit('update:sticker', {
    id: currentSticker.value.id,
    x: newX,
    y: newY,
  })
}

function stopDrag() {
  isDragging.value = false
  currentSticker.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function startResizeSticker(
  sticker: Sticker,
  handle: string,
  event: MouseEvent
) {
  event.preventDefault()
  isResizing.value = true
  currentSticker.value = sticker
  resizeHandle.value = handle
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  initialScale.value = sticker.scale

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(event: MouseEvent) {
  if (!isResizing.value || !currentSticker.value) return

  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value
  const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  let scaleFactor = 1
  if (resizeHandle.value === 'se' || resizeHandle.value === 'nw') {
    scaleFactor = 1 + delta / 100
  } else {
    scaleFactor = 1 - delta / 100
  }

  const newScale = Math.max(0.1, Math.min(3, initialScale.value * scaleFactor))

  emit('update:sticker', {
    id: currentSticker.value.id,
    scale: newScale,
  })
}

function stopResize() {
  isResizing.value = false
  currentSticker.value = null
  resizeHandle.value = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function startRotateSticker(sticker: Sticker, event: MouseEvent) {
  event.preventDefault()
  isRotating.value = true
  currentSticker.value = sticker
  initialRotation.value = sticker.rotation

  const rect = avatarRef.value?.getBoundingClientRect()
  if (rect) {
    const stickerCenterX = rect.left + sticker.x + 50 * sticker.scale
    const stickerCenterY = rect.top + sticker.y + 50 * sticker.scale
    initialAngle.value = Math.atan2(
      event.clientY - stickerCenterY,
      event.clientX - stickerCenterX
    )
  }

  document.addEventListener('mousemove', onRotate)
  document.addEventListener('mouseup', stopRotate)
}

function onRotate(event: MouseEvent) {
  if (!isRotating.value || !currentSticker.value) return

  const rect = avatarRef.value?.getBoundingClientRect()
  if (!rect) return

  const stickerCenterX =
    rect.left + currentSticker.value.x + 50 * currentSticker.value.scale
  const stickerCenterY =
    rect.top + currentSticker.value.y + 50 * currentSticker.value.scale
  const currentAngle = Math.atan2(
    event.clientY - stickerCenterY,
    event.clientX - stickerCenterX
  )
  const deltaAngle = (currentAngle - initialAngle.value) * (180 / Math.PI)

  const newRotation = initialRotation.value + deltaAngle

  emit('update:sticker', {
    id: currentSticker.value.id,
    rotation: newRotation,
  })
}

function stopRotate() {
  isRotating.value = false
  currentSticker.value = null
  document.removeEventListener('mousemove', onRotate)
  document.removeEventListener('mouseup', stopRotate)
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

watchEffect(async () => {
  const stickers = avatarOption.value.stickers
  for (const sticker of stickers) {
    if (!stickerSvgs.value.has(sticker.id)) {
      const shape = sticker.shape as StickerShape
      if (widgetData?.[WidgetType.Stickers]?.[shape]) {
        const svgRaw = (await widgetData[WidgetType.Stickers][shape]()).default
        stickerSvgs.value.set(sticker.id, svgRaw)
      }
    }
  }
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

  .sticker {
    position: absolute;
    z-index: 10;
    cursor: move;
    user-select: none;
    transform-origin: center center;

    &.sticker-selected {
      outline: 2px dashed #6967fe;
      outline-offset: 2px;
    }

    .sticker-content {
      width: 100px;
      height: 100px;
      pointer-events: none;

      :deep(svg) {
        width: 100%;
        height: 100%;
      }
    }

    .sticker-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      background: #fff;
      border: 2px solid #6967fe;
      border-radius: 50%;
      cursor: nwse-resize;

      &-nw {
        top: -6px;
        left: -6px;
        cursor: nw-resize;
      }

      &-ne {
        top: -6px;
        right: -6px;
        cursor: ne-resize;
      }

      &-sw {
        bottom: -6px;
        left: -6px;
        cursor: sw-resize;
      }

      &-se {
        bottom: -6px;
        right: -6px;
        cursor: se-resize;
      }
    }

    .sticker-rotate-handle {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        cursor: grabbing;
      }

      &::before {
        content: '';
        position: absolute;
        top: 20px;
        left: 50%;
        width: 2px;
        height: 10px;
        background: #6967fe;
        transform: translateX(-50%);
      }
    }
  }
}
</style>
