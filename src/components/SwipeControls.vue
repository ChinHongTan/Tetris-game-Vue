<template>
  <div
    ref="swipeTarget"
    class="swipe-controls"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  ></div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useSwipe } from '@vueuse/core'

export default defineComponent({
  name: 'SwipeControls',
  emits: ['move', 'rotate', 'hardDrop', 'hold'],
  setup(props, { emit }) {
    const swipeTarget = ref<HTMLElement | null>(null)
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const lastTouchX = ref(0)
    const lastTouchY = ref(0)
    const cellWidth = ref(0)
    const cellHeight = ref(0)
    const swipeStartTime = ref(0)
    const HARD_DROP_THRESHOLD = 200 // milliseconds

    const { isSwiping, direction } = useSwipe(swipeTarget, {
      threshold: 30
    })

    onMounted(() => {
      if (swipeTarget.value) {
        cellWidth.value = swipeTarget.value.clientWidth / 10 // Assuming 10 columns
        cellHeight.value = swipeTarget.value.clientHeight / 20 // Assuming 20 rows
      }
    })

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      touchStartX.value = touch.clientX
      touchStartY.value = touch.clientY
      lastTouchX.value = touch.clientX
      lastTouchY.value = touch.clientY
      swipeStartTime.value = Date.now()
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const currentX = touch.clientX
      const currentY = touch.clientY
      const deltaX = currentX - lastTouchX.value
      const deltaY = currentY - lastTouchY.value

      // Handle horizontal movement
      if (Math.abs(deltaX) >= cellWidth.value) {
        const moves = Math.floor(Math.abs(deltaX) / cellWidth.value)
        const direction = deltaX > 0 ? 'right' : 'left'

        for (let i = 0; i < moves; i++) {
          emit('move', direction)
        }

        lastTouchX.value = currentX
      }

      // Handle vertical movement
      if (deltaY > 0 && deltaY >= cellHeight.value) {
        const moves = Math.floor(deltaY / cellHeight.value)

        for (let i = 0; i < moves; i++) {
          emit('move', 'down')
        }

        lastTouchY.value = currentY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const swipeDuration = Date.now() - swipeStartTime.value
      const totalYMove = e.changedTouches[0].clientY - touchStartY.value

      if (isSwiping.value) {
        if (direction.value === 'up' && totalYMove < -50) {
          emit('hold')
        } else if (direction.value === 'down') {
          if (swipeDuration < HARD_DROP_THRESHOLD && totalYMove > cellHeight.value) {
            // Fast downward swipe triggers hard drop
            emit('hardDrop')
          }
          // else: slow swipes are handled by handleTouchMove for gradual descent
        }
      } else if (
        Math.abs(lastTouchX.value - touchStartX.value) < cellWidth.value &&
        Math.abs(lastTouchY.value - touchStartY.value) < cellHeight.value
      ) {
        // If the touch didn't move much, consider it a tap for rotation
        emit('rotate')
      }
    }

    return { swipeTarget, handleTouchStart, handleTouchMove, handleTouchEnd }
  }
})
</script>

<style scoped>
.swipe-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
