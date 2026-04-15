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
          :option="avatar.option"
          :size="280"
          :show-background="false"
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

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'
import VueColorAvatar from './VueColorAvatar.vue'

export interface VueColorAvatarMultiRef {
  avatarMultiRef: HTMLDivElement
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

defineExpose({ avatarMultiRef })

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

  const translateX = offsetX
  const translateY = offsetY

  return {
    position: 'absolute' as const,
    left: `${centerX - baseSize / 2}px`,
    top: `${centerY - baseSize / 2}px`,
    width: `${baseSize}px`,
    height: `${baseSize}px`,
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${position.rotation}deg)`,
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
    transition: box-shadow 0.2s ease, z-index 0.2s ease;
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
      background: transparent !important;
      border-radius: 50% !important;
    }

    :deep(.vue-color-avatar.circle) {
      border-radius: 50% !important;
    }

    :deep(.vue-color-avatar.square) {
      border-radius: 0 !important;
    }

    :deep(.vue-color-avatar.squircle) {
      border-radius: 20% !important;
    }
  }
}
</style>
