<template>
  <div class="setting-section">
    <div class="section-header">
      <div class="section-title">{{ props.title }}</div>
      <div
        v-if="showLock"
        class="lock-icon"
        :class="{ locked: isLocked }"
        :title="isLocked ? '点击解锁' : '点击锁定'"
        @click="$emit('toggle-lock')"
      >
        <svg v-if="isLocked" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
        </svg>
      </div>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title?: string
  showLock?: boolean
  isLocked?: boolean
}>()

defineEmits<{
  (e: 'toggle-lock'): void
}>()
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.setting-section {
  padding: 1.8rem 1rem;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-weight: bold;
    line-height: 23px;
  }

  .lock-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    cursor: pointer;
    color: darken(var.$color-text, 20);
    transition: color 0.2s;
    border-radius: 0.4rem;

    &:hover {
      color: var.$color-accent;
      background-color: lighten(var.$color-configurator, 5);
    }

    &.locked {
      color: var.$color-accent;
    }
  }
}
</style>
