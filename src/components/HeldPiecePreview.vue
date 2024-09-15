<template>
  <div class="held-piece-preview">
    <h3>Held Piece</h3>
    <div class="preview-grid" v-if="piece">
      <div v-for="(row, y) in piece" :key="y" class="preview-row">
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="preview-cell"
          :class="{ filled: cell !== 0 }"
        ></div>
      </div>
    </div>
    <div v-else class="empty-preview">
      <p>Empty</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'HeldPiecePreview',
  props: {
    piece: {
      type: Array as PropType<number[][] | null>,
      default: null
    }
  }
})
</script>

<style scoped>
.held-piece-preview {
  margin-top: 20px;
  text-align: center;
}

.preview-grid,
.empty-preview {
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

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
</style>
