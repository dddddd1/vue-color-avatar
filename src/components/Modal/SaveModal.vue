<template>
  <div
    v-if="props.visible"
    class="save-modal-wrapper"
    @click="emit('close')"
  >
    <div class="save-modal" @click.stop>
      <div class="modal-body">
        <h3 class="modal-title">{{ t('action.saveDialogTitle') }}</h3>

        <div class="avatar-preview">
          <img
            alt="vue-color-avatar"
            :src="props.previewUrl"
            class="avatar-img"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('action.inputName') }}</label>
          <input
            v-model="avatarName"
            type="text"
            class="form-input"
            @keyup.enter="handleSave"
            ref="inputRef"
          />
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="cancel-btn" @click="emit('close')">
          {{ t('action.cancel') }}
        </button>
        <button type="button" class="save-btn" @click="handleSave">
          {{ t('action.save') }}
        </button>
      </div>

      <button type="button" class="close-btn" @click="emit('close')">
        {{ t('action.close') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible?: boolean
  previewUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', name: string): void
}>()

const { t } = useI18n()

const avatarName = ref('')
const inputRef = ref<HTMLInputElement>()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      avatarName.value = ''
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

function handleSave() {
  const name = avatarName.value.trim()
  if (name) {
    emit('save', name)
  }
}
</script>

<style lang="scss" scoped>
@use 'src/styles/var';

.save-modal-wrapper {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem 0;
  overflow: hidden;
  transform: translate(-50%, 0);
  backdrop-filter: blur(0.3rem);

  @supports not (backdrop-filter: blur(0.3rem)) {
    background-color: rgba(var.$color-dark, 0.8);
  }
}

.save-modal {
  position: relative;
  width: 50%;
  min-width: 310px;
  max-width: 450px;
  background-color: darken(var.$color-dark, 1);
  border: 0.15rem solid rgba(var.$color-accent, 0.8);
  border-radius: 1rem;

  .modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1.8rem 1.2rem 1rem 1.2rem;

    .modal-title {
      margin: 0 0 1.5rem 0;
      color: var.$color-text;
      font-size: 1.1rem;
    }

    .avatar-preview {
      width: 50%;
      margin: 0 auto 1.5rem auto;

      @media screen and (max-width: var.$screen-md) {
        width: 70%;
      }

      @media screen and (max-width: var.$screen-sm) {
        width: 80%;
      }

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .form-group {
      width: 100%;
      max-width: 280px;

      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        color: var.$color-text;
        font-size: 0.9rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        background-color: lighten(var.$color-gray, 5);
        border: 1px solid rgba(var.$color-accent, 0.3);
        border-radius: 0.5rem;
        color: var.$color-text;
        font-size: 0.95rem;

        &::placeholder {
          color: rgba(var.$color-text, 0.5);
        }

        &:focus {
          outline: none;
          border-color: rgba(var.$color-accent, 0.8);
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    padding: 0 1.5rem 1.5rem 1.5rem;

    .cancel-btn,
    .save-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(var.$color-accent, 0.3);
      border-radius: 0.5rem;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-btn {
      background-color: var.$color-gray;
      color: var.$color-text;

      &:hover {
        background-color: lighten(var.$color-gray, 5);
        border-color: rgba(var.$color-accent, 0.8);
      }
    }

    .save-btn {
      background-color: var.$color-accent;
      color: var.$color-dark;
      font-weight: 500;

      &:hover {
        background-color: lighten(var.$color-accent, 5);
      }
    }
  }

  .close-btn {
    position: absolute;
    right: 1rem;
    bottom: -1rem;
    min-width: 5rem;
    height: 2.5rem;
    margin: 0 1rem;
    margin-left: auto;
    padding: 0 1rem;
    color: var.$color-text;
    font-weight: bold;
    background: var.$color-gray;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    user-select: none;

    &:hover {
      color: lighten(var.$color-text, 10);
      transform: translateY(-0.3rem);
    }
  }
}
</style>