<template>
  <div
    ref="stickerWrapperRef"
    class="sticker-wrapper"
    :class="{ 'is-selected': isSelected }"
    :style="wrapperStyle"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <div
      class="sticker-content"
      :style="contentStyle"
      v-html="stickerSvg"
    />
    
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--top-left"
      @mousedown.stop="(e) => handleResizeStart(e, 'top-left')"
      @touchstart.stop="(e) => handleResizeStart(e, 'top-left')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--top-right"
      @mousedown.stop="(e) => handleResizeStart(e, 'top-right')"
      @touchstart.stop="(e) => handleResizeStart(e, 'top-right')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--bottom-left"
      @mousedown.stop="(e) => handleResizeStart(e, 'bottom-left')"
      @touchstart.stop="(e) => handleResizeStart(e, 'bottom-left')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--bottom-right"
      @mousedown.stop="(e) => handleResizeStart(e, 'bottom-right')"
      @touchstart.stop="(e) => handleResizeStart(e, 'bottom-right')"
    />
    
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--rotate"
      @mousedown.stop="handleRotateStart"
      @touchstart.stop="handleRotateStart"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 14.01 17.75 14.97 17.32 15.83L18.78 17.29C19.55 16.02 20 14.57 20 13C20 8.58 16.42 5 12 5ZM4.41 11L5.86 9.55C5.43 8.69 5.2 7.73 5.2 6.75C5.2 5.2 5.75 3.75 6.72 2.56L8.18 4.02C7.45 5.29 7 6.74 7 8.25C7 9.27 7.25 10.23 7.68 11.1L6.22 9.64L4.41 11ZM11 18.93V14.07L9.41 15.66L11 18.93ZM13 18.93L14.59 15.66L13 14.07V18.93ZM17.32 8.17L18.78 6.71C18.01 5.44 16.57 4.5 15 4.5C13.45 4.5 12.02 5.42 11.28 6.67L12.72 8.13C13.17 7.43 14.03 7 15 7C15.97 7 16.83 7.43 17.32 8.17ZM6.68 15.83C6.25 14.97 6 14.01 6 13C6 11.43 6.45 9.98 7.22 8.71L8.68 10.17C8.19 10.87 7.99 11.73 8 12.75C8 13.72 8.23 14.65 8.67 15.5L7.21 16.96C6.98 16.6 6.81 16.22 6.68 15.83ZM12 19.5C10.45 19.5 9.02 18.58 8.28 17.33L9.72 15.87C10.17 16.57 11.03 17 12 17C12.97 17 13.83 16.57 14.32 15.83L15.78 17.29C15.05 18.56 13.6 19.5 12 19.5Z"
          fill="#333"
        />
      </svg>
    </div>
    
    <div
      v-if="isSelected"
      class="sticker-remove"
      @click.stop="handleRemove"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
          fill="#fff"
        />
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
export interface StickerRef {
  stickerWrapper: HTMLDivElement
}
</script>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'

import type { Sticker } from '@/types'
import { stickerData } from '@/utils/dynamic-data'

interface StickerProps {
  sticker: Sticker
  isSelected?: boolean
  avatarSize: number
}

const props = withDefaults(defineProps<StickerProps>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'update', sticker: Partial<Sticker>): void
  (e: 'select', stickerId: string): void
  (e: 'remove', stickerId: string): void
}>()

const stickerSvg = ref('')
const stickerWrapperRef = ref<HTMLDivElement>()

watch(
  () => props.sticker,
  async (newSticker) => {
    if (stickerData?.[newSticker.category]?.[newSticker.shape]) {
      const raw = (await stickerData[newSticker.category][newSticker.shape]())
        .default
      stickerSvg.value = raw
    }
  },
  { immediate: true, deep: true }
)

const stickerWidth = computed(() => 40 * props.sticker.scale)
const stickerHeight = computed(() => 40 * props.sticker.scale)

const wrapperStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.sticker.x}px`,
  top: `${props.sticker.y}px`,
  zIndex: props.sticker.zIndex,
  opacity: props.sticker.opacity,
  width: `${stickerWidth.value}px`,
  height: `${stickerHeight.value}px`,
}))

const contentStyle = computed(() => ({
  transform: `rotate(${props.sticker.rotation}deg)`,
  width: '100%',
  height: '100%',
}))

const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const initialX = ref(0)
const initialY = ref(0)
const initialScale = ref(1)
const initialRotation = ref(0)
const resizeHandle = ref<string | null>(null)
const initialDistance = ref(0)

function getEventPosition(e: MouseEvent | TouchEvent) {
  if ('touches' in e) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

function getParentContainer(): HTMLElement | null {
  if (!stickerWrapperRef.value) return null
  let parent = stickerWrapperRef.value.parentElement
  while (parent && !parent.classList.contains('stickers-layer')) {
    parent = parent.parentElement
  }
  return parent
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  const parent = getParentContainer()
  if (!parent) return { x, y }
  
  const parentRect = parent.getBoundingClientRect()
  const minX = -stickerWidth.value / 2
  const minY = -stickerHeight.value / 2
  const maxX = parentRect.width - stickerWidth.value / 2
  const maxY = parentRect.height - stickerHeight.value / 2
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  }
}

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  const pos = getEventPosition(e)
  isDragging.value = true
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  initialX.value = props.sticker.x
  initialY.value = props.sticker.y
  emit('select', props.sticker.id)
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const pos = getEventPosition(e)
    isDragging.value = true
    dragStartX.value = pos.x
    dragStartY.value = pos.y
    initialX.value = props.sticker.x
    initialY.value = props.sticker.y
    emit('select', props.sticker.id)
  } else if (e.touches.length === 2) {
    isResizing.value = true
    resizeHandle.value = 'pinch'
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    initialDistance.value = Math.sqrt(dx * dx + dy * dy)
    initialScale.value = props.sticker.scale
    emit('select', props.sticker.id)
  }
  
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault()
  if (!isDragging.value && !isResizing.value && !isRotating.value) return
  
  const pos = getEventPosition(e)
  
  if (isDragging.value) {
    const dx = pos.x - dragStartX.value
    const dy = pos.y - dragStartY.value
    
    let newX = initialX.value + dx
    let newY = initialY.value + dy
    
    const clamped = clampPosition(newX, newY)
    
    emit('update', {
      x: clamped.x,
      y: clamped.y,
    })
  }
  
  if (isResizing.value && resizeHandle.value) {
    const dx = pos.x - dragStartX.value
    const dy = pos.y - dragStartY.value
    const distance = Math.sqrt(dx * dx + dy * dy)
    const scaleChange = distance / 100
    
    let newScale: number
    if (resizeHandle.value === 'bottom-right' || resizeHandle.value === 'top-left') {
      newScale = initialScale.value + scaleChange
    } else {
      newScale = initialScale.value - scaleChange
    }
    
    newScale = Math.max(0.2, Math.min(3, newScale))
    
    emit('update', {
      scale: newScale,
    })
  }
  
  if (isRotating.value) {
    const cx = initialX.value + (40 * initialScale.value) / 2
    const cy = initialY.value + (40 * initialScale.value) / 2
    
    const angleStart = Math.atan2(dragStartY.value - cy, dragStartX.value - cx)
    const angleCurrent = Math.atan2(pos.y - cy, pos.x - cx)
    
    let angleDiff = (angleCurrent - angleStart) * (180 / Math.PI)
    
    emit('update', {
      rotation: initialRotation.value + angleDiff,
    })
  }
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 1 && isDragging.value) {
    const pos = getEventPosition(e)
    const dx = pos.x - dragStartX.value
    const dy = pos.y - dragStartY.value
    
    let newX = initialX.value + dx
    let newY = initialY.value + dy
    
    const clamped = clampPosition(newX, newY)
    
    emit('update', {
      x: clamped.x,
      y: clamped.y,
    })
  } else if (e.touches.length === 2 && isResizing.value) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    
    const scaleRatio = currentDistance / initialDistance.value
    let newScale = initialScale.value * scaleRatio
    newScale = Math.max(0.2, Math.min(3, newScale))
    
    emit('update', {
      scale: newScale,
    })
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  resizeHandle.value = null
  
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

function handleTouchEnd() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  resizeHandle.value = null
  
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
}

function handleResizeStart(
  e: MouseEvent | TouchEvent,
  handle: string
) {
  e.preventDefault()
  const pos = getEventPosition(e)
  isResizing.value = true
  resizeHandle.value = handle
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  initialScale.value = props.sticker.scale
}

function handleRotateStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  const pos = getEventPosition(e)
  isRotating.value = true
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  initialX.value = props.sticker.x
  initialY.value = props.sticker.y
  initialScale.value = props.sticker.scale
  initialRotation.value = props.sticker.rotation
}

function handleRemove() {
  emit('remove', props.sticker.id)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style lang="scss" scoped>
.sticker-wrapper {
  position: absolute;
  cursor: move;
  user-select: none;
  touch-action: none;
  transition: box-shadow 0.2s;

  &.is-selected {
    box-shadow: 0 0 0 2px #506af4;
  }

  .sticker-content {
    width: 100%;
    height: 100%;
    pointer-events: none;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }
}

.sticker-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #506af4;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;

  &--top-left {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
  }

  &--top-right {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
  }

  &--bottom-left {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
  }

  &--bottom-right {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
  }

  &--rotate {
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: #506af4;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    svg {
      width: 10px;
      height: 10px;

      path {
        fill: #fff;
      }
    }
  }
}

.sticker-remove {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 20px;
  height: 20px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }

  svg {
    width: 12px;
    height: 12px;
  }
}
</style>