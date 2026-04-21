import { computed } from 'vue'

import { WidgetType } from '@/enums'
import { useStore } from '@/store'
import { SET_AVATAR_OPTION, TOGGLE_WIDGET_LOCK } from '@/store/mutation-type'
import type { AvatarOption } from '@/types'

export function useAvatarOption() {
  const store = useStore()

  const avatarOption = computed(() => store.history.present)

  const setAvatarOption = (newOption: AvatarOption) => {
    store[SET_AVATAR_OPTION](newOption)
  }

  const toggleWidgetLock = (widgetType: WidgetType) => {
    store[TOGGLE_WIDGET_LOCK](widgetType)
  }

  return [avatarOption, setAvatarOption, toggleWidgetLock] as const
}
