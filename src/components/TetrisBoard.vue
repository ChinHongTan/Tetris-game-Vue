<template>
  <div class="tetris-board">
    <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
      <div
        v-for="(cell, cellIndex) in row"
        :key="cellIndex"
        :class="{
          cell: true,
          filled: cell > 0,
          ghost: cell === -1
        }"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'TetrisBoard',
  props: {
    board: {
      type: Array as PropType<number[][]>,
      required: true
    }
  }
})
</script>

<style scoped>
.tetris-board {
  display: inline-block;
  border: 2px solid #333;
}

.board-row {
  display: flex;
}

.cell {
  width: 25px;
  height: 25px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.cell.filled {
  background-color: #42b983;
}

.ghost {
  background-color: rgba(66, 185, 131, 0.3); /* Semi-transparent green */
}
</style>
