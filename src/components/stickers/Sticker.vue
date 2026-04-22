<template>
  <div
    class="sticker-wrapper"
    :class="{ 'is-selected': isSelected }"
    :style="wrapperStyle"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
  >
    <div
      class="sticker-content"
      :style="contentStyle"
      v-html="stickerSvg"
    />
    
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--top-left"
      @mousedown.stop="onResizeStart($event, 'top-left')"
      @touchstart.stop="onResizeStart($event, 'top-left')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--top-right"
      @mousedown.stop="onResizeStart($event, 'top-right')"
      @touchstart.stop="onResizeStart($event, 'top-right')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--bottom-left"
      @mousedown.stop="onResizeStart($event, 'bottom-left')"
      @touchstart.stop="onResizeStart($event, 'bottom-left')"
    />
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--bottom-right"
      @mousedown.stop="onResizeStart($event, 'bottom-right')"
      @touchstart.stop="onResizeStart($event, 'bottom-right')"
    />
    
    <div
      v-if="isSelected"
      class="sticker-handle sticker-handle--rotate"
      @mousedown.stop="onRotateStart"
      @touchstart.stop="onRotateStart"
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
      @click.stop="onRemove"
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

const startClientX = ref(0)
const startClientY = ref(0)
const startStickerX = ref(0)
const startStickerY = ref(0)
const startStickerScale = ref(1)
const startStickerRotation = ref(0)
const resizeHandle = ref<string | null>(null)
const pinchStartDistance = ref(0)

function getClientPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  if ('clientX' in e) {
    return { x: e.clientX, y: e.clientY }
  }
  return { x: 0, y: 0 }
}

function emitUpdate(data: Partial<Sticker>) {
  emit('update', data)
}

function onMouseDown(e: MouseEvent) {
  const pos = getClientPos(e)
  isDragging.value = true
  startClientX.value = pos.x
  startClientY.value = pos.y
  startStickerX.value = props.sticker.x
  startStickerY.value = props.sticker.y
  emit('select', props.sticker.id)
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const pos = getClientPos(e)
    isDragging.value = true
    startClientX.value = pos.x
    startClientY.value = pos.y
    startStickerX.value = props.sticker.x
    startStickerY.value = props.sticker.y
    emit('select', props.sticker.id)
  } else if (e.touches.length === 2) {
    isResizing.value = true
    resizeHandle.value = 'pinch'
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    pinchStartDistance.value = Math.sqrt(dx * dx + dy * dy)
    startStickerScale.value = props.sticker.scale
    emit('select', props.sticker.id)
  }
  
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value && !isResizing.value && !isRotating.value) return
  
  const pos = getClientPos(e)
  
  if (isDragging.value) {
    const deltaX = pos.x - startClientX.value
    const deltaY = pos.y - startClientY.value
    
    const newX = startStickerX.value + deltaX
    const newY = startStickerY.value + deltaY
    
    emitUpdate({ x: newX, y: newY })
  }
  
  if (isResizing.value && resizeHandle.value) {
    const deltaX = pos.x - startClientX.value
    const deltaY = pos.y - startClientY.value
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const scaleDelta = distance / 100
    
    let newScale: number
    if (resizeHandle.value === 'bottom-right' || resizeHandle.value === 'top-left') {
      newScale = startStickerScale.value + scaleDelta
    } else {
      newScale = startStickerScale.value - scaleDelta
    }
    
    newScale = Math.max(0.2, Math.min(3, newScale))
    emitUpdate({ scale: newScale })
  }
  
  if (isRotating.value) {
    const cx = startStickerX.value + (40 * startStickerScale.value) / 2
    const cy = startStickerY.value + (40 * startStickerScale.value) / 2
    
    const angleStart = Math.atan2(startClientY.value - cy, startClientX.value - cx)
    const angleCurrent = Math.atan2(pos.y - cy, pos.x - cx)
    
    const angleDelta = (angleCurrent - angleStart) * (180 / Math.PI)
    emitUpdate({ rotation: startStickerRotation.value + angleDelta })
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && isDragging.value) {
    e.preventDefault()
    const pos = getClientPos(e)
    const deltaX = pos.x - startClientX.value
    const deltaY = pos.y - startClientY.value
    
    const newX = startStickerX.value + deltaX
    const newY = startStickerY.value + deltaY
    
    emitUpdate({ x: newX, y: newY })
  } else if (e.touches.length === 2 && isResizing.value) {
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    
    const scaleRatio = currentDistance / pinchStartDistance.value
    let newScale = startStickerScale.value * scaleRatio
    newScale = Math.max(0.2, Math.min(3, newScale))
    emitUpdate({ scale: newScale })
  }
}

function onMouseUp() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  resizeHandle.value = null
  
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

function onTouchEnd() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  resizeHandle.value = null
  
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

function onResizeStart(e: MouseEvent | TouchEvent, handle: string) {
  const pos = getClientPos(e)
  isResizing.value = true
  resizeHandle.value = handle
  startClientX.value = pos.x
  startClientY.value = pos.y
  startStickerScale.value = props.sticker.scale
}

function onRotateStart(e: MouseEvent | TouchEvent) {
  const pos = getClientPos(e)
  isRotating.value = true
  startClientX.value = pos.x
  startClientY.value = pos.y
  startStickerX.value = props.sticker.x
  startStickerY.value = props.sticker.y
  startStickerScale.value = props.sticker.scale
  startStickerRotation.value = props.sticker.rotation
}

function onRemove() {
  emit('remove', props.sticker.id)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<style lang="scss" scoped>
.sticker-wrapper {
  position: absolute;
  cursor: move;
  user-select: none;
  touch-action: none;
  transition: box-shadow 0.2s;
  box-sizing: border-box;

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
      display: block;
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
  box-sizing: border-box;

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
  box-sizing: border-box;

  &:hover {
    transform: scale(1.2);
  }

  svg {
    width: 12px;
    height: 12px;
  }
}
</style>
