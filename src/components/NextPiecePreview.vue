<template>
  <div class="next-piece-preview">
    <h3>Next Piece:</h3>
    <div class="preview-grid">
      <div v-for="(row, y) in piece?.shape" :key="y" class="preview-row">
        <div v-for="(cell, x) in row" :key="x" class="preview-cell" :class="{ filled: cell !== 0 }">
          <div class="preview-cell-inner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { Piece } from '@/utils/gameLogic' // Make sure to import the Piece type

export default defineComponent({
  name: 'NextPiecePreview',
  props: {
    piece: {
      type: Object as PropType<Piece>,
      required: true
    }
  }
})
</script>

<style scoped>
.next-piece-preview {
  margin-top: 20px;
  text-align: center;
}

.preview-grid {
  display: inline-block;
  background-color: #f0f0f0;
  border: 2px solid #333;
  padding: 5px;
}

.preview-row {
  display: flex;
}

.preview-cell {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  background-color: #fff;
  box-sizing: border-box;
}

.preview-cell.filled {
  background-color: #42b983;
}
</style>
