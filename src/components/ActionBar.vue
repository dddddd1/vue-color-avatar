<template>
  <div class="action-menu">
    <div
      v-for="ac in actions"
      :key="ac.type"
      class="menu-item"
      :class="{ disabled: ac.disabled }"
      :title="ac.tip"
      @click="emit('action', ac.type)"
    >
      <img v-if="ac.icon" :src="ac.icon" :alt="ac.tip" />
      <span v-else class="menu-icon-text">{{ ac.text }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import IconBack from '@/assets/icons/icon-back.svg'
import IconCode from '@/assets/icons/icon-code.svg'
import IconFlip from '@/assets/icons/icon-flip.svg'
import IconNext from '@/assets/icons/icon-next.svg'
import { ActionType } from '@/enums'
import { useStore } from '@/store'
import { useHistoryStore } from '@/store/history-store'

const emit = defineEmits<{
  (e: 'action', actionType: ActionType): void
}>()

const { t } = useI18n()

const store = useStore()
const historyStore = useHistoryStore()

const canUndo = computed(() => store.history.past.length > 0)
const canRedo = computed(() => store.history.future.length > 0)

const actions = computed(() => [
  {
    type: ActionType.Undo,
    icon: IconBack,
    tip: t('action.undo'),
    disabled: !canUndo.value,
    text: '',
  },
  {
    type: ActionType.Redo,
    icon: IconNext,
    tip: t('action.redo'),
    disabled: !canRedo.value,
    text: '',
  },
  {
    type: ActionType.Flip,
    icon: IconFlip,
    tip: t('action.flip'),
    disabled: false,
    text: '',
  },
  {
    type: ActionType.Save,
    icon: null,
    tip: t('action.save'),
    disabled: false,
    text: '💾',
  },
  {
    type: ActionType.History,
    icon: null,
    tip: t('action.history'),
    disabled: false,
    text: '📜',
  },
  {
    type: ActionType.Code,
    icon: IconCode,
    tip: t('action.code'),
    disabled: false,
    text: '',
  },
])
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.action-menu {
  display: flex;
  align-items: center;
  margin-top: 5rem;
  padding: 0.5rem;
  background-color: var.$color-gray;
  border-radius: 2rem;

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    margin: 0 0.5rem;
    background-color: lighten(var.$color-gray, 10);
    border-radius: 50%;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;

    &:hover:not(.disabled) {
      transform: scale(1.1);
    }

    &.disabled {
      cursor: default;
      opacity: 0.6;
    }

    .menu-icon-text {
      font-size: 1.1rem;
    }
  }
}
</style>
