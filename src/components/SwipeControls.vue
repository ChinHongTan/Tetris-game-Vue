<template>
  <div
    class="swipe-controls"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  ></div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'SwipeControls',
  emits: ['move', 'rotate', 'hardDrop', 'hold'],
  setup(props, { emit }) {
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const touchEndX = ref(0)
    const touchEndY = ref(0)
    const isSwiping = ref(false)

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
      isSwiping.value = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isSwiping.value) {
        isSwiping.value = true
      }
      touchEndX.value = e.touches[0].clientX
      touchEndY.value = e.touches[0].clientY

      const dY = touchEndY.value - touchStartY.value
      if (dY > 0) {
        // Swipe down - move faster
        emit('move', 'down')
      }
    }

    const onTouchEnd = () => {
      if (!isSwiping.value) {
        // Tap
        emit('rotate')
        return
      }
      const dx = touchEndX.value - touchStartX.value
      const dy = touchEndY.value - touchStartY.value

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          emit('move', 'right')
        } else {
          emit('move', 'left')
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          emit('hardDrop')
        } else {
          emit('rotate')
        }
      }

      // Reset
      touchStartX.value = 0
      touchEndY.value = 0
      touchEndX.value = 0
      touchEndY.value = 0
      isSwiping.value = false
    }

    return {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }
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