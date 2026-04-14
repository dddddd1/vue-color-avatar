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
        class="avatar-item"
        :class="{
          'avatar-item--selected': index === selectedAvatarIndex,
          'avatar-item--hidden': !avatar.visible,
        }"
        :style="getAvatarItemStyle(avatar.position)"
        @click="handleAvatarClick(index)"
      >
        <VueColorAvatar
          :ref="(el) => setAvatarRef(el, index)"
          :option="avatar.option"
          :size="getAvatarSize(avatar.position.scale)"
        />
      </div>
    </div>

    <Border
      :color="multiAvatarConfig.background.borderColor"
      :radius="getWrapperShapeStyle().borderRadius"
    />
  </div>
</template>

<script lang="ts">
import type VueColorAvatar from './VueColorAvatar.vue'

export interface VueColorAvatarMultiRef {
  avatarMultiRef: HTMLDivElement
  avatarRefs: (InstanceType<typeof VueColorAvatar> | undefined)[]
}
</script>

<script lang="ts" setup>
import { ref, toRefs } from 'vue'

import { WrapperShape } from '@/enums'
import type { AvatarPosition, MultiAvatarConfig } from '@/types'
import { SHAPE_STYLE_SET } from '@/utils/constant'

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'

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

function getAvatarSize(scale: number): number {
  return Math.floor(280 * scale)
}

function getAvatarItemStyle(position: AvatarPosition) {
  return {
    transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale}) rotate(${position.rotation}deg)`,
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .avatar-item {
    position: absolute;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 50%;

    &:hover {
      z-index: 10;
    }

    &--selected {
      z-index: 20;
      box-shadow: 0 0 0 3px rgba(105, 103, 254, 0.5),
        0 0 20px rgba(105, 103, 254, 0.3);
    }

    &--hidden {
      opacity: 0.3;
    }
  }
}
</style>
