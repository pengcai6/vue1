import { computed } from 'vue'
import { useDarkStore } from '~/stores/dark'

export const isDark = computed(() => useDarkStore().isDark)
export const toggleDark = () => useDarkStore().toggleDark()
export const setDark = (value: boolean) => useDarkStore().setDark(value)
