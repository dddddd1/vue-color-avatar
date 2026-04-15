<template>
  <div
    ref="avatarMultiRef"
    class="vue-color-avatar-multi"
    :style="{
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      ...getWrapperShapeStyle(),
    }"
    :class="getWrapperShapeClassName()"
  >
    <Background :color="multiAvatarConfig.background.color" />

    <div class="avatars-container">
      <div
        v-for="(avatar, index) in multiAvatarConfig.avatars"
        :key="avatar.id"
        class="avatar-item-wrapper"
        :class="{
          'avatar-item-wrapper--selected': index === selectedAvatarIndex,
        }"
        :style="getAvatarWrapperStyle(avatar.position)"
        @click="handleAvatarClick(index)"
      >
        <VueColorAvatar
          :ref="(el) => setAvatarRef(el, index)"
          :option="avatar.option"
          :size="280"
        />
      </div>
    </div>

    <Border
      :color="multiAvatarConfig.background.borderColor"
      :radius="getWrapperShapeStyle().borderRadius"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, toRefs } from 'vue'

import { WrapperShape } from '@/enums'
import type { AvatarPosition, MultiAvatarConfig } from '@/types'
import { SHAPE_STYLE_SET } from '@/utils/constant'

import type VueColorAvatar from './VueColorAvatar.vue'
import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'

export interface VueColorAvatarMultiRef {
  avatarMultiRef: HTMLDivElement
  avatarRefs: (InstanceType<typeof VueColorAvatar> | undefined)[]
}

interface VueColorAvatarMultiProps {
  config: MultiAvatarConfig
  size?: number
  selectedAvatarIndex?: number
}

const props = withDefaults(defineProps<VueColorAvatarMultiProps>(), {
  size: 400,
  selectedAvatarIndex: 0,
})

const {
  config: multiAvatarConfig,
  size: avatarSize,
  selectedAvatarIndex,
} = toRefs(props)

const avatarMultiRef = ref<VueColorAvatarMultiRef['avatarMultiRef']>()
const avatarRefs = ref<(InstanceType<typeof VueColorAvatar> | undefined)[]>([])

function setAvatarRef(el: unknown, index: number) {
  if (el) {
    avatarRefs.value[index] = el as InstanceType<typeof VueColorAvatar>
  }
}

defineExpose({ avatarMultiRef, avatarRefs })

function getWrapperShapeClassName() {
  return {
    [WrapperShape.Circle]:
      multiAvatarConfig.value.wrapperShape === WrapperShape.Circle,
    [WrapperShape.Square]:
      multiAvatarConfig.value.wrapperShape === WrapperShape.Square,
    [WrapperShape.Squircle]:
      multiAvatarConfig.value.wrapperShape === WrapperShape.Squircle,
  }
}

function getWrapperShapeStyle() {
  return SHAPE_STYLE_SET[
    multiAvatarConfig.value.wrapperShape ?? WrapperShape.Circle
  ]
}

function getAvatarWrapperStyle(position: AvatarPosition) {
  const baseSize = 280
  const containerSize = avatarSize.value
  const scale = position.scale

  const centerX = containerSize / 2
  const centerY = containerSize / 2

  const offsetX = position.x
  const offsetY = position.y

  const left = centerX - (baseSize * scale) / 2 + offsetX
  const top = centerY - (baseSize * scale) / 2 + offsetY

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${baseSize * scale}px`,
    height: `${baseSize * scale}px`,
    transform: `rotate(${position.rotation}deg)`,
    transformOrigin: 'center center',
  }
}

const emit = defineEmits<{
  (e: 'selectAvatar', index: number): void
}>()

function handleAvatarClick(index: number) {
  emit('selectAvatar', index)
}
</script>

<style lang="scss" scoped>
.vue-color-avatar-multi {
  position: relative;
  overflow: hidden;

  .avatars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .avatar-item-wrapper {
    cursor: pointer;
    transition: box-shadow 0.2s ease;
    border-radius: 50%;

    &:hover {
      z-index: 10;
    }

    &--selected {
      z-index: 20;
      box-shadow: 0 0 0 3px rgba(105, 103, 254, 0.5),
        0 0 20px rgba(105, 103, 254, 0.3);
    }

    :deep(.vue-color-avatar) {
      width: 100% !important;
      height: 100% !important;
    }
  }
}
</style>
