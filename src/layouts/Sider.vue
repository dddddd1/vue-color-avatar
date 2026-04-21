<template>
  <aside class="sider" :class="{ collapsed: isCollapsed }">
    <div class="sider-header">
      <div class="avatar-preview">
        <VueColorAvatar :option="avatarOption" :size="120" />
      </div>
    </div>
    <slot />

    <div class="trigger" @click="isCollapsed ? openSider() : closeSider()">
      <img :src="IconRight" class="icon-right" alt="arrow" />
    </div>
  </aside>
</template>

<script lang="ts" setup>
import IconRight from '@/assets/icons/icon-right.svg'
import VueColorAvatar from '@/components/VueColorAvatar.vue'
import { useAvatarOption } from '@/hooks'
import { useSider } from '@/hooks'

const { isCollapsed, openSider, closeSider } = useSider()
const [avatarOption] = useAvatarOption()
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.sider {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 200;
  height: 100%;

  @media (prefers-reduced-motion: no-preference) {
    transition: transform 0.2s;
    will-change: transform;
  }

  .icon-right {
    transition: transform 0.2s;
  }

  &.collapsed {
    transform: translateX(100%);

    .icon-right {
      transform: rotateY(-180deg);
    }
  }

  .sider-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem 1rem;
    background-color: darken(var.$color-configurator, 2);
    border-bottom: 1px solid darken(var.$color-configurator, 5);

    .avatar-preview {
      background-color: #fff;
      border-radius: 50%;
      padding: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .trigger {
    position: absolute;
    top: 50%;
    left: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.2rem;
    height: 4rem;
    background-color: var.$color-configurator;
    border-radius: 0.4rem 0 0 0.4rem;
    transform: translate(-100%, -50%);
    cursor: pointer;
    transition: width 0.2s, background-color 0.2s;

    &:hover {
      width: 1.5rem;
      background-color: lighten(var.$color-configurator, 5);
    }
  }
}
</style>
